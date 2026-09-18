import { query, withTransaction } from '../config/db.js'

function todayDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const publicProduct = (p) => ({
  id: p.id,
  name: p.name,
  unit: p.unit,
  price: Number(p.price),
  icon: p.icon,
  imageUrl: p.image_url,
  imageSource: p.image_source,
  stockStatus: p.stock_status,
  stock: Number(p.stock || 0),
  minOrderQty: Number(p.min_order_qty || 1),
})

// Great-circle distance between two lat/lng points, in kilometers.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function listShops(req, res) {
  try {
    const { rows: shops } = await query('SELECT * FROM material_shops ORDER BY id')
    const { rows: products } = await query('SELECT * FROM material_products ORDER BY id')

    const productsByShop = new Map()
    for (const p of products) {
      if (!productsByShop.has(p.shop_id)) productsByShop.set(p.shop_id, [])
      productsByShop.get(p.shop_id).push(p)
    }

    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const hasCustomerCoords = Number.isFinite(lat) && Number.isFinite(lng)

    let result = shops.map((s) => {
      const shopLat = s.latitude === null ? null : Number(s.latitude)
      const shopLng = s.longitude === null ? null : Number(s.longitude)
      const distanceKm =
        hasCustomerCoords && shopLat !== null && shopLng !== null
          ? Math.round(haversineKm(lat, lng, shopLat, shopLng) * 10) / 10
          : null
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        location: s.location,
        address: s.address,
        latitude: shopLat,
        longitude: shopLng,
        rating: s.rating === null ? null : Number(s.rating),
        deliveryAvailable: s.delivery_available,
        deliveryEtaHours: s.delivery_eta_hours,
        distanceKm,
        products: (productsByShop.get(s.id) || []).map(publicProduct),
      }
    })

    if (hasCustomerCoords) {
      result = result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    }

    res.json({ shops: result })
  } catch (err) {
    console.error('List shops error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listOrders(req, res) {
  try {
    const { rows: orders } = await query(
      `SELECT o.*, s.name AS shop_name FROM material_orders o
       JOIN material_shops s ON s.id = o.shop_id
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    )
    const { rows: items } = await query(
      `SELECT oi.* FROM material_order_items oi
       JOIN material_orders o ON o.id = oi.order_id
       WHERE o.user_id = $1`,
      [req.user.id]
    )
    const itemsByOrder = new Map()
    for (const it of items) {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, [])
      itemsByOrder.get(it.order_id).push({
        productName: it.product_name,
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        quantity: it.quantity,
      })
    }

    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        displayId: `MO-${100 + Number(o.seq)}`,
        shopId: o.shop_id,
        shopName: o.shop_name,
        totalAmount: Number(o.total_amount),
        status: o.status,
        createdAt: o.created_at,
        items: itemsByOrder.get(o.id) || [],
      })),
    })
  } catch (err) {
    console.error('List orders error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createOrder(req, res) {
  const { shopId, items } = req.body ?? {}

  if (!shopId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Choose a shop and at least one item' })
  }

  try {
    const order = await withTransaction(async (client) => {
      const { rows: shopRows } = await client.query('SELECT * FROM material_shops WHERE id = $1', [shopId])
      if (!shopRows.length) throw new Error('SHOP_NOT_FOUND')
      const shop = shopRows[0]

      const { rows: productRows } = await client.query('SELECT * FROM material_products WHERE shop_id = $1 FOR UPDATE', [shopId])
      const productMap = new Map(productRows.map((p) => [p.id, p]))
      const requestedItems = [...items.reduce((map, item) => {
        const quantity = Number(item.quantity)
        if (item?.productId && Number.isInteger(quantity) && quantity > 0) {
          map.set(item.productId, (map.get(item.productId) || 0) + quantity)
        }
        return map
      }, new Map())].map(([productId, quantity]) => ({ productId, quantity }))

      let total = 0
      const resolvedItems = []
      for (const item of requestedItems) {
        const product = productMap.get(item.productId)
        const quantity = Number(item.quantity)
        if (!product || !Number.isInteger(quantity) || quantity < 1) continue
        if (product.stock_status === 'out_of_stock' || Number(product.stock) < quantity) {
          throw new Error('INSUFFICIENT_STOCK')
        }
        const unitPrice = Number(product.price)
        total += unitPrice * quantity
        resolvedItems.push({ name: product.name, unit: product.unit, unitPrice, quantity })
      }
      if (!resolvedItems.length) throw new Error('NO_VALID_ITEMS')

      const { rows: orderRows } = await client.query(
        `INSERT INTO material_orders (user_id, shop_id, total_amount) VALUES ($1, $2, $3) RETURNING *`,
        [req.user.id, shopId, total]
      )
      const newOrder = orderRows[0]

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO material_order_items (order_id, product_name, unit, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [newOrder.id, item.name, item.unit, item.unitPrice, item.quantity]
        )
      }

      for (const item of requestedItems) {
        await client.query(
          `UPDATE material_products SET stock = stock - $1, stock_status = CASE
            WHEN stock - $1 <= 0 THEN 'out_of_stock'
            WHEN stock - $1 <= 3 THEN 'low_stock'
            ELSE 'in_stock' END
           WHERE id = $2 AND shop_id = $3`,
          [item.quantity, item.productId, shopId]
        )
      }

      await client.query(
        `INSERT INTO calendar_events (user_id, title, notes, event_date, event_type)
         VALUES ($1, $2, $3, $4, 'delivery')`,
        [req.user.id, `Material delivery: ${shop.name}`, `${resolvedItems.length} item(s), ₹${total.toFixed(2)}`, todayDateKey()]
      )

      return { ...newOrder, shop_name: shop.name, items: resolvedItems }
    })

    res.status(201).json({
      order: {
        id: order.id,
        displayId: `MO-${100 + Number(order.seq)}`,
        shopId: order.shop_id,
        shopName: order.shop_name,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        items: order.items.map((i) => ({ productName: i.name, unit: i.unit, unitPrice: i.unitPrice, quantity: i.quantity })),
      },
    })
  } catch (err) {
    if (err.message === 'SHOP_NOT_FOUND' || err.message === 'NO_VALID_ITEMS' || err.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ message: 'That order could not be placed. Please check your cart and try again.' })
    }
    console.error('Create order error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

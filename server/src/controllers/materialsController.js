import { query, withTransaction } from '../config/db.js'
import { searchSupplierMaterials } from './suppliersController.js'

function todayDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const publicCategory = (c) => ({
  id: c.id, name: c.name, parentCategoryId: c.parent_category_id, sortOrder: c.sort_order, isActive: c.is_active,
})

export async function listCategoriesHandler(req, res) {
  try {
    const { rows } = await query('SELECT * FROM material_categories WHERE is_active = true ORDER BY sort_order, name')
    res.json({ categories: rows.map(publicCategory) })
  } catch (err) {
    console.error('List material categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const publicMaterial = (m) => ({
  id: m.id,
  name: m.name,
  category: m.category_name,
  categoryId: m.category_id,
  subcategoryId: m.subcategory_id,
  brand: m.brand_name,
  brandId: m.brand_id,
  description: m.description,
  specification: m.specification,
  grade: m.grade,
  unit: m.unit,
  imageUrl: m.image_url,
  imageSource: m.image_source,
  active: m.active,
})

export async function listMaterialsHandler(req, res) {
  try {
    const params = []
    const where = ['m.active = true']
    if (req.query.q && req.query.q.trim()) {
      params.push(`%${req.query.q.trim()}%`)
      where.push(`(m.name ILIKE $${params.length} OR m.search_keywords ILIKE $${params.length})`)
    }
    if (req.query.categoryId) { params.push(req.query.categoryId); where.push(`m.category_id = $${params.length}`) }
    const limit = Math.min(Number(req.query.pageSize) || 50, 100)
    params.push(limit)
    const { rows } = await query(
      `SELECT m.*, c.name AS category_name, b.name AS brand_name FROM materials m
       LEFT JOIN material_categories c ON c.id = m.category_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE ${where.join(' AND ')} ORDER BY m.name LIMIT $${params.length}`,
      params
    )
    res.json({ materials: rows.map(publicMaterial) })
  } catch (err) {
    console.error('List materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function getMaterialHandler(req, res) {
  try {
    const { rows } = await query(
      `SELECT m.*, c.name AS category_name, b.name AS brand_name FROM materials m
       LEFT JOIN material_categories c ON c.id = m.category_id
       LEFT JOIN brands b ON b.id = m.brand_id
       WHERE m.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Material not found' })
    res.json({ material: publicMaterial(rows[0]) })
  } catch (err) {
    console.error('Get material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function materialSuppliersHandler(req, res) {
  try {
    const results = await searchSupplierMaterials({
      materialId: req.params.id,
      lat: Number(req.query.lat), lng: Number(req.query.lng),
      radiusKm: req.query.radiusKm === 'all' ? 'all' : req.query.radiusKm,
      state: req.query.state, city: req.query.city, pincode: req.query.pincode,
      sort: req.query.sort, page: req.query.page, pageSize: req.query.pageSize,
    })
    res.json({ results })
  } catch (err) {
    console.error('Material suppliers error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// The main "search construction materials near me" surface: combines free
// text (material/brand name), category, and location/radius/sort in one
// call, so a query like "Ultratech OPC 53 Cement" returns supplier cards
// (material + brand + spec + supplier + location + inventory + price)
// directly, without a separate per-material lookup round trip.
export async function searchMaterialsHandler(req, res) {
  try {
    const results = await searchSupplierMaterials({
      q: req.query.q,
      lat: Number(req.query.lat), lng: Number(req.query.lng),
      radiusKm: req.query.radiusKm === 'all' ? 'all' : req.query.radiusKm,
      state: req.query.state, district: req.query.district, city: req.query.city, pincode: req.query.pincode,
      categoryId: req.query.categoryId,
      inStockOnly: req.query.inStockOnly === 'true', deliveryOnly: req.query.deliveryOnly === 'true',
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      sort: req.query.sort, page: req.query.page, pageSize: req.query.pageSize,
    })
    res.json({ results })
  } catch (err) {
    console.error('Search materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listOrdersHandler(req, res) {
  try {
    const { rows: orders } = await query(
      `SELECT o.*, s.business_name AS supplier_name FROM material_orders o
       JOIN suppliers s ON s.id = o.supplier_id
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
        productName: it.product_name, unit: it.unit, unitPrice: Number(it.unit_price), quantity: it.quantity,
      })
    }
    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        displayId: `MO-${100 + Number(o.seq)}`,
        supplierId: o.supplier_id,
        supplierName: o.supplier_name,
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

export async function createOrderHandler(req, res) {
  const { supplierId, items } = req.body ?? {}
  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Choose a supplier and at least one item' })
  }

  try {
    const order = await withTransaction(async (client) => {
      const { rows: supplierRows } = await client.query('SELECT * FROM suppliers WHERE id = $1', [supplierId])
      if (!supplierRows.length) throw new Error('SUPPLIER_NOT_FOUND')
      const supplier = supplierRows[0]

      const requestedItems = [...items.reduce((map, item) => {
        const quantity = Number(item.quantity)
        if (item?.supplierMaterialId && Number.isInteger(quantity) && quantity > 0) {
          map.set(item.supplierMaterialId, (map.get(item.supplierMaterialId) || 0) + quantity)
        }
        return map
      }, new Map())].map(([supplierMaterialId, quantity]) => ({ supplierMaterialId, quantity }))
      if (!requestedItems.length) throw new Error('NO_VALID_ITEMS')

      const { rows: smRows } = await client.query(
        `SELECT sm.*, inv.id AS inv_id, inv.quantity AS inv_quantity, inv.stock_status,
                mp.id AS price_id, mp.price
         FROM supplier_materials sm
         LEFT JOIN inventory inv ON inv.supplier_material_id = sm.id
         LEFT JOIN material_prices mp ON mp.supplier_material_id = sm.id AND mp.valid_until IS NULL
         WHERE sm.supplier_id = $1 AND sm.id = ANY($2::uuid[]) FOR UPDATE OF sm`,
        [supplierId, requestedItems.map((i) => i.supplierMaterialId)]
      )
      const smMap = new Map(smRows.map((r) => [r.id, r]))

      let total = 0
      const resolvedItems = []
      for (const item of requestedItems) {
        const sm = smMap.get(item.supplierMaterialId)
        if (!sm || !sm.available || sm.price == null) continue
        if (sm.stock_status === 'OUT_OF_STOCK') throw new Error('INSUFFICIENT_STOCK')
        if (sm.inv_quantity != null && Number(sm.inv_quantity) < item.quantity) throw new Error('INSUFFICIENT_STOCK')
        const unitPrice = Number(sm.price)
        total += unitPrice * item.quantity
        resolvedItems.push({ supplierMaterialId: sm.id, name: sm.product_name, unit: sm.unit, unitPrice, quantity: item.quantity })
      }
      if (!resolvedItems.length) throw new Error('NO_VALID_ITEMS')

      const { rows: orderRows } = await client.query(
        `INSERT INTO material_orders (user_id, supplier_id, total_amount) VALUES ($1, $2, $3) RETURNING *`,
        [req.user.id, supplierId, total]
      )
      const newOrder = orderRows[0]

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO material_order_items (order_id, supplier_material_id, product_name, unit, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newOrder.id, item.supplierMaterialId, item.name, item.unit, item.unitPrice, item.quantity]
        )
        await client.query(
          `UPDATE inventory SET quantity = GREATEST(COALESCE(quantity, 0) - $1, 0), stock_status = CASE
             WHEN COALESCE(quantity, 0) - $1 <= 0 THEN 'OUT_OF_STOCK'
             WHEN COALESCE(quantity, 0) - $1 <= 3 THEN 'LIMITED'
             ELSE stock_status END, last_updated_at = now()
           WHERE supplier_material_id = $2`,
          [item.quantity, item.supplierMaterialId]
        )
      }

      await client.query(
        `INSERT INTO calendar_events (user_id, title, notes, event_date, event_type)
         VALUES ($1, $2, $3, $4, 'delivery')`,
        [req.user.id, `Material delivery: ${supplier.business_name}`, `${resolvedItems.length} item(s), ₹${total.toFixed(2)}`, todayDateKey()]
      )

      return { ...newOrder, supplier_name: supplier.business_name, items: resolvedItems }
    })

    res.status(201).json({
      order: {
        id: order.id,
        displayId: `MO-${100 + Number(order.seq)}`,
        supplierId: order.supplier_id,
        supplierName: order.supplier_name,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        items: order.items.map((i) => ({ productName: i.name, unit: i.unit, unitPrice: i.unitPrice, quantity: i.quantity })),
      },
    })
  } catch (err) {
    if (['SUPPLIER_NOT_FOUND', 'NO_VALID_ITEMS', 'INSUFFICIENT_STOCK'].includes(err.message)) {
      return res.status(400).json({ message: 'That order could not be placed. Please check your cart and try again.' })
    }
    console.error('Create order error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

import Material from '../models/Material.js'
import MaterialCategory from '../models/MaterialCategory.js'
import Brand from '../models/Brand.js'
import Supplier from '../models/Supplier.js'
import SupplierMaterial from '../models/SupplierMaterial.js'
import Inventory from '../models/Inventory.js'
import MaterialPrice from '../models/MaterialPrice.js'
import MaterialOrder from '../models/MaterialOrder.js'
import CalendarEvent from '../models/CalendarEvent.js'
import { nextSeq } from '../models/Counter.js'
import { searchSupplierMaterials } from './suppliersController.js'
import { withTransaction } from '../config/mongo.js'

function todayDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const publicCategory = (c) => ({ id: c._id, name: c.name, parentCategoryId: c.parent_category_id, sortOrder: c.sort_order, isActive: c.is_active })

export async function listCategoriesHandler(req, res) {
  try {
    const categories = await MaterialCategory.find({ is_active: true }).sort({ sort_order: 1, name: 1 }).lean()
    res.json({ categories: categories.map(publicCategory) })
  } catch (err) {
    console.error('List material categories error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const publicMaterial = (m, categoryName, brandName) => ({
  id: m._id, name: m.name, category: categoryName, categoryId: m.category_id, subcategoryId: m.subcategory_id,
  brand: brandName, brandId: m.brand_id, description: m.description, specification: m.specification, grade: m.grade,
  unit: m.unit, imageUrl: m.image_url, imageSource: m.image_source, active: m.active,
})

export async function listMaterialsHandler(req, res) {
  try {
    const filter = { active: true }
    if (req.query.q && req.query.q.trim()) {
      const re = new RegExp(req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: re }, { search_keywords: re }]
    }
    if (req.query.categoryId) filter.category_id = req.query.categoryId
    const limit = Math.min(Number(req.query.pageSize) || 50, 100)
    const materials = await Material.find(filter).sort({ name: 1 }).limit(limit).lean()

    const categoryIds = [...new Set(materials.map((m) => m.category_id).filter(Boolean))]
    const brandIds = [...new Set(materials.map((m) => m.brand_id).filter(Boolean))]
    const [categories, brands] = await Promise.all([
      MaterialCategory.find({ _id: { $in: categoryIds } }).select('_id name').lean(),
      Brand.find({ _id: { $in: brandIds } }).select('_id name').lean(),
    ])
    const categoryById = new Map(categories.map((c) => [c._id, c.name]))
    const brandById = new Map(brands.map((b) => [b._id, b.name]))

    res.json({ materials: materials.map((m) => publicMaterial(m, categoryById.get(m.category_id), brandById.get(m.brand_id))) })
  } catch (err) {
    console.error('List materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function getMaterialHandler(req, res) {
  try {
    const material = await Material.findById(req.params.id).lean()
    if (!material) return res.status(404).json({ message: 'Material not found' })
    const category = material.category_id ? await MaterialCategory.findById(material.category_id).select('name').lean() : null
    const brand = material.brand_id ? await Brand.findById(material.brand_id).select('name').lean() : null
    res.json({ material: publicMaterial(material, category?.name, brand?.name) })
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
    const orders = await MaterialOrder.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean()
    const supplierIds = [...new Set(orders.map((o) => o.supplier_id))]
    const suppliers = await Supplier.find({ _id: { $in: supplierIds } }).select('_id business_name').lean()
    const nameById = new Map(suppliers.map((s) => [s._id, s.business_name]))

    res.json({
      orders: orders.map((o) => ({
        id: o._id, displayId: `MO-${100 + Number(o.seq)}`, supplierId: o.supplier_id, supplierName: nameById.get(o.supplier_id),
        totalAmount: Number(o.total_amount), status: o.status, createdAt: o.created_at,
        items: o.items.map((i) => ({ productName: i.product_name, unit: i.unit, unitPrice: Number(i.unit_price), quantity: i.quantity })),
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
    const order = await withTransaction(async (session) => {
      const supplier = await Supplier.findById(supplierId).session(session)
      if (!supplier) throw new Error('SUPPLIER_NOT_FOUND')

      const requestedItems = [...items.reduce((map, item) => {
        const quantity = Number(item.quantity)
        if (item?.supplierMaterialId && Number.isInteger(quantity) && quantity > 0) {
          map.set(item.supplierMaterialId, (map.get(item.supplierMaterialId) || 0) + quantity)
        }
        return map
      }, new Map())].map(([supplierMaterialId, quantity]) => ({ supplierMaterialId, quantity }))
      if (!requestedItems.length) throw new Error('NO_VALID_ITEMS')

      const smDocs = await SupplierMaterial.find({ supplier_id: supplierId, _id: { $in: requestedItems.map((i) => i.supplierMaterialId) } }).session(session).lean()
      const smMap = new Map(smDocs.map((sm) => [sm._id, sm]))
      const invDocs = await Inventory.find({ supplier_material_id: { $in: [...smMap.keys()] } }).session(session).lean()
      const invBySm = new Map(invDocs.map((i) => [i.supplier_material_id, i]))
      const priceDocs = await MaterialPrice.find({ supplier_material_id: { $in: [...smMap.keys()] }, valid_until: null }).session(session).lean()
      const priceBySm = new Map(priceDocs.map((p) => [p.supplier_material_id, p]))

      let total = 0
      const resolvedItems = []
      for (const item of requestedItems) {
        const sm = smMap.get(item.supplierMaterialId)
        const price = sm ? priceBySm.get(sm._id) : null
        const inv = sm ? invBySm.get(sm._id) : null
        // Same guard set as the Postgres version: skip (not order) anything
        // unavailable, priceless, or missing a real product name — no
        // fallback name is fabricated for a listing that predates validation.
        if (!sm || !sm.available || price == null || !sm.product_name) continue
        if (inv?.stock_status === 'OUT_OF_STOCK') throw new Error('INSUFFICIENT_STOCK')
        const unitPrice = Number(price.price)
        total += unitPrice * item.quantity
        resolvedItems.push({
          supplierMaterialId: sm._id, name: sm.product_name, unit: sm.unit, unitPrice, quantity: item.quantity,
          isQuantityTracked: inv?.quantity != null,
        })
      }
      if (!resolvedItems.length) throw new Error('NO_VALID_ITEMS')

      const seq = await nextSeq('material_orders')
      const [newOrder] = await MaterialOrder.create(
        [{
          user_id: req.user.id, seq, supplier_id: supplierId, total_amount: total, status: 'placed',
          items: resolvedItems.map((i) => ({ supplier_material_id: i.supplierMaterialId, product_name: i.name, unit: i.unit, unit_price: i.unitPrice, quantity: i.quantity })),
        }],
        { session }
      )

      for (const item of resolvedItems) {
        if (!item.isQuantityTracked) continue

        // Atomic guarded decrement — findOneAndUpdate's filter and update are
        // evaluated as a single atomic operation by MongoDB, exactly like the
        // Postgres `UPDATE ... WHERE quantity >= $1` this replaces. A null
        // result here (not an unlocked read-then-check) is the actual proof
        // of insufficient stock, race-proof against concurrent orders AND
        // concurrent manual inventory edits alike.
        const updatedInv = await Inventory.findOneAndUpdate(
          { supplier_material_id: item.supplierMaterialId, quantity: { $gte: item.quantity } },
          [{
            $set: {
              quantity: { $subtract: ['$quantity', item.quantity] },
              stock_status: {
                $switch: {
                  branches: [
                    { case: { $lte: [{ $subtract: ['$quantity', item.quantity] }, 0] }, then: 'OUT_OF_STOCK' },
                    { case: { $lte: [{ $subtract: ['$quantity', item.quantity] }, 3] }, then: 'LIMITED' },
                  ],
                  default: '$stock_status',
                },
              },
              last_updated_at: new Date(),
            },
          }],
          { session, returnDocument: 'after', updatePipeline: true }
        )
        if (!updatedInv) throw new Error('INSUFFICIENT_STOCK')
      }

      await CalendarEvent.create(
        [{ user_id: req.user.id, title: `Material delivery: ${supplier.business_name}`, notes: `${resolvedItems.length} item(s), ₹${total.toFixed(2)}`, event_date: todayDateKey(), event_type: 'delivery' }],
        { session }
      )

      return { ...newOrder.toObject(), supplier_name: supplier.business_name }
    })

    res.status(201).json({
      order: {
        id: order._id, displayId: `MO-${100 + Number(order.seq)}`, supplierId: order.supplier_id, supplierName: order.supplier_name,
        totalAmount: Number(order.total_amount), status: order.status, createdAt: order.created_at,
        items: order.items.map((i) => ({ productName: i.product_name, unit: i.unit, unitPrice: Number(i.unit_price), quantity: i.quantity })),
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

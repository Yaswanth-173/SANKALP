import Supplier from '../models/Supplier.js'
import SupplierLocation from '../models/SupplierLocation.js'
import SupplierMaterial from '../models/SupplierMaterial.js'
import Inventory, { STOCK_STATUSES } from '../models/Inventory.js'
import MaterialPrice from '../models/MaterialPrice.js'
import Material from '../models/Material.js'
import SupplierHours from '../models/SupplierHours.js'
import SupplierReview from '../models/SupplierReview.js'
import SupplierVerification from '../models/SupplierVerification.js'
import User from '../models/User.js'
import { withTransaction } from '../config/mongo.js'

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100]
const STOCK_RANK = { IN_STOCK: 0, LIMITED: 1, ON_REQUEST: 2, UNKNOWN: 3, OUT_OF_STOCK: 4 }

// --- Shared search core (also used by materialsController.js) ---
//
// Replaces a single 6-table SQL join with: (1) a $geoNear or plain filter on
// supplier_locations to resolve which suppliers are in scope + their
// distance, then (2) a supplier_materials query restricted to those
// suppliers, then (3) a batch fetch of materials/suppliers/inventory/prices
// for the matched rows, merged in JS. More round-trips than one SQL join,
// but each step is a simple, independently-indexed query.
export async function searchSupplierMaterials({
  lat, lng, radiusKm, state, district, city, pincode,
  q, categoryId, materialId, supplierId,
  inStockOnly, deliveryOnly, minRating,
  sort = 'distance', page = 1, pageSize = 20,
}) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
  const radius = radiusKm === 'all' ? null : Number(radiusKm) || 10

  let allowedSupplierIds = null // null = no location restriction
  const distanceKmBySupplier = new Map()

  if (hasCoords) {
    const geoStage = {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distance_m',
      spherical: true,
      query: { is_primary: true },
    }
    if (radius !== null) geoStage.maxDistance = radius * 1000
    const located = await SupplierLocation.aggregate([{ $geoNear: geoStage }])
    allowedSupplierIds = new Set(located.map((l) => l.supplier_id))
    for (const l of located) distanceKmBySupplier.set(l.supplier_id, Math.round((l.distance_m / 1000) * 10) / 10)
  } else if (state || district || city || pincode) {
    const locFilter = { is_primary: true }
    if (state) locFilter.state = new RegExp(`^${state}$`, 'i')
    if (district) locFilter.district = new RegExp(`^${district}$`, 'i')
    if (city) locFilter.city = new RegExp(`^${city}$`, 'i')
    if (pincode) locFilter.pincode = pincode
    const located = await SupplierLocation.find(locFilter).select('supplier_id').lean()
    allowedSupplierIds = new Set(located.map((l) => l.supplier_id))
  }
  if (allowedSupplierIds && !allowedSupplierIds.size) return []

  const smFilter = { available: true }
  if (allowedSupplierIds) smFilter.supplier_id = { $in: [...allowedSupplierIds] }
  if (categoryId) {
    const catMaterialIds = await Material.find({ $or: [{ category_id: categoryId }, { subcategory_id: categoryId }] }).select('_id').lean()
    smFilter.material_id = { $in: catMaterialIds.map((m) => m._id) }
  }
  if (materialId) smFilter.material_id = materialId
  if (supplierId) smFilter.supplier_id = supplierId

  if (q && q.trim()) {
    const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const matchingMaterials = await Material.find({ $or: [{ name: re }, { search_keywords: re }] }).select('_id').lean()
    const matchingMaterialIds = matchingMaterials.map((m) => m._id)
    smFilter.$or = [{ material_id: { $in: matchingMaterialIds } }, { brand: re }, { product_name: re }]
  }

  const supplierMaterials = await SupplierMaterial.find(smFilter).lean()
  if (!supplierMaterials.length) return []

  const materialIds = [...new Set(supplierMaterials.map((sm) => sm.material_id))]
  const supplierIds = [...new Set(supplierMaterials.map((sm) => sm.supplier_id))]
  const smIds = supplierMaterials.map((sm) => sm._id)

  const [materials, suppliers, locations, inventories, prices] = await Promise.all([
    Material.find({ _id: { $in: materialIds } }).lean(),
    Supplier.find({ _id: { $in: supplierIds }, verification_status: { $ne: 'disabled' } }).lean(),
    SupplierLocation.find({ supplier_id: { $in: supplierIds }, is_primary: true }).lean(),
    Inventory.find({ supplier_material_id: { $in: smIds } }).lean(),
    MaterialPrice.find({ supplier_material_id: { $in: smIds }, valid_until: null }).lean(),
  ])
  const materialById = new Map(materials.map((m) => [m._id, m]))
  const supplierById = new Map(suppliers.map((s) => [s._id, s]))
  const locationBySupplier = new Map(locations.map((l) => [l.supplier_id, l]))
  const inventoryBySm = new Map(inventories.map((i) => [i.supplier_material_id, i]))
  const priceBySm = new Map(prices.map((p) => [p.supplier_material_id, p]))

  let results = supplierMaterials
    .filter((sm) => supplierById.has(sm.supplier_id)) // excludes disabled suppliers
    .map((sm) => {
      const material = materialById.get(sm.material_id)
      const supplier = supplierById.get(sm.supplier_id)
      const location = locationBySupplier.get(sm.supplier_id)
      const inventory = inventoryBySm.get(sm._id)
      const price = priceBySm.get(sm._id)
      return {
        supplierMaterialId: sm._id,
        material: { id: material?._id, name: material?.name, unit: material?.unit, imageUrl: material?.image_url, grade: material?.grade },
        brand: sm.brand,
        productName: sm.product_name,
        specification: sm.specification,
        grade: sm.grade,
        minimumOrderQuantity: sm.minimum_order_quantity,
        supplier: {
          id: supplier?._id, businessName: supplier?.business_name, supplierType: supplier?.supplier_type,
          verificationStatus: supplier?.verification_status, rating: supplier?.rating != null ? Number(supplier.rating) : null,
          reviewCount: supplier?.review_count, deliveryAvailable: supplier?.delivery_available,
          deliveryRadiusKm: supplier?.delivery_radius_km, phone: supplier?.phone, whatsapp: supplier?.whatsapp,
        },
        location: {
          city: location?.city, state: location?.state, pincode: location?.pincode, address: location?.address,
          latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
        },
        distanceKm: distanceKmBySupplier.has(sm.supplier_id) ? distanceKmBySupplier.get(sm.supplier_id) : null,
        inventory: inventory
          ? { quantity: inventory.quantity, stockStatus: inventory.stock_status, lastUpdatedAt: inventory.last_updated_at, verified: inventory.verified, source: inventory.source }
          : { quantity: null, stockStatus: 'UNKNOWN', lastUpdatedAt: null, verified: false, source: null },
        price: price
          ? { price: Number(price.price), currency: price.currency, unit: price.unit, minimumQuantity: price.minimum_quantity, bulkPrice: price.bulk_price != null ? Number(price.bulk_price) : null, gstIncluded: price.gst_included, updatedAt: price.updated_at, verified: price.verified, source: price.source }
          : null,
      }
    })
    .filter((r) => !inStockOnly || r.inventory.stockStatus === 'IN_STOCK')
    .filter((r) => !deliveryOnly || r.supplier.deliveryAvailable)
    .filter((r) => minRating == null || (r.supplier.rating ?? 0) >= minRating)

  if (sort === 'price') results.sort((a, b) => (a.price?.price ?? Infinity) - (b.price?.price ?? Infinity) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  else if (sort === 'rating') results.sort((a, b) => (b.supplier.rating ?? 0) - (a.supplier.rating ?? 0) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  else if (sort === 'stock') results.sort((a, b) => STOCK_RANK[a.inventory.stockStatus] - STOCK_RANK[b.inventory.stockStatus] || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  else if (sort === 'delivery') results.sort((a, b) => (b.supplier.deliveryAvailable === true) - (a.supplier.deliveryAvailable === true) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  else results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || (b.supplier.rating ?? 0) - (a.supplier.rating ?? 0))

  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 50)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit
  return results.slice(offset, offset + limit)
}

export async function nearbySuppliersHandler(req, res) {
  try {
    const results = await searchSupplierMaterials({
      lat: Number(req.query.lat), lng: Number(req.query.lng),
      radiusKm: req.query.radiusKm === 'all' ? 'all' : req.query.radiusKm,
      state: req.query.state, district: req.query.district, city: req.query.city, pincode: req.query.pincode,
      q: req.query.q, categoryId: req.query.categoryId,
      inStockOnly: req.query.inStockOnly === 'true', deliveryOnly: req.query.deliveryOnly === 'true',
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      sort: req.query.sort, page: req.query.page, pageSize: req.query.pageSize,
    })
    res.json({ results })
  } catch (err) {
    console.error('Nearby suppliers error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const publicSupplier = (s, location, hours) => ({
  id: s._id,
  businessName: s.business_name,
  ownerName: s.owner_name,
  phone: s.phone,
  whatsapp: s.whatsapp,
  description: s.description,
  supplierType: s.supplier_type,
  verificationStatus: s.verification_status,
  rating: s.rating != null ? Number(s.rating) : null,
  reviewCount: s.review_count,
  deliveryAvailable: s.delivery_available,
  deliveryRadiusKm: s.delivery_radius_km,
  minimumOrderValue: s.minimum_order_value != null ? Number(s.minimum_order_value) : null,
  source: s.source,
  createdAt: s.created_at,
  location: location
    ? { address: location.address, state: location.state, district: location.district, city: location.city, pincode: location.pincode, latitude: Number(location.latitude), longitude: Number(location.longitude) }
    : null,
  hours: (hours || []).map((h) => ({ dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at, closed: h.closed })),
})

export async function getSupplierHandler(req, res) {
  try {
    const supplier = await Supplier.findById(req.params.id).lean()
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' })
    const location = await SupplierLocation.findOne({ supplier_id: req.params.id, is_primary: true }).lean()
    const hours = await SupplierHours.find({ supplier_id: req.params.id }).sort({ day_of_week: 1 }).lean()
    res.json({ supplier: publicSupplier(supplier, location, hours) })
  } catch (err) {
    console.error('Get supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function supplierMaterialsHandler(req, res) {
  try {
    const results = await searchSupplierMaterials({
      supplierId: req.params.id,
      lat: Number(req.query.lat), lng: Number(req.query.lng),
      radiusKm: 'all', sort: req.query.sort || 'price', page: req.query.page, pageSize: req.query.pageSize || 50,
    })
    res.json({ results })
  } catch (err) {
    console.error('Supplier materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function getOwnSupplier(userId) {
  return Supplier.findOne({ user_id: userId }).lean()
}

export async function registerSupplierHandler(req, res) {
  const { businessName, ownerName, phone, email, gstNumber, address, state, district, city, pincode, latitude, longitude, supplierType, deliveryAvailable, deliveryRadiusKm } = req.body ?? {}

  if (!businessName || !businessName.trim()) return res.status(400).json({ message: 'Enter a business name' })
  if (!phone || !phone.trim()) return res.status(400).json({ message: 'Enter a contact phone number' })
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ message: 'Set your business location (use current location or search for it)' })
  }

  try {
    const existing = await getOwnSupplier(req.user.id)
    if (existing) return res.status(409).json({ message: 'You have already registered a supplier account' })

    const supplier = await withTransaction(async (session) => {
      const [created] = await Supplier.create(
        [{
          user_id: req.user.id, business_name: businessName.trim(), owner_name: ownerName?.trim() || null,
          phone: phone.trim(), whatsapp: phone.trim(), email: email?.trim() || null, gst_number: gstNumber?.trim() || null,
          supplier_type: supplierType?.trim() || null, verification_status: 'pending',
          delivery_available: !!deliveryAvailable, delivery_radius_km: deliveryRadiusKm ? Number(deliveryRadiusKm) : null, source: 'registration',
        }],
        { session }
      )
      await SupplierLocation.create(
        [{
          supplier_id: created._id, address: address?.trim() || null, state: state?.trim() || null, district: district?.trim() || null,
          city: city?.trim() || null, pincode: pincode?.trim() || null, latitude: Number(latitude), longitude: Number(longitude),
          location: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] }, is_primary: true,
        }],
        { session }
      )
      return created
    })

    res.status(201).json({ supplier: publicSupplier(supplier.toObject(), null, []), message: 'Registration submitted. Your listing stays hidden from customer search until an admin verifies it.' })
  } catch (err) {
    console.error('Register supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function getMySupplierHandler(req, res) {
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })
    const location = await SupplierLocation.findOne({ supplier_id: supplier._id, is_primary: true }).lean()
    const hours = await SupplierHours.find({ supplier_id: supplier._id }).sort({ day_of_week: 1 }).lean()
    res.json({ supplier: publicSupplier(supplier, location, hours) })
  } catch (err) {
    console.error('Get my supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateMySupplierHandler(req, res) {
  const { businessName, ownerName, phone, whatsapp, email, gstNumber, description, supplierType, deliveryAvailable, deliveryRadiusKm, minimumOrderValue } = req.body ?? {}
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })

    const patch = { updated_at: new Date() }
    if (businessName != null) patch.business_name = businessName.trim()
    patch.owner_name = ownerName?.trim() || null
    if (phone != null) patch.phone = phone.trim()
    patch.whatsapp = whatsapp?.trim() || null
    patch.email = email?.trim() || null
    patch.gst_number = gstNumber?.trim() || null
    patch.description = description?.trim() || null
    patch.supplier_type = supplierType?.trim() || null
    if (typeof deliveryAvailable === 'boolean') patch.delivery_available = deliveryAvailable
    patch.delivery_radius_km = deliveryRadiusKm != null ? Number(deliveryRadiusKm) : null
    patch.minimum_order_value = minimumOrderValue != null ? Number(minimumOrderValue) : null

    const updated = await Supplier.findOneAndUpdate({ _id: supplier._id }, { $set: patch }, { returnDocument: 'after' }).lean()
    res.json({ supplier: publicSupplier(updated, null, []) })
  } catch (err) {
    console.error('Update my supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listMySupplierMaterialsHandler(req, res) {
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })

    const supplierMaterials = await SupplierMaterial.find({ supplier_id: supplier._id }).lean()
    const materialIds = supplierMaterials.map((sm) => sm.material_id)
    const smIds = supplierMaterials.map((sm) => sm._id)
    const [materials, inventories, prices] = await Promise.all([
      Material.find({ _id: { $in: materialIds } }).select('_id name unit').lean(),
      Inventory.find({ supplier_material_id: { $in: smIds } }).lean(),
      MaterialPrice.find({ supplier_material_id: { $in: smIds }, valid_until: null }).lean(),
    ])
    const materialById = new Map(materials.map((m) => [m._id, m]))
    const inventoryBySm = new Map(inventories.map((i) => [i.supplier_material_id, i]))
    const priceBySm = new Map(prices.map((p) => [p.supplier_material_id, p]))

    const result = supplierMaterials
      .map((sm) => {
        const material = materialById.get(sm.material_id)
        const inv = inventoryBySm.get(sm._id)
        const price = priceBySm.get(sm._id)
        return {
          id: sm._id, materialId: sm.material_id, materialName: material?.name, brand: sm.brand,
          productName: sm.product_name, specification: sm.specification, grade: sm.grade, unit: sm.unit,
          minimumOrderQuantity: sm.minimum_order_quantity, available: sm.available,
          quantity: inv?.quantity ?? null, stockStatus: inv?.stock_status || 'UNKNOWN', inventoryUpdatedAt: inv?.last_updated_at,
          price: price?.price != null ? Number(price.price) : null, priceUpdatedAt: price?.updated_at,
        }
      })
      .sort((a, b) => (a.materialName || '').localeCompare(b.materialName || ''))
    res.json({ materials: result })
  } catch (err) {
    console.error('List my supplier materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addSupplierMaterialHandler(req, res) {
  const { materialId, brand, productName, specification, grade, unit, minimumOrderQuantity, price, quantity, stockStatus } = req.body ?? {}
  if (!materialId) return res.status(400).json({ message: 'Choose a material' })
  if (!productName || !productName.trim()) return res.status(400).json({ message: 'Enter a product name' })
  if (!unit || !unit.trim()) return res.status(400).json({ message: 'Enter a unit' })
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'Enter a valid price' })
  if (quantity != null && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) {
    return res.status(400).json({ message: 'Quantity cannot be negative' })
  }

  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })

    const status = STOCK_STATUSES.includes(stockStatus) ? stockStatus : 'UNKNOWN'
    const created = await withTransaction(async (session) => {
      const [sm] = await SupplierMaterial.create(
        [{ supplier_id: supplier._id, material_id: materialId, brand: brand?.trim() || null, product_name: productName.trim(), specification: specification?.trim() || null, grade: grade?.trim() || null, unit: unit.trim(), minimum_order_quantity: Number(minimumOrderQuantity) || 1 }],
        { session }
      )
      await Inventory.create([{ supplier_material_id: sm._id, quantity: quantity != null ? Number(quantity) : null, stock_status: status, source: 'supplier', verified: true }], { session })
      await MaterialPrice.create([{ supplier_material_id: sm._id, price: Number(price), unit: unit.trim(), minimum_quantity: Number(minimumOrderQuantity) || 1, source: 'supplier', verified: true }], { session })
      return sm
    })
    res.status(201).json({ id: created._id, message: 'Material added to your catalog' })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already list this material' })
    console.error('Add supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function assertOwnsSupplierMaterial(userId, supplierMaterialId) {
  const sm = await SupplierMaterial.findById(supplierMaterialId).lean()
  if (!sm) return null
  const supplier = await Supplier.findOne({ _id: sm.supplier_id, user_id: userId }).select('_id').lean()
  return supplier ? sm : null
}

export async function updateSupplierMaterialHandler(req, res) {
  const { brand, productName, specification, grade, unit, minimumOrderQuantity, available } = req.body ?? {}
  if (!productName || !productName.trim()) return res.status(400).json({ message: 'Enter a product name' })
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })

    const patch = { brand: brand?.trim() || null, product_name: productName.trim(), specification: specification?.trim() || null, grade: grade?.trim() || null, updated_at: new Date() }
    if (unit != null) patch.unit = unit.trim()
    if (minimumOrderQuantity != null) patch.minimum_order_quantity = Number(minimumOrderQuantity)
    if (typeof available === 'boolean') patch.available = available

    const updated = await SupplierMaterial.findOneAndUpdate({ _id: req.params.id }, { $set: patch }, { returnDocument: 'after' }).lean()
    res.json({ supplierMaterial: updated })
  } catch (err) {
    console.error('Update supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteSupplierMaterialHandler(req, res) {
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })
    await withTransaction(async (session) => {
      await SupplierMaterial.deleteOne({ _id: req.params.id }, { session })
      await Inventory.deleteMany({ supplier_material_id: req.params.id }, { session })
      await MaterialPrice.deleteMany({ supplier_material_id: req.params.id }, { session })
    })
    res.json({ message: 'Removed from your catalog' })
  } catch (err) {
    console.error('Delete supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateInventoryHandler(req, res) {
  const { quantity, stockStatus } = req.body ?? {}
  if (!STOCK_STATUSES.includes(stockStatus)) return res.status(400).json({ message: 'Invalid stock status' })
  if (quantity != null && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) {
    return res.status(400).json({ message: 'Quantity cannot be negative' })
  }
  try {
    const inv = await Inventory.findById(req.params.id).lean()
    if (!inv) return res.status(404).json({ message: 'Inventory record not found' })
    const sm = await SupplierMaterial.findById(inv.supplier_material_id).lean()
    const supplier = sm ? await Supplier.findOne({ _id: sm.supplier_id, user_id: req.user.id }).select('_id').lean() : null
    if (!supplier) return res.status(404).json({ message: 'Inventory record not found' })

    const updated = await Inventory.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { quantity: quantity != null ? Number(quantity) : null, stock_status: stockStatus, last_updated_at: new Date(), source: 'supplier', verified: true } },
      { returnDocument: 'after', runValidators: true }
    ).lean()
    res.json({ inventory: updated })
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: 'Quantity cannot be negative' })
    console.error('Update inventory error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addPriceHandler(req, res) {
  const { price, bulkPrice, minimumQuantity, gstIncluded, unit } = req.body ?? {}
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'Enter a valid price' })
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })

    const row = await withTransaction(async (session) => {
      await MaterialPrice.updateOne({ supplier_material_id: req.params.id, valid_until: null }, { $set: { valid_until: new Date() } }, { session })
      const [created] = await MaterialPrice.create(
        [{ supplier_material_id: req.params.id, price: Number(price), unit: unit?.trim() || 'unit', minimum_quantity: minimumQuantity ? Number(minimumQuantity) : 1, bulk_price: bulkPrice != null ? Number(bulkPrice) : null, gst_included: gstIncluded !== false, source: 'supplier', verified: true }],
        { session }
      )
      return created
    })
    res.status(201).json({ price: row.toObject() })
  } catch (err) {
    console.error('Add price error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function correctPriceHandler(req, res) {
  const { price, verified } = req.body ?? {}
  if (price != null && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ message: 'Enter a valid price' })
  }
  try {
    const priceRow = await MaterialPrice.findById(req.params.id).lean()
    if (!priceRow) return res.status(404).json({ message: 'Price record not found' })
    const sm = await SupplierMaterial.findById(priceRow.supplier_material_id).lean()
    const supplier = sm ? await Supplier.findOne({ _id: sm.supplier_id, user_id: req.user.id }).select('_id').lean() : null
    if (!supplier) return res.status(404).json({ message: 'Price record not found' })

    const patch = { updated_at: new Date() }
    if (price != null) patch.price = Number(price)
    if (typeof verified === 'boolean') patch.verified = verified
    const updated = await MaterialPrice.findOneAndUpdate({ _id: req.params.id }, { $set: patch }, { returnDocument: 'after' }).lean()
    res.json({ price: updated })
  } catch (err) {
    console.error('Correct price error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listReviewsHandler(req, res) {
  try {
    const reviews = await SupplierReview.find({ supplier_id: req.params.id }).sort({ created_at: -1 }).limit(50).lean()
    const userIds = [...new Set(reviews.map((r) => r.user_id))]
    const users = await User.find({ _id: { $in: userIds } }).select('_id full_name').lean()
    const nameById = new Map(users.map((u) => [u._id, u.full_name]))
    res.json({ reviews: reviews.map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, authorName: nameById.get(r.user_id), createdAt: r.created_at })) })
  } catch (err) {
    console.error('List reviews error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addReviewHandler(req, res) {
  const { rating, comment } = req.body ?? {}
  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be an integer from 1 to 5' })
  }
  try {
    await withTransaction(async (session) => {
      await SupplierReview.findOneAndUpdate(
        { supplier_id: req.params.id, user_id: req.user.id },
        { $set: { rating: ratingNum, comment: comment?.trim() || null, created_at: new Date() } },
        { upsert: true, session }
      )
      const agg = await SupplierReview.aggregate([
        { $match: { supplier_id: req.params.id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]).session(session)
      const avgRating = agg[0] ? Math.round(agg[0].avgRating * 10) / 10 : null
      await Supplier.updateOne({ _id: req.params.id }, { $set: { rating: avgRating, review_count: agg[0]?.count || 0 } }, { session })
    })
    res.status(201).json({ message: 'Review saved' })
  } catch (err) {
    console.error('Add review error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listPendingSuppliersHandler(req, res) {
  try {
    const status = ['pending', 'verified', 'rejected', 'disabled'].includes(req.query.status) ? req.query.status : 'pending'
    const suppliers = await Supplier.find({ verification_status: status }).sort({ created_at: -1 }).lean()
    const locations = await SupplierLocation.find({ supplier_id: { $in: suppliers.map((s) => s._id) }, is_primary: true }).lean()
    const locBySupplier = new Map(locations.map((l) => [l.supplier_id, l]))
    res.json({ suppliers: suppliers.map((s) => ({ ...publicSupplier(s, null, []), city: locBySupplier.get(s._id)?.city, state: locBySupplier.get(s._id)?.state })) })
  } catch (err) {
    console.error('List pending suppliers error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function verifySupplierHandler(req, res) {
  const { status, notes } = req.body ?? {}
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ message: 'status must be verified or rejected' })
  try {
    const updated = await withTransaction(async (session) => {
      const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id }, { $set: { verification_status: status, updated_at: new Date() } }, { returnDocument: 'after', session })
      if (!supplier) return null
      await SupplierVerification.create([{ supplier_id: req.params.id, reviewed_by: req.user.id, status: status === 'verified' ? 'approved' : 'rejected', notes: notes?.trim() || null }], { session })
      return supplier
    })
    if (!updated) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ supplier: publicSupplier(updated.toObject(), null, []) })
  } catch (err) {
    console.error('Verify supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function disableSupplierHandler(req, res) {
  try {
    const updated = await Supplier.findOneAndUpdate({ _id: req.params.id }, { $set: { verification_status: 'disabled', updated_at: new Date() } }, { returnDocument: 'after' }).lean()
    if (!updated) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ supplier: publicSupplier(updated, null, []) })
  } catch (err) {
    console.error('Disable supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

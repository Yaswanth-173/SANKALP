import { query, withTransaction } from '../config/db.js'

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100]
const STOCK_STATUSES = ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK', 'ON_REQUEST', 'UNKNOWN']
const STOCK_RANK = { IN_STOCK: 0, LIMITED: 1, ON_REQUEST: 2, UNKNOWN: 3, OUT_OF_STOCK: 4 }

const publicSupplierCard = (r) => ({
  supplierMaterialId: r.supplier_material_id,
  material: {
    id: r.material_id,
    name: r.material_name,
    unit: r.material_unit,
    imageUrl: r.image_url,
    grade: r.material_grade,
  },
  brand: r.brand,
  productName: r.product_name,
  specification: r.specification,
  grade: r.sm_grade,
  minimumOrderQuantity: r.minimum_order_quantity,
  supplier: {
    id: r.supplier_id,
    businessName: r.business_name,
    supplierType: r.supplier_type,
    verificationStatus: r.verification_status,
    rating: r.rating === null ? null : Number(r.rating),
    reviewCount: r.review_count,
    deliveryAvailable: r.delivery_available,
    deliveryRadiusKm: r.delivery_radius_km,
    phone: r.phone,
    whatsapp: r.whatsapp,
  },
  location: {
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    address: r.address,
    latitude: r.latitude === null ? null : Number(r.latitude),
    longitude: r.longitude === null ? null : Number(r.longitude),
  },
  distanceKm: r.distance_km === null || r.distance_km === undefined ? null : Math.round(Number(r.distance_km) * 10) / 10,
  inventory: r.inv_id
    ? {
        quantity: r.quantity === null ? null : Number(r.quantity),
        stockStatus: r.stock_status,
        lastUpdatedAt: r.inventory_updated_at,
        verified: r.inventory_verified,
        source: r.inventory_source,
      }
    : { quantity: null, stockStatus: 'UNKNOWN', lastUpdatedAt: null, verified: false, source: null },
  price: r.price_id
    ? {
        price: Number(r.price),
        currency: r.currency,
        unit: r.price_unit,
        minimumQuantity: r.price_min_qty,
        bulkPrice: r.bulk_price === null ? null : Number(r.bulk_price),
        gstIncluded: r.gst_included,
        updatedAt: r.price_updated_at,
        verified: r.price_verified,
        source: r.price_source,
      }
    : null,
})

// Shared core of every "find suppliers" surface in the app: nearby browsing
// (no material filter), a specific material's suppliers, and one supplier's
// full catalog. Distance is always computed and filtered in SQL (never only
// client-side) — the bounding-box pre-filter lets the lat/lng index prune
// rows before the exact Haversine expression runs.
export async function searchSupplierMaterials({
  lat, lng, radiusKm, state, district, city, pincode,
  q, categoryId, materialId, supplierId,
  inStockOnly, deliveryOnly, minRating,
  sort = 'distance', page = 1, pageSize = 20,
}) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
  const radius = radiusKm === 'all' ? null : Number(radiusKm) || 10
  const params = []
  const where = [`sm.available = true`, `s.verification_status != 'disabled'`]

  let distanceExpr = 'NULL'
  if (hasCoords) {
    params.push(lat, lng)
    const latIdx = params.length - 1
    const lngIdx = params.length
    distanceExpr = `(6371 * acos(least(1, greatest(-1,
      cos(radians($${latIdx})) * cos(radians(sl.latitude)) * cos(radians(sl.longitude) - radians($${lngIdx}))
      + sin(radians($${latIdx})) * sin(radians(sl.latitude))
    ))))`
    if (radius !== null) {
      const kmPerDegree = 111.0
      const degRadius = radius / kmPerDegree
      params.push(lat - degRadius, lat + degRadius, lng - degRadius, lng + degRadius)
      where.push(`sl.latitude BETWEEN $${params.length - 3} AND $${params.length - 2}`)
      where.push(`sl.longitude BETWEEN $${params.length - 1} AND $${params.length}`)
      params.push(radius)
      where.push(`${distanceExpr} <= $${params.length}`)
    }
  } else {
    if (state) { params.push(state); where.push(`sl.state ILIKE $${params.length}`) }
    if (district) { params.push(district); where.push(`sl.district ILIKE $${params.length}`) }
    if (city) { params.push(city); where.push(`sl.city ILIKE $${params.length}`) }
    if (pincode) { params.push(pincode); where.push(`sl.pincode = $${params.length}`) }
  }

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`)
    const idx = params.length
    where.push(`(m.name ILIKE $${idx} OR sm.brand ILIKE $${idx} OR sm.product_name ILIKE $${idx} OR m.search_keywords ILIKE $${idx})`)
  }
  if (categoryId) { params.push(categoryId); where.push(`(m.category_id = $${params.length} OR m.subcategory_id = $${params.length})`) }
  if (materialId) { params.push(materialId); where.push(`sm.material_id = $${params.length}`) }
  if (supplierId) { params.push(supplierId); where.push(`s.id = $${params.length}`) }
  if (inStockOnly) { where.push(`inv.stock_status = 'IN_STOCK'`) }
  if (deliveryOnly) { where.push(`s.delivery_available = true`) }
  if (Number.isFinite(minRating)) { params.push(minRating); where.push(`s.rating >= $${params.length}`) }

  let orderBy = 'distance_km ASC NULLS LAST, s.rating DESC NULLS LAST'
  if (sort === 'price') orderBy = 'price ASC NULLS LAST, distance_km ASC NULLS LAST'
  else if (sort === 'rating') orderBy = 's.rating DESC NULLS LAST, distance_km ASC NULLS LAST'
  else if (sort === 'stock') orderBy = 'stock_rank ASC, distance_km ASC NULLS LAST'
  else if (sort === 'delivery') orderBy = 's.delivery_available DESC, distance_km ASC NULLS LAST'

  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 50)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit
  params.push(limit, offset)

  const sql = `
    SELECT sm.id AS supplier_material_id, sm.brand, sm.product_name, sm.specification,
           sm.grade AS sm_grade, sm.unit AS sm_unit, sm.minimum_order_quantity,
           m.id AS material_id, m.name AS material_name, m.unit AS material_unit,
           m.image_url, m.grade AS material_grade,
           s.id AS supplier_id, s.business_name, s.supplier_type, s.verification_status, s.rating, s.review_count,
           s.delivery_available, s.delivery_radius_km, s.phone, s.whatsapp,
           sl.city, sl.state, sl.pincode, sl.address, sl.latitude, sl.longitude,
           inv.id AS inv_id, inv.quantity, inv.stock_status, inv.last_updated_at AS inventory_updated_at,
           inv.verified AS inventory_verified, inv.source AS inventory_source,
           mp.id AS price_id, mp.price, mp.currency, mp.unit AS price_unit,
           mp.minimum_quantity AS price_min_qty, mp.bulk_price, mp.gst_included,
           mp.updated_at AS price_updated_at, mp.verified AS price_verified, mp.source AS price_source,
           ${distanceExpr} AS distance_km,
           CASE inv.stock_status
             WHEN 'IN_STOCK' THEN 0 WHEN 'LIMITED' THEN 1 WHEN 'ON_REQUEST' THEN 2
             WHEN 'UNKNOWN' THEN 3 ELSE 4 END AS stock_rank
    FROM supplier_materials sm
    JOIN materials m ON m.id = sm.material_id
    JOIN suppliers s ON s.id = sm.supplier_id
    JOIN supplier_locations sl ON sl.supplier_id = s.id AND sl.is_primary = true
    LEFT JOIN inventory inv ON inv.supplier_material_id = sm.id
    LEFT JOIN material_prices mp ON mp.supplier_material_id = sm.id AND mp.valid_until IS NULL
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `
  const { rows } = await query(sql, params)
  return rows.map(publicSupplierCard)
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
  id: s.id,
  businessName: s.business_name,
  ownerName: s.owner_name,
  phone: s.phone,
  whatsapp: s.whatsapp,
  description: s.description,
  supplierType: s.supplier_type,
  verificationStatus: s.verification_status,
  rating: s.rating === null ? null : Number(s.rating),
  reviewCount: s.review_count,
  deliveryAvailable: s.delivery_available,
  deliveryRadiusKm: s.delivery_radius_km,
  minimumOrderValue: s.minimum_order_value === null ? null : Number(s.minimum_order_value),
  source: s.source,
  createdAt: s.created_at,
  location: location
    ? {
        address: location.address, state: location.state, district: location.district,
        city: location.city, pincode: location.pincode,
        latitude: Number(location.latitude), longitude: Number(location.longitude),
      }
    : null,
  hours: (hours || []).map((h) => ({
    dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at, closed: h.closed,
  })),
})

export async function getSupplierHandler(req, res) {
  try {
    const { rows } = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'Supplier not found' })
    const { rows: locationRows } = await query(
      'SELECT * FROM supplier_locations WHERE supplier_id = $1 AND is_primary = true LIMIT 1',
      [req.params.id]
    )
    const { rows: hoursRows } = await query(
      'SELECT * FROM supplier_hours WHERE supplier_id = $1 ORDER BY day_of_week',
      [req.params.id]
    )
    res.json({ supplier: publicSupplier(rows[0], locationRows[0], hoursRows) })
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

// --- Supplier self-service (registration + dashboard) ---

async function getOwnSupplier(userId) {
  const { rows } = await query('SELECT * FROM suppliers WHERE user_id = $1', [userId])
  return rows[0] || null
}

export async function registerSupplierHandler(req, res) {
  const {
    businessName, ownerName, phone, email, gstNumber, address, state, district, city, pincode,
    latitude, longitude, supplierType, deliveryAvailable, deliveryRadiusKm,
  } = req.body ?? {}

  if (!businessName || !businessName.trim()) return res.status(400).json({ message: 'Enter a business name' })
  if (!phone || !phone.trim()) return res.status(400).json({ message: 'Enter a contact phone number' })
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ message: 'Set your business location (use current location or search for it)' })
  }

  try {
    const existing = await getOwnSupplier(req.user.id)
    if (existing) return res.status(409).json({ message: 'You have already registered a supplier account' })

    const supplier = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO suppliers (user_id, business_name, owner_name, phone, whatsapp, email, gst_number,
           supplier_type, verification_status, delivery_available, delivery_radius_km, source)
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7, 'pending', $8, $9, 'registration')
         RETURNING *`,
        [req.user.id, businessName.trim(), ownerName?.trim() || null, phone.trim(), email?.trim() || null,
          gstNumber?.trim() || null, supplierType?.trim() || null, !!deliveryAvailable, deliveryRadiusKm ? Number(deliveryRadiusKm) : null]
      )
      const created = rows[0]
      await client.query(
        `INSERT INTO supplier_locations (supplier_id, address, state, district, city, pincode, latitude, longitude, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [created.id, address?.trim() || null, state?.trim() || null, district?.trim() || null,
          city?.trim() || null, pincode?.trim() || null, Number(latitude), Number(longitude)]
      )
      return created
    })

    res.status(201).json({
      supplier: publicSupplier(supplier, null, []),
      message: 'Registration submitted. Your listing stays hidden from customer search until an admin verifies it.',
    })
  } catch (err) {
    console.error('Register supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function getMySupplierHandler(req, res) {
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })
    const { rows: locationRows } = await query(
      'SELECT * FROM supplier_locations WHERE supplier_id = $1 AND is_primary = true LIMIT 1',
      [supplier.id]
    )
    const { rows: hoursRows } = await query('SELECT * FROM supplier_hours WHERE supplier_id = $1 ORDER BY day_of_week', [supplier.id])
    res.json({ supplier: publicSupplier(supplier, locationRows[0], hoursRows) })
  } catch (err) {
    console.error('Get my supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateMySupplierHandler(req, res) {
  const { businessName, ownerName, phone, whatsapp, email, gstNumber, description, supplierType,
    deliveryAvailable, deliveryRadiusKm, minimumOrderValue } = req.body ?? {}
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })

    const { rows } = await query(
      `UPDATE suppliers SET business_name = COALESCE($1, business_name), owner_name = $2, phone = COALESCE($3, phone),
         whatsapp = $4, email = $5, gst_number = $6, description = $7, supplier_type = $8,
         delivery_available = COALESCE($9, delivery_available), delivery_radius_km = $10,
         minimum_order_value = $11, updated_at = now()
       WHERE id = $12 RETURNING *`,
      [businessName?.trim(), ownerName?.trim() || null, phone?.trim(), whatsapp?.trim() || null,
        email?.trim() || null, gstNumber?.trim() || null, description?.trim() || null, supplierType?.trim() || null,
        typeof deliveryAvailable === 'boolean' ? deliveryAvailable : null,
        deliveryRadiusKm != null ? Number(deliveryRadiusKm) : null,
        minimumOrderValue != null ? Number(minimumOrderValue) : null, supplier.id]
    )
    res.json({ supplier: publicSupplier(rows[0], null, []) })
  } catch (err) {
    console.error('Update my supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listMySupplierMaterialsHandler(req, res) {
  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })
    const { rows } = await query(
      `SELECT sm.*, m.name AS material_name, m.unit AS material_unit,
              inv.quantity, inv.stock_status, inv.last_updated_at AS inventory_updated_at, inv.verified AS inventory_verified,
              mp.price, mp.updated_at AS price_updated_at, mp.verified AS price_verified
       FROM supplier_materials sm
       JOIN materials m ON m.id = sm.material_id
       LEFT JOIN inventory inv ON inv.supplier_material_id = sm.id
       LEFT JOIN material_prices mp ON mp.supplier_material_id = sm.id AND mp.valid_until IS NULL
       WHERE sm.supplier_id = $1 ORDER BY m.name`,
      [supplier.id]
    )
    res.json({
      materials: rows.map((r) => ({
        id: r.id,
        materialId: r.material_id,
        materialName: r.material_name,
        brand: r.brand,
        productName: r.product_name,
        specification: r.specification,
        grade: r.grade,
        unit: r.unit,
        minimumOrderQuantity: r.minimum_order_quantity,
        available: r.available,
        quantity: r.quantity === null ? null : Number(r.quantity),
        stockStatus: r.stock_status || 'UNKNOWN',
        inventoryUpdatedAt: r.inventory_updated_at,
        price: r.price === null ? null : Number(r.price),
        priceUpdatedAt: r.price_updated_at,
      })),
    })
  } catch (err) {
    console.error('List my supplier materials error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addSupplierMaterialHandler(req, res) {
  const { materialId, brand, productName, specification, grade, unit, minimumOrderQuantity, price, quantity, stockStatus } = req.body ?? {}
  if (!materialId) return res.status(400).json({ message: 'Choose a material' })
  if (!unit || !unit.trim()) return res.status(400).json({ message: 'Enter a unit' })
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'Enter a valid price' })

  try {
    const supplier = await getOwnSupplier(req.user.id)
    if (!supplier) return res.status(404).json({ message: 'No supplier account registered for this user' })

    const status = STOCK_STATUSES.includes(stockStatus) ? stockStatus : 'UNKNOWN'
    const created = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO supplier_materials (supplier_id, material_id, brand, product_name, specification, grade, unit, minimum_order_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [supplier.id, materialId, brand?.trim() || null, productName?.trim() || null, specification?.trim() || null,
          grade?.trim() || null, unit.trim(), Number(minimumOrderQuantity) || 1]
      )
      const sm = rows[0]
      await client.query(
        `INSERT INTO inventory (supplier_material_id, quantity, stock_status, source, verified)
         VALUES ($1, $2, $3, 'supplier', true)`,
        [sm.id, quantity != null ? Number(quantity) : null, status]
      )
      await client.query(
        `INSERT INTO material_prices (supplier_material_id, price, unit, minimum_quantity, source, verified)
         VALUES ($1, $2, $3, $4, 'supplier', true)`,
        [sm.id, Number(price), unit.trim(), Number(minimumOrderQuantity) || 1]
      )
      return sm
    })
    res.status(201).json({ id: created.id, message: 'Material added to your catalog' })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'You already list this material' })
    console.error('Add supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function assertOwnsSupplierMaterial(userId, supplierMaterialId) {
  const { rows } = await query(
    `SELECT sm.id, sm.supplier_id FROM supplier_materials sm
     JOIN suppliers s ON s.id = sm.supplier_id
     WHERE sm.id = $1 AND s.user_id = $2`,
    [supplierMaterialId, userId]
  )
  return rows[0] || null
}

export async function updateSupplierMaterialHandler(req, res) {
  const { brand, productName, specification, grade, unit, minimumOrderQuantity, available } = req.body ?? {}
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })
    const { rows } = await query(
      `UPDATE supplier_materials SET brand = $1, product_name = $2, specification = $3, grade = $4,
         unit = COALESCE($5, unit), minimum_order_quantity = COALESCE($6, minimum_order_quantity),
         available = COALESCE($7, available), updated_at = now()
       WHERE id = $8 RETURNING *`,
      [brand?.trim() || null, productName?.trim() || null, specification?.trim() || null, grade?.trim() || null,
        unit?.trim(), minimumOrderQuantity != null ? Number(minimumOrderQuantity) : null,
        typeof available === 'boolean' ? available : null, req.params.id]
    )
    res.json({ supplierMaterial: rows[0] })
  } catch (err) {
    console.error('Update supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteSupplierMaterialHandler(req, res) {
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })
    await query('DELETE FROM supplier_materials WHERE id = $1', [req.params.id])
    res.json({ message: 'Removed from your catalog' })
  } catch (err) {
    console.error('Delete supplier material error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateInventoryHandler(req, res) {
  const { quantity, stockStatus } = req.body ?? {}
  if (!STOCK_STATUSES.includes(stockStatus)) return res.status(400).json({ message: 'Invalid stock status' })
  try {
    const { rows } = await query(
      `SELECT inv.id FROM inventory inv
       JOIN supplier_materials sm ON sm.id = inv.supplier_material_id
       JOIN suppliers s ON s.id = sm.supplier_id
       WHERE inv.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Inventory record not found' })
    const { rows: updated } = await query(
      `UPDATE inventory SET quantity = $1, stock_status = $2, last_updated_at = now(), source = 'supplier', verified = true
       WHERE id = $3 RETURNING *`,
      [quantity != null ? Number(quantity) : null, stockStatus, req.params.id]
    )
    res.json({ inventory: updated[0] })
  } catch (err) {
    console.error('Update inventory error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Creates a new current price row and closes the previous one, preserving
// history — this is the supplier-dashboard "update my price" action.
export async function addPriceHandler(req, res) {
  const { price, bulkPrice, minimumQuantity, gstIncluded, unit } = req.body ?? {}
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'Enter a valid price' })
  try {
    const owned = await assertOwnsSupplierMaterial(req.user.id, req.params.id)
    if (!owned) return res.status(404).json({ message: 'Listing not found' })

    const row = await withTransaction(async (client) => {
      await client.query(
        `UPDATE material_prices SET valid_until = now() WHERE supplier_material_id = $1 AND valid_until IS NULL`,
        [req.params.id]
      )
      const { rows } = await client.query(
        `INSERT INTO material_prices (supplier_material_id, price, unit, minimum_quantity, bulk_price, gst_included, source, verified)
         VALUES ($1, $2, $3, $4, $5, $6, 'supplier', true) RETURNING *`,
        [req.params.id, Number(price), unit?.trim() || 'unit', minimumQuantity ? Number(minimumQuantity) : 1,
          bulkPrice != null ? Number(bulkPrice) : null, gstIncluded !== false]
      )
      return rows[0]
    })
    res.status(201).json({ price: row })
  } catch (err) {
    console.error('Add price error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Data-correction path (fix a typo, mark verified) without creating a new
// history entry — distinct from addPriceHandler, which is the normal
// "price changed" path.
export async function correctPriceHandler(req, res) {
  const { price, verified } = req.body ?? {}
  try {
    const { rows: check } = await query(
      `SELECT mp.id FROM material_prices mp
       JOIN supplier_materials sm ON sm.id = mp.supplier_material_id
       JOIN suppliers s ON s.id = sm.supplier_id
       WHERE mp.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!check.length) return res.status(404).json({ message: 'Price record not found' })
    const { rows } = await query(
      `UPDATE material_prices SET price = COALESCE($1, price), verified = COALESCE($2, verified), updated_at = now()
       WHERE id = $3 RETURNING *`,
      [price != null ? Number(price) : null, typeof verified === 'boolean' ? verified : null, req.params.id]
    )
    res.json({ price: rows[0] })
  } catch (err) {
    console.error('Correct price error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// --- Reviews ---

export async function listReviewsHandler(req, res) {
  try {
    const { rows } = await query(
      `SELECT r.*, u.full_name FROM supplier_reviews r JOIN users u ON u.id = r.user_id
       WHERE r.supplier_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
      [req.params.id]
    )
    res.json({ reviews: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, authorName: r.full_name, createdAt: r.created_at })) })
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
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO supplier_reviews (supplier_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = now()`,
        [req.params.id, req.user.id, ratingNum, comment?.trim() || null]
      )
      const { rows: agg } = await client.query(
        `SELECT AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*)::int AS count FROM supplier_reviews WHERE supplier_id = $1`,
        [req.params.id]
      )
      await client.query('UPDATE suppliers SET rating = $1, review_count = $2 WHERE id = $3', [agg[0].avg_rating, agg[0].count, req.params.id])
    })
    res.status(201).json({ message: 'Review saved' })
  } catch (err) {
    console.error('Add review error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// --- Admin verification ---

export async function listPendingSuppliersHandler(req, res) {
  try {
    const status = ['pending', 'verified', 'rejected', 'disabled'].includes(req.query.status) ? req.query.status : 'pending'
    const { rows } = await query(
      `SELECT s.*, sl.city, sl.state FROM suppliers s
       LEFT JOIN supplier_locations sl ON sl.supplier_id = s.id AND sl.is_primary = true
       WHERE s.verification_status = $1 ORDER BY s.created_at DESC`,
      [status]
    )
    res.json({ suppliers: rows.map((s) => ({ ...publicSupplier(s, null, []), city: s.city, state: s.state })) })
  } catch (err) {
    console.error('List pending suppliers error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function verifySupplierHandler(req, res) {
  const { status, notes } = req.body ?? {}
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ message: 'status must be verified or rejected' })
  try {
    const updated = await withTransaction(async (client) => {
      const { rows } = await client.query(
        'UPDATE suppliers SET verification_status = $1, updated_at = now() WHERE id = $2 RETURNING *',
        [status, req.params.id]
      )
      if (!rows.length) return null
      await client.query(
        `INSERT INTO supplier_verifications (supplier_id, reviewed_by, status, notes) VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user.id, status === 'verified' ? 'approved' : 'rejected', notes?.trim() || null]
      )
      return rows[0]
    })
    if (!updated) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ supplier: publicSupplier(updated, null, []) })
  } catch (err) {
    console.error('Verify supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function disableSupplierHandler(req, res) {
  try {
    const { rows } = await query(
      `UPDATE suppliers SET verification_status = 'disabled', updated_at = now() WHERE id = $1 RETURNING *`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ supplier: publicSupplier(rows[0], null, []) })
  } catch (err) {
    console.error('Disable supplier error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

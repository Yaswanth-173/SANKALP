import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierLocationSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true },
  address: { type: String, default: null },
  state: { type: String, default: null },
  district: { type: String, default: null },
  city: { type: String, default: null },
  pincode: { type: String, default: null },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // GeoJSON point kept in sync with latitude/longitude on every write (see
  // suppliersController.js) — required for the 2dsphere index/$near queries.
  // GeoJSON order is [longitude, latitude], the opposite of the plain
  // lat/lng fields kept above for exact response-shape compatibility.
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  place_id: { type: String, default: null },
  is_primary: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

supplierLocationSchema.index({ location: '2dsphere' })
supplierLocationSchema.index(
  { supplier_id: 1 },
  { unique: true, partialFilterExpression: { is_primary: true } }
)
supplierLocationSchema.index({ city: 1 })
supplierLocationSchema.index({ state: 1 })
supplierLocationSchema.index({ pincode: 1 })

export default model('SupplierLocation', supplierLocationSchema)

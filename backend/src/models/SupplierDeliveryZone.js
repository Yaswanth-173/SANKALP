import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierDeliveryZoneSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true, index: true },
  pincode: { type: String, default: null },
  city: { type: String, default: null },
  radius_km: { type: Number, default: null },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

export default model('SupplierDeliveryZone', supplierDeliveryZoneSchema)

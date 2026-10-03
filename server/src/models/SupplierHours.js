import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierHoursSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true, index: true },
  day_of_week: { type: Number, required: true, min: 0, max: 6 },
  opens_at: { type: String, default: null },
  closes_at: { type: String, default: null },
  closed: { type: Boolean, default: false },
}, schemaOptions())

supplierHoursSchema.index({ supplier_id: 1, day_of_week: 1 }, { unique: true })

export default model('SupplierHours', supplierHoursSchema)

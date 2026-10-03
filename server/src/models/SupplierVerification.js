import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierVerificationSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true, index: true },
  reviewed_by: { type: String, default: null },
  status: { type: String, required: true, enum: ['approved', 'rejected'] },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

supplierVerificationSchema.index({ supplier_id: 1, created_at: -1 })

export default model('SupplierVerification', supplierVerificationSchema)

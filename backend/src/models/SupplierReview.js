import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierReviewSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

supplierReviewSchema.index({ supplier_id: 1, user_id: 1 }, { unique: true })
supplierReviewSchema.index({ supplier_id: 1, created_at: -1 })

export default model('SupplierReview', supplierReviewSchema)

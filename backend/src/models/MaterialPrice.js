import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const materialPriceSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_material_id: { type: String, required: true },
  price: { type: Number, required: true, min: [0, 'Enter a valid price'] },
  currency: { type: String, default: 'INR' },
  unit: { type: String, required: true },
  minimum_quantity: { type: Number, default: 1 },
  bulk_price: { type: Number, default: null },
  gst_included: { type: Boolean, default: true },
  valid_from: { type: Date, default: Date.now },
  valid_until: { type: Date, default: null },
  source: { type: String, default: 'seed_dataset' },
  verified: { type: Boolean, default: false },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

materialPriceSchema.index({ supplier_material_id: 1, valid_from: -1 })
// Exactly one "current" (valid_until: null) price per listing — the same
// invariant the Postgres partial unique index enforced.
materialPriceSchema.index(
  { supplier_material_id: 1 },
  { unique: true, partialFilterExpression: { valid_until: null } }
)

export default model('MaterialPrice', materialPriceSchema)

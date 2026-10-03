import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, default: null, index: true },
  business_name: { type: String, required: true },
  owner_name: { type: String, default: null },
  phone: { type: String, default: null },
  whatsapp: { type: String, default: null },
  email: { type: String, default: null },
  gst_number: { type: String, default: null },
  description: { type: String, default: null },
  supplier_type: { type: String, default: null },
  verification_status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'verified', 'rejected', 'disabled'],
  },
  rating: { type: Number, default: null },
  review_count: { type: Number, default: 0 },
  delivery_available: { type: Boolean, default: false },
  delivery_radius_km: { type: Number, default: null },
  minimum_order_value: { type: Number, default: null },
  source: { type: String, required: true, default: 'registration' },
  source_url: { type: String, default: null },
  imported_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

supplierSchema.index({ verification_status: 1 })
// Lets the seed dataset upsert idempotently by name, exactly like the
// Postgres partial unique index — real registrations are never constrained.
supplierSchema.index(
  { business_name: 1 },
  { unique: true, partialFilterExpression: { source: 'seed_dataset' } }
)

export default model('Supplier', supplierSchema)

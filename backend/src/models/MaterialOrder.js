import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

// Order items are embedded (unlike every other former-table-to-collection
// mapping in this migration, which stayed 1:1 with the old tables) because
// they are never read, written, or queried independently of their parent
// order anywhere in the app — the one place embedding is unambiguously the
// right call, matching how MongoDB order/line-item modeling is normally done.
const orderItemSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_material_id: { type: String, default: null },
  product_name: { type: String, required: true },
  unit: { type: String, required: true },
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { _id: false, versionKey: false })

const materialOrderSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, required: true, index: true },
  seq: { type: Number, required: true },
  supplier_id: { type: String, required: true, index: true },
  total_amount: { type: Number, required: true },
  status: { type: String, default: 'placed' },
  items: { type: [orderItemSchema], default: [] },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

materialOrderSchema.index({ user_id: 1, created_at: -1 })

export default model('MaterialOrder', materialOrderSchema)

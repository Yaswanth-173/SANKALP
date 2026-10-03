import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const STOCK_STATUSES = ['IN_STOCK', 'LIMITED', 'OUT_OF_STOCK', 'ON_REQUEST', 'UNKNOWN']

const inventorySchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_material_id: { type: String, required: true, unique: true },
  // Schema-level non-negative guard (mirrors the Postgres CHECK constraint) —
  // this is enforced on every `.save()`/`validate()` call, but NOT on
  // `updateOne`/`findOneAndUpdate` unless `runValidators: true` is passed,
  // which every write path in inventoryController/suppliersController does
  // explicitly for exactly this reason.
  quantity: { type: Number, default: null, min: [0, 'Quantity cannot be negative'] },
  stock_status: { type: String, default: 'UNKNOWN', enum: STOCK_STATUSES },
  last_updated_at: { type: Date, default: Date.now },
  source: { type: String, default: 'seed_dataset' },
  verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

export { STOCK_STATUSES }
export default model('Inventory', inventorySchema)

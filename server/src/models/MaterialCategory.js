import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const materialCategorySchema = new Schema({
  _id: { type: String, default: uuidId },
  name: { type: String, required: true },
  parent_category_id: { type: String, default: null },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

// Matches the two Postgres partial unique indexes: unique top-level names,
// unique (name, parent) among children — a plain compound unique index
// would treat every null-parent row as distinct anyway in Mongo (nulls are
// not deduplicated by a unique index unless sparse+single-field), so a
// partial index expressed via `partialFilterExpression` reproduces the
// Postgres behavior precisely for the top-level case.
materialCategorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { parent_category_id: null } }
)
materialCategorySchema.index(
  { name: 1, parent_category_id: 1 },
  { unique: true, partialFilterExpression: { parent_category_id: { $type: 'string' } } }
)

export default model('MaterialCategory', materialCategorySchema)

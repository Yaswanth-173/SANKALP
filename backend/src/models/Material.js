import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const materialSchema = new Schema({
  _id: { type: String, default: uuidId },
  name: { type: String, required: true, unique: true },
  category_id: { type: String, default: null, index: true },
  subcategory_id: { type: String, default: null },
  brand_id: { type: String, default: null, index: true },
  description: { type: String, default: null },
  specification: { type: String, default: null },
  grade: { type: String, default: null },
  unit: { type: String, required: true },
  image_url: { type: String, default: null },
  image_source: { type: String, default: null },
  search_keywords: { type: String, default: null },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

// Search is done with a case-insensitive regex in the controller, not
// Mongo's $text index — $text tokenizes on whole words, which would change
// existing ILIKE-style partial/substring search behavior (e.g. "Ultra"
// matching "UltraTech"). No index assist for this at the current data
// scale; revisit with Atlas Search if the catalog grows significantly.
export default model('Material', materialSchema)

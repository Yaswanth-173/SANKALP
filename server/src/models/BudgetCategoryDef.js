import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const budgetCategoryDefSchema = new Schema({
  _id: { type: String, default: uuidId },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  parent_category_id: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

export default model('BudgetCategoryDef', budgetCategoryDefSchema)

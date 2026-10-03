import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const budgetCategorySchema = new Schema({
  _id: { type: String, default: uuidId },
  project_id: { type: String, required: true, index: true },
  category: { type: String, required: true },
  budgeted_amount: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

budgetCategorySchema.index({ project_id: 1, category: 1 }, { unique: true })

export default model('BudgetCategory', budgetCategorySchema)

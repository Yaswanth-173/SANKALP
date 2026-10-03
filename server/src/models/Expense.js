import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const expenseSchema = new Schema({
  _id: { type: String, default: uuidId },
  project_id: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  payment_mode: { type: String, default: 'cash' },
  status: { type: String, default: 'paid' },
  expense_date: { type: String, required: true },
  vendor: { type: String, default: null },
  invoice_number: { type: String, default: null },
  notes: { type: String, default: null },
  receipt_url: { type: String, default: null },
  subcategory: { type: String, default: null },
  material: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

expenseSchema.index({ project_id: 1, expense_date: -1 })

export default model('Expense', expenseSchema)

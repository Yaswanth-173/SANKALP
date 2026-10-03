import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const projectSchema = new Schema({
  _id: { type: String, default: uuidId },
  customer_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  location: { type: String, default: null },
  status: { type: String, default: 'active' },
  progress_percent: { type: Number, default: 0 },
  start_date: { type: String, default: null },
  expected_completion: { type: String, default: null },
  total_budget: { type: Number, default: null },
  project_type: { type: String, default: null },
  description: { type: String, default: null },
  address: { type: String, default: null },
  image_url: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

projectSchema.index({ customer_id: 1, created_at: -1 })

export default model('Project', projectSchema)

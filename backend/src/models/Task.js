import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const taskSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, required: true, index: true },
  seq: { type: Number, required: true },
  type: { type: String, default: 'work', enum: ['materials', 'work', 'site_visit'] },
  title: { type: String, required: true },
  description: { type: String, default: null },
  project_name: { type: String, default: null },
  project_location: { type: String, default: null },
  person_name: { type: String, default: null },
  priority: { type: String, default: 'medium', enum: ['high', 'medium', 'low'] },
  status: { type: String, default: 'pending', enum: ['pending', 'in_progress', 'completed'] },
  project_id: { type: String, default: null, index: true },
  assigned_contractor_id: { type: String, default: null, index: true },
  start_date: { type: String, default: null },
  due_date: { type: String, default: null },
  progress_percent: { type: Number, default: 0, min: 0, max: 100 },
  created_at: { type: Date, default: Date.now },
  started_at: { type: Date, default: null },
  completed_at: { type: Date, default: null },
}, schemaOptions())

taskSchema.index({ user_id: 1, created_at: -1 })

export default model('Task', taskSchema)

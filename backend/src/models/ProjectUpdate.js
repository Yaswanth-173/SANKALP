import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const projectUpdateSchema = new Schema({
  _id: { type: String, default: uuidId },
  project_id: { type: String, required: true, index: true },
  author_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  progress_percent: { type: Number, default: null },
  photo_urls: { type: [String], default: [] },
  location: { type: String, default: null },
  task_id: { type: String, default: null },
  contractor_id: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

projectUpdateSchema.index({ project_id: 1, created_at: -1 })

export default model('ProjectUpdate', projectUpdateSchema)

import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const projectFileSchema = new Schema({
  _id: { type: String, default: uuidId },
  project_id: { type: String, required: true, index: true },
  uploaded_by: { type: String, required: true },
  kind: { type: String, required: true },
  filename: { type: String, required: true },
  original_name: { type: String, default: null },
  mime_type: { type: String, required: true },
  size_bytes: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

export default model('ProjectFile', projectFileSchema)

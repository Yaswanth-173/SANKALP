import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const noteSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, required: true, index: true },
  title: { type: String, default: null },
  content: { type: String, required: true },
  color: { type: String, default: 'gold', enum: ['gold', 'blue', 'teal', 'rose', 'violet'] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

noteSchema.index({ user_id: 1, updated_at: -1 })

export default model('Note', noteSchema)

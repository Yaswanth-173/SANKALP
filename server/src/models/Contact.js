import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const contactSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['contractor', 'supervisor', 'worker', 'material_shop'] },
  phone: { type: String, default: null },
  deal_note: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

contactSchema.index({ user_id: 1, created_at: -1 })

export default model('Contact', contactSchema)

import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const messageSchema = new Schema({
  _id: { type: String, default: uuidId },
  contact_id: { type: String, required: true, index: true },
  sender: { type: String, default: 'customer' },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

messageSchema.index({ contact_id: 1, created_at: 1 })

export default model('Message', messageSchema)

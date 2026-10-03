import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const brandSchema = new Schema({
  _id: { type: String, default: uuidId },
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

export default model('Brand', brandSchema)

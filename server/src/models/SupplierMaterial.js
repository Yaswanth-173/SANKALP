import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const supplierMaterialSchema = new Schema({
  _id: { type: String, default: uuidId },
  supplier_id: { type: String, required: true, index: true },
  material_id: { type: String, required: true, index: true },
  brand: { type: String, default: null },
  product_name: {
    type: String,
    required: [true, 'Enter a product name'],
    validate: {
      validator: (v) => typeof v === 'string' && v.trim().length > 0,
      message: 'Enter a product name',
    },
  },
  specification: { type: String, default: null },
  grade: { type: String, default: null },
  unit: { type: String, required: true },
  minimum_order_quantity: { type: Number, default: 1 },
  available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

supplierMaterialSchema.index({ supplier_id: 1, material_id: 1 }, { unique: true })

export default model('SupplierMaterial', supplierMaterialSchema)

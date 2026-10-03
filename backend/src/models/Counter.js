import { Schema, model } from 'mongoose'

// Replaces Postgres SERIAL columns (tasks.seq, material_orders.seq), which
// Mongo has no native equivalent for. One atomic findOneAndUpdate($inc) per
// counter name is race-safe the same way a SERIAL's internal sequence is.
const counterSchema = new Schema({
  _id: { type: String, required: true }, // counter name, e.g. 'tasks', 'material_orders'
  seq: { type: Number, default: 0 },
}, { versionKey: false })

const Counter = model('Counter', counterSchema)

export async function nextSeq(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  return doc.seq
}

export default Counter

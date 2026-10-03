import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const calendarEventSchema = new Schema({
  _id: { type: String, default: uuidId },
  user_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  notes: { type: String, default: null },
  event_date: { type: String, required: true }, // 'YYYY-MM-DD', matches the existing DATE_RE contract exactly
  event_type: { type: String, default: 'other', enum: ['site_visit', 'delivery', 'milestone', 'other'] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

calendarEventSchema.index({ user_id: 1, event_date: 1 })

export default model('CalendarEvent', calendarEventSchema)

import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const userSchema = new Schema({
  _id: { type: String, default: uuidId },
  full_name: { type: String, required: true },
  username: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, required: true, default: 'customer' },
  email_verified_at: { type: Date, default: null },
  verification_otp_hash: { type: String, default: null },
  verification_otp_expires: { type: Date, default: null },
  verification_attempts: { type: Number, default: 0 },
  verification_sent_at: { type: Date, default: null },
  reset_otp_hash: { type: String, default: null },
  reset_otp_expires: { type: Date, default: null },
  preferences: {
    type: Object,
    default: () => ({ theme: 'dark', language: 'en', emailNotifications: true }),
  },
  location: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, schemaOptions())

// Uniqueness is enforced by the collated indexes below, not by `unique: true`
// on the fields above — declaring both creates a duplicate-index warning and
// risks the plain (non-collated, case-sensitive) index winning the race and
// silently defeating case-insensitive uniqueness.
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })
userSchema.index({ username: 1 }, { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } })

export default model('User', userSchema)

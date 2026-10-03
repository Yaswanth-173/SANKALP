import { Schema, model } from 'mongoose'
import { schemaOptions } from './_shared.js'

const contractorTeamMemberSchema = new Schema({
  _id: { type: String }, // e.g. "S01-M1", stable id from the seed CSV
  contractor_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  experience_years: { type: Number, required: true },
  rating: { type: Number, required: true },
  availability: { type: String, required: true },
  email: { type: String, default: null },
  phone: { type: String, default: null },
  user_id: { type: String, default: null, index: true },
}, schemaOptions())

export default model('ContractorTeamMember', contractorTeamMemberSchema)

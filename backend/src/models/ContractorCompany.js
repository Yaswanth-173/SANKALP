import { Schema, model } from 'mongoose'
import { schemaOptions } from './_shared.js'

// Keeps the original short string ids ("S01" etc.) from the CSV seed data —
// unlike app-created rows, this is a curated directory, not user input, so
// a stable human-readable id (not a UUID) is fine here, matching Postgres.
const contractorCompanySchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  category: { type: String, required: true },
  team_size: { type: Number, default: 0 },
}, schemaOptions())

export default model('ContractorCompany', contractorCompanySchema)

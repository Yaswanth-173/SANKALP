import { Schema, model } from 'mongoose'
import { uuidId, schemaOptions } from './_shared.js'

const projectMemberSchema = new Schema({
  _id: { type: String, default: uuidId },
  project_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  role_on_project: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, schemaOptions())

projectMemberSchema.index({ project_id: 1, user_id: 1 }, { unique: true })

export default model('ProjectMember', projectMemberSchema)

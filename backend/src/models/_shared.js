import { randomUUID } from 'node:crypto'

// Every model uses a UUID string as _id (not the default ObjectId) so ids
// keep the exact same format the frontend already receives from Postgres —
// no response-shape change, no id-parsing assumptions to revisit anywhere
// in the client. Controllers read `.id` off plain objects; see each
// controller's public*() mapper, which was changed from `x.id` to `x._id`.
export const uuidId = () => randomUUID()

// Pass as the second arg to `new Schema(shape, schemaOptions())` — declares
// no automatic timestamps/versionKey (each table already has its own
// explicit created_at/updated_at columns) so the migrated shape matches
// the Postgres one exactly, field for field.
export const schemaOptions = (extra = {}) => ({ versionKey: false, ...extra })

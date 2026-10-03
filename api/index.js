import 'dotenv/config'
import app from '../server/src/app.js'
import { connectMongo, ensureCollectionValidators } from '../server/src/config/mongo.js'
import { seedContractorsMongo } from '../server/src/db/seedContractorsMongo.js'
import { seedMaterialsMongo } from '../server/src/db/seedMaterialsMongo.js'
import { seedBudgetCategoriesMongo } from '../server/src/db/seedBudgetCategoriesMongo.js'

const MONGODB_URI = process.env.MONGODB_URI

// Runs once per warm container: connectMongo itself caches the connection
// on globalThis, but the one-time seed calls still need their own guard so
// they don't re-run on every invocation that reuses this module instance.
let readyPromise = null

function ensureReady() {
  if (!MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI is not configured'))
  }
  if (!readyPromise) {
    readyPromise = connectMongo(MONGODB_URI)
      .then(async (connection) => {
        await ensureCollectionValidators(connection.db)
        await seedContractorsMongo()
        await seedMaterialsMongo()
        await seedBudgetCategoriesMongo()
        return connection
      })
      .catch((err) => {
        readyPromise = null
        throw err
      })
  }
  return readyPromise
}

export default async function handler(req, res) {
  try {
    await ensureReady()
  } catch (err) {
    console.error('Failed to initialize MongoDB connection/seed data', err)
    res.status(500).json({ success: false, message: 'Service is temporarily unavailable' })
    return
  }
  app(req, res)
}

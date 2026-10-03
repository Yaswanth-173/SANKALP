// Must stay first: loads backend/.env before anything reads process.env.
import '../backend/src/config/env.js'
import app from '../backend/src/app.js'
import { connectMongo, ensureCollectionValidators } from '../backend/src/config/mongo.js'
import { seedContractorsMongo } from '../backend/src/db/seedContractorsMongo.js'
import { seedMaterialsMongo } from '../backend/src/db/seedMaterialsMongo.js'
import { seedBudgetCategoriesMongo } from '../backend/src/db/seedBudgetCategoriesMongo.js'

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

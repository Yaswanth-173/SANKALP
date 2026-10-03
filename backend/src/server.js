import 'dotenv/config'
import app from './app.js'
import { connectMongo, ensureCollectionValidators } from './config/mongo.js'
import { seedContractorsMongo } from './db/seedContractorsMongo.js'
import { seedMaterialsMongo } from './db/seedMaterialsMongo.js'
import { seedBudgetCategoriesMongo } from './db/seedBudgetCategoriesMongo.js'

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to backend/.env (see .env.example).')
  process.exit(1)
}

connectMongo(MONGODB_URI)
  .then((connection) => ensureCollectionValidators(connection.db))
  .then(() => seedContractorsMongo())
  .then(() => seedMaterialsMongo())
  .then(() => seedBudgetCategoriesMongo())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Sankalp server listening on port ${PORT} (MongoDB)`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize MongoDB connection/seed data', err)
    process.exit(1)
  })

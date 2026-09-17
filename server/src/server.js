import 'dotenv/config'
import app from './app.js'
import { ensureSchema } from './db/ensureSchema.js'
import { seedContractors } from './db/seedContractors.js'
import { seedMaterials } from './db/seedMaterials.js'

const PORT = process.env.PORT || 5000

ensureSchema()
  .then(() => seedContractors())
  .then(() => seedMaterials())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Sankalp server listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database schema', err)
    process.exit(1)
  })

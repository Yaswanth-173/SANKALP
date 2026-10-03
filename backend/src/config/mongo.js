import mongoose from 'mongoose'

// Cached on `globalThis` (not a module-level variable) so a warm Vercel
// serverless container reuses the same connection across invocations even if
// this module is re-evaluated — connecting fresh on every request would
// exhaust Atlas's connection limit within minutes under real traffic.
let cached = globalThis.__mongooseCache
if (!cached) {
  cached = globalThis.__mongooseCache = { connection: null, promise: null }
}

export async function connectMongo(uri) {
  if (cached.connection) return cached.connection

  if (!cached.promise) {
    mongoose.set('strictQuery', true)
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }).then((m) => m.connection)
  }

  try {
    cached.connection = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.connection
}

// Mirrors the Postgres withTransaction(fn) helper exactly — same call
// signature, same all-or-nothing guarantee — so every controller ported
// from a `withTransaction(async (client) => {...})` block only needed its
// `client.query(...)` calls swapped for Mongoose calls passed `{ session }`.
export async function withTransaction(fn) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    session.endSession()
  }
}

// Native MongoDB $jsonSchema validation — a real database-level guarantee,
// not just a Mongoose ODM check (which any raw driver write or a different
// application connecting to the same database could bypass). This is the
// direct equivalent of the Postgres `inventory_quantity_non_negative` CHECK
// constraint, which was specifically verified to reject a raw SQL write
// that skipped the application entirely; the goal here is the same property.
export async function ensureCollectionValidators(db) {
  const existing = await db.listCollections({ name: 'inventories' }).toArray()
  const inventoryValidator = {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        quantity: {
          bsonType: ['double', 'int', 'null'],
          minimum: 0,
          description: 'quantity must be a non-negative number or null (untracked)',
        },
      },
    },
  }
  if (existing.length) {
    await db.command({ collMod: 'inventories', validator: inventoryValidator, validationLevel: 'moderate' })
    return
  }
  try {
    await db.createCollection('inventories', { validator: inventoryValidator, validationLevel: 'moderate' })
  } catch (err) {
    // On a brand-new database, Mongoose's own background index-building for
    // the Inventory model (triggered automatically right after connect())
    // can create this collection at the same moment we do. Losing that race
    // isn't a real failure — the collection exists either way — so fall
    // back to collMod instead of surfacing a spurious startup crash.
    if (err.codeName !== 'NamespaceExists') throw err
    await db.command({ collMod: 'inventories', validator: inventoryValidator, validationLevel: 'moderate' })
  }
}

import { Pool } from 'pg'
import 'dotenv/config'

// Local Postgres (this dev setup, or a self-hosted box) doesn't speak TLS and
// doesn't need to. Every free/open-source hosted option we'd actually deploy
// to — Supabase's pooler, Render's managed Postgres, Neon, Railway — requires
// SSL and presents a cert that Node's default CA bundle won't always fully
// chain (hence rejectUnauthorized: false, the standard pattern for `pg`
// against these providers). Detected from the host rather than NODE_ENV, so
// it also does the right thing during local testing against a real remote
// database.
const databaseUrl = process.env.DATABASE_URL || ''
const isLocalDb = /(^|@)(localhost|127\.0\.0\.1)(:|\/)/.test(databaseUrl)

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
})

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err)
})

export const query = (text, params) => pool.query(text, params)

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

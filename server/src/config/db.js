import { Pool } from 'pg'
import 'dotenv/config'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

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

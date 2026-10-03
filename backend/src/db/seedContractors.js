import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { withTransaction } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH = path.join(__dirname, '../data/contractors_seed.csv')

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {}
    headers.forEach((h, i) => {
      row[h.trim()] = (cells[i] ?? '').trim()
    })
    return row
  })
}

// Idempotent: loads the contractor roster CSV into the database on every
// startup, upserting so re-running with an updated CSV keeps data in sync.
export async function seedContractors() {
  const csvText = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCsv(csvText)

  const companies = new Map()
  for (const row of rows) {
    if (!companies.has(row.contractor_id)) {
      companies.set(row.contractor_id, {
        id: row.contractor_id,
        name: row.contractor_name,
        category: row.category,
        team_size: Number(row.team_size),
      })
    }
  }

  await withTransaction(async (client) => {
    for (const c of companies.values()) {
      await client.query(
        `INSERT INTO contractor_companies (id, name, category, team_size)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = $2, category = $3, team_size = $4`,
        [c.id, c.name, c.category, c.team_size]
      )
    }

    for (const row of rows) {
      await client.query(
        `INSERT INTO contractor_team_members (id, contractor_id, name, role, experience_years, rating, availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           contractor_id = $2, name = $3, role = $4, experience_years = $5, rating = $6, availability = $7`,
        [
          row.member_id,
          row.contractor_id,
          row.member_name,
          row.role,
          Number(row.experience_years),
          Number(row.rating),
          row.availability,
        ]
      )
    }
  })

  console.log(`Seeded ${companies.size} contractor companies, ${rows.length} team members`)
}

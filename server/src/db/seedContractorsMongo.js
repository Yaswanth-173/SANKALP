import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import ContractorCompany from '../models/ContractorCompany.js'
import ContractorTeamMember from '../models/ContractorTeamMember.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH = path.join(__dirname, '../data/contractors_seed.csv')

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {}
    headers.forEach((h, i) => { row[h.trim()] = (cells[i] ?? '').trim() })
    return row
  })
}

// Same idempotent upsert-by-natural-key behavior as the Postgres version —
// re-running with an updated CSV keeps data in sync, never duplicates rows.
export async function seedContractorsMongo() {
  const csvText = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCsv(csvText)

  const companies = new Map()
  for (const row of rows) {
    if (!companies.has(row.contractor_id)) {
      companies.set(row.contractor_id, { _id: row.contractor_id, name: row.contractor_name, category: row.category, team_size: Number(row.team_size) })
    }
  }

  for (const c of companies.values()) {
    await ContractorCompany.updateOne({ _id: c._id }, { $set: { name: c.name, category: c.category, team_size: c.team_size } }, { upsert: true })
  }
  for (const row of rows) {
    await ContractorTeamMember.updateOne(
      { _id: row.member_id },
      { $set: { contractor_id: row.contractor_id, name: row.member_name, role: row.role, experience_years: Number(row.experience_years), rating: Number(row.rating), availability: row.availability } },
      { upsert: true }
    )
  }

  console.log(`Seeded ${companies.size} contractor companies, ${rows.length} team members (MongoDB)`)
}

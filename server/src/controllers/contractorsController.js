import { query } from '../config/db.js'

const publicMember = (m) => ({
  id: m.id,
  name: m.name,
  role: m.role,
  experienceYears: m.experience_years,
  rating: Number(m.rating),
  availability: m.availability,
})

export async function listContractors(req, res) {
  try {
    const { rows: companies } = await query('SELECT * FROM contractor_companies ORDER BY id')
    const { rows: members } = await query('SELECT * FROM contractor_team_members ORDER BY id')

    const membersByContractor = new Map()
    for (const m of members) {
      if (!membersByContractor.has(m.contractor_id)) membersByContractor.set(m.contractor_id, [])
      membersByContractor.get(m.contractor_id).push(m)
    }

    const contractors = companies.map((c) => {
      const team = membersByContractor.get(c.id) || []
      const ratings = team.map((m) => Number(m.rating))
      const experiences = team.map((m) => m.experience_years)
      const availableCount = team.filter((m) => m.availability === 'Available').length

      return {
        id: c.id,
        name: c.name,
        category: c.category,
        teamSize: c.team_size,
        avgRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null,
        minExperience: experiences.length ? Math.min(...experiences) : null,
        maxExperience: experiences.length ? Math.max(...experiences) : null,
        availableCount,
        team: team.map(publicMember),
      }
    })

    res.json({ contractors })
  } catch (err) {
    console.error('List contractors error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

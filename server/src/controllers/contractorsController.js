import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { query, withTransaction } from '../config/db.js'
import { canAccessProject } from './projectsController.js'
import { sendContractorInviteEmail } from '../utils/mailer.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

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

// Contractors currently attached to this project (via project_members), for
// the "who can I assign to a task" picker and the customer-facing team list.
export async function listProjectContractors(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `SELECT ctm.id, ctm.name, ctm.role, ctm.availability, ctm.rating, ctm.experience_years,
              cc.name AS company_name, cc.category, u.id AS user_id, u.email
       FROM project_members pm
       JOIN contractor_team_members ctm ON ctm.user_id = pm.user_id
       JOIN contractor_companies cc ON cc.id = ctm.contractor_id
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND pm.role_on_project = 'contractor'
       ORDER BY ctm.name`,
      [projectId]
    )
    res.json({
      contractors: rows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        availability: r.availability,
        rating: Number(r.rating),
        experienceYears: r.experience_years,
        companyName: r.company_name,
        category: r.category,
        userId: r.user_id,
        email: r.email,
      })),
    })
  } catch (err) {
    console.error('List project contractors error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Attaches a contractor directory member to a project. If the member has
// no login yet, one is created here (mirrors inviteSupervisor) — this is
// the only way a "contractor" role account comes into existence, so it's
// deliberately gated to the owning customer, not self-serve signup.
export async function assignContractorToProject(req, res) {
  const { id: projectId } = req.params
  const { teamMemberId, email, phone } = req.body ?? {}

  if (!teamMemberId || !String(teamMemberId).trim()) {
    return res.status(400).json({ message: 'Choose a contractor to assign' })
  }

  try {
    const { rows: projectRows } = await query('SELECT id FROM projects WHERE id = $1 AND customer_id = $2', [projectId, req.user.id])
    if (!projectRows.length) return res.status(404).json({ message: 'Project not found' })

    const { rows: memberRows } = await query('SELECT * FROM contractor_team_members WHERE id = $1', [teamMemberId])
    if (!memberRows.length) return res.status(404).json({ message: 'Contractor not found' })
    let member = memberRows[0]

    if (member.user_id) {
      await query(
        `INSERT INTO project_members (project_id, user_id, role_on_project)
         VALUES ($1, $2, 'contractor') ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, member.user_id]
      )
      return res.status(201).json({ message: 'Contractor assigned to the project' })
    }

    const normalizedEmail = (email || member.email || '').trim().toLowerCase()
    const normalizedPhone = (phone || member.phone || '').replace(/[\s-]/g, '').trim()
    const inviteErrors = {}
    if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) inviteErrors.email = 'Enter a valid email address'
    if (!normalizedPhone || !PHONE_RE.test(normalizedPhone)) inviteErrors.phone = 'Enter a valid Indian phone number'
    if (Object.keys(inviteErrors).length) {
      return res.status(400).json({ message: 'This contractor has no login yet — provide an email and phone to invite them', errors: inviteErrors })
    }

    const { rows: existingRows } = await query('SELECT * FROM users WHERE lower(email) = $1', [normalizedEmail])
    let contractorUser = existingRows[0]
    let tempPassword = null

    if (contractorUser && contractorUser.role !== 'contractor') {
      return res.status(409).json({
        message: 'This email already belongs to an account that is not a contractor account',
        errors: { email: 'Already registered with a different role' },
      })
    }

    const { rows: projectNameRows } = await query('SELECT name FROM projects WHERE id = $1', [projectId])
    const projectName = projectNameRows[0]?.name || 'your project'

    await withTransaction(async (client) => {
      if (!contractorUser) {
        tempPassword = randomBytes(6).toString('base64url')
        const passwordHash = await bcrypt.hash(tempPassword, 12)
        const { rows: created } = await client.query(
          `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at)
           VALUES ($1, $2, $3, $4, 'contractor', now()) RETURNING *`,
          [member.name, normalizedEmail, normalizedPhone, passwordHash]
        )
        contractorUser = created[0]
      }

      await client.query(
        `UPDATE contractor_team_members SET user_id = $1, email = $2, phone = $3 WHERE id = $4`,
        [contractorUser.id, normalizedEmail, normalizedPhone, teamMemberId]
      )

      await client.query(
        `INSERT INTO project_members (project_id, user_id, role_on_project)
         VALUES ($1, $2, 'contractor') ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, contractorUser.id]
      )
    })

    if (tempPassword) {
      await sendContractorInviteEmail(normalizedEmail, { projectName, tempPassword })
    }

    res.status(201).json({ message: 'Contractor assigned to the project' })
  } catch (err) {
    console.error('Assign contractor error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

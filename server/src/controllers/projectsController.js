import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { query, withTransaction } from '../config/db.js'
import { sendSupervisorInviteEmail } from '../utils/mailer.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

const publicProject = (p) => ({
  id: p.id,
  name: p.name,
  location: p.location,
  status: p.status,
  customerId: p.customer_id,
  customerName: p.customer_name || undefined,
  createdAt: p.created_at,
})

export async function createProject(req, res) {
  const { name, location } = req.body ?? {}

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Give the project a name' })
  }

  try {
    const { rows } = await query(
      `INSERT INTO projects (customer_id, name, location) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, name.trim(), location?.trim() || null]
    )
    res.status(201).json({ project: publicProject(rows[0]) })
  } catch (err) {
    console.error('Create project error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Customers see projects they own; supervisors (and later contractors/
// workers) see projects they've been added to via project_members.
export async function listMyProjects(req, res) {
  try {
    let rows
    if (req.user.role === 'customer') {
      ;({ rows } = await query(
        `SELECT * FROM projects WHERE customer_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      ))
    } else {
      ;({ rows } = await query(
        `SELECT p.*, u.full_name AS customer_name FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         JOIN users u ON u.id = p.customer_id
         WHERE pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [req.user.id]
      ))
    }
    res.json({ projects: rows.map(publicProject) })
  } catch (err) {
    console.error('List projects error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function canAccessProject(userId, role, projectId) {
  if (role === 'customer') {
    const { rows } = await query('SELECT id FROM projects WHERE id = $1 AND customer_id = $2', [projectId, userId])
    return rows.length > 0
  }
  const { rows } = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId])
  return rows.length > 0
}

export async function getProject(req, res) {
  const { id } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, id)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(
      `SELECT p.*, u.full_name AS customer_name FROM projects p
       JOIN users u ON u.id = p.customer_id WHERE p.id = $1`,
      [id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Project not found' })

    const { rows: members } = await query(
      `SELECT u.id, u.full_name AS "fullName", u.email, pm.role_on_project AS "roleOnProject"
       FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1`,
      [id]
    )

    res.json({ project: { ...publicProject(rows[0]), members } })
  } catch (err) {
    console.error('Get project error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Creates (or reuses) a supervisor account for the given email and attaches
// them to this project. Only the owning customer can do this. Invited
// accounts are marked verified immediately since the inviting customer is
// vouching for the address — there is no separate invite-acceptance flow
// yet, which is a deliberate Phase 1 simplification.
export async function inviteSupervisor(req, res) {
  const { id: projectId } = req.params
  const { fullName, email, phone } = req.body ?? {}

  const errors = {}
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter the supervisor’s full name'
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address'
  if (!phone || !PHONE_RE.test(phone.replace(/[\s-]/g, '').trim())) errors.phone = 'Enter a valid Indian phone number'
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

  try {
    const { rows: projectRows } = await query('SELECT * FROM projects WHERE id = $1 AND customer_id = $2', [projectId, req.user.id])
    if (!projectRows.length) return res.status(404).json({ message: 'Project not found' })
    const project = projectRows[0]

    const normalizedEmail = email.trim().toLowerCase()
    const { rows: existingRows } = await query('SELECT * FROM users WHERE lower(email) = $1', [normalizedEmail])
    let supervisor = existingRows[0]
    let tempPassword = null

    if (supervisor && supervisor.role !== 'supervisor') {
      return res.status(409).json({
        message: 'This email already belongs to an account that is not a supervisor account',
        errors: { email: 'Already registered with a different role' },
      })
    }

    await withTransaction(async (client) => {
      if (!supervisor) {
        tempPassword = randomBytes(6).toString('base64url')
        const passwordHash = await bcrypt.hash(tempPassword, 12)
        const { rows: created } = await client.query(
          `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at)
           VALUES ($1, $2, $3, $4, 'supervisor', now()) RETURNING *`,
          [fullName.trim(), normalizedEmail, phone.trim(), passwordHash]
        )
        supervisor = created[0]
      }

      await client.query(
        `INSERT INTO project_members (project_id, user_id, role_on_project)
         VALUES ($1, $2, 'supervisor') ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, supervisor.id]
      )
    })

    if (tempPassword) {
      await sendSupervisorInviteEmail(normalizedEmail, { projectName: project.name, tempPassword })
    }

    res.status(201).json({ message: 'Supervisor added to the project' })
  } catch (err) {
    console.error('Invite supervisor error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

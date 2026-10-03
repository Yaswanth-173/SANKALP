import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import ContractorCompany from '../models/ContractorCompany.js'
import ContractorTeamMember from '../models/ContractorTeamMember.js'
import ProjectMember from '../models/ProjectMember.js'
import User from '../models/User.js'
import Project from '../models/Project.js'
import { canAccessProject } from './projectsController.js'
import { sendContractorInviteEmail } from '../utils/mailer.js'
import { withTransaction } from '../config/mongo.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

const publicMember = (m) => ({
  id: m._id,
  name: m.name,
  role: m.role,
  experienceYears: m.experience_years,
  rating: Number(m.rating),
  availability: m.availability,
})

export async function listContractors(req, res) {
  try {
    const companies = await ContractorCompany.find().sort({ _id: 1 }).lean()
    const members = await ContractorTeamMember.find().sort({ _id: 1 }).lean()

    const membersByContractor = new Map()
    for (const m of members) {
      if (!membersByContractor.has(m.contractor_id)) membersByContractor.set(m.contractor_id, [])
      membersByContractor.get(m.contractor_id).push(m)
    }

    const contractors = companies.map((c) => {
      const team = membersByContractor.get(c._id) || []
      const ratings = team.map((m) => Number(m.rating))
      const experiences = team.map((m) => m.experience_years)
      const availableCount = team.filter((m) => m.availability === 'Available').length

      return {
        id: c._id,
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

export async function listProjectContractors(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    // Replaces the 4-table JOIN: project_members -> contractor_team_members
    // -> contractor_companies, users -- done as sequential queries + an
    // in-memory merge instead of a database-level join.
    const memberships = await ProjectMember.find({ project_id: projectId, role_on_project: 'contractor' }).lean()
    const userIds = memberships.map((m) => m.user_id)
    if (!userIds.length) return res.json({ contractors: [] })

    const [teamMembers, users] = await Promise.all([
      ContractorTeamMember.find({ user_id: { $in: userIds } }).lean(),
      User.find({ _id: { $in: userIds } }).select('_id email').lean(),
    ])
    const companyIds = [...new Set(teamMembers.map((m) => m.contractor_id))]
    const companies = await ContractorCompany.find({ _id: { $in: companyIds } }).lean()
    const companyById = new Map(companies.map((c) => [c._id, c]))
    const userById = new Map(users.map((u) => [u._id, u]))

    const contractors = teamMembers
      .map((m) => {
        const company = companyById.get(m.contractor_id)
        const user = userById.get(m.user_id)
        return {
          id: m._id,
          name: m.name,
          role: m.role,
          availability: m.availability,
          rating: Number(m.rating),
          experienceYears: m.experience_years,
          companyName: company?.name || null,
          category: company?.category || null,
          userId: user?._id || null,
          email: user?.email || null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json({ contractors })
  } catch (err) {
    console.error('List project contractors error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function assignContractorToProject(req, res) {
  const { id: projectId } = req.params
  const { teamMemberId, email, phone } = req.body ?? {}

  if (!teamMemberId || !String(teamMemberId).trim()) {
    return res.status(400).json({ message: 'Choose a contractor to assign' })
  }

  try {
    const project = await Project.findOne({ _id: projectId, customer_id: req.user.id }).select('_id name').lean()
    if (!project) return res.status(404).json({ message: 'Project not found' })

    let member = await ContractorTeamMember.findById(teamMemberId).lean()
    if (!member) return res.status(404).json({ message: 'Contractor not found' })

    if (member.user_id) {
      await ProjectMember.updateOne(
        { project_id: projectId, user_id: member.user_id },
        { $setOnInsert: { role_on_project: 'contractor', created_at: new Date() } },
        { upsert: true }
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

    let contractorUser = await User.findOne({ email: normalizedEmail })
    let tempPassword = null

    if (contractorUser && contractorUser.role !== 'contractor') {
      return res.status(409).json({
        message: 'This email already belongs to an account that is not a contractor account',
        errors: { email: 'Already registered with a different role' },
      })
    }

    await withTransaction(async (session) => {
      if (!contractorUser) {
        tempPassword = randomBytes(6).toString('base64url')
        const passwordHash = await bcrypt.hash(tempPassword, 12)
        const [created] = await User.create(
          [{ full_name: member.name, email: normalizedEmail, phone: normalizedPhone, password_hash: passwordHash, role: 'contractor', email_verified_at: new Date() }],
          { session }
        )
        contractorUser = created
      }

      await ContractorTeamMember.updateOne(
        { _id: teamMemberId },
        { $set: { user_id: contractorUser._id, email: normalizedEmail, phone: normalizedPhone } },
        { session }
      )

      await ProjectMember.updateOne(
        { project_id: projectId, user_id: contractorUser._id },
        { $setOnInsert: { role_on_project: 'contractor', created_at: new Date() } },
        { upsert: true, session }
      )
    })

    if (tempPassword) {
      await sendContractorInviteEmail(normalizedEmail, { projectName: project.name, tempPassword })
    }

    res.status(201).json({ message: 'Contractor assigned to the project' })
  } catch (err) {
    console.error('Assign contractor error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

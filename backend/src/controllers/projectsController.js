import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import User from '../models/User.js'
import { sendSupervisorInviteEmail } from '../utils/mailer.js'
import { withTransaction } from '../config/mongo.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

export const publicProject = (p) => ({
  id: p._id,
  name: p.name,
  location: p.location,
  status: p.status,
  customerId: p.customer_id,
  customerName: p.customer_name || undefined,
  progressPercent: p.progress_percent ?? 0,
  startDate: p.start_date,
  expectedCompletion: p.expected_completion,
  totalBudget: p.total_budget != null ? Number(p.total_budget) : null,
  projectType: p.project_type,
  description: p.description,
  address: p.address,
  imageUrl: p.image_url,
  createdAt: p.created_at,
})

export async function createProject(req, res) {
  const { name, location, startDate, expectedCompletion, totalBudget, projectType, description, address } = req.body ?? {}

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Give the project a name' })
  }

  try {
    const project = await Project.create({
      customer_id: req.user.id,
      name: name.trim(),
      location: location?.trim() || null,
      start_date: startDate || null,
      expected_completion: expectedCompletion || null,
      total_budget: totalBudget != null && totalBudget !== '' ? Number(totalBudget) : null,
      project_type: projectType?.trim() || null,
      description: description?.trim() || null,
      address: address?.trim() || null,
    })
    res.status(201).json({ project: publicProject(project.toObject()) })
  } catch (err) {
    console.error('Create project error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateProject(req, res) {
  const { id } = req.params
  const { name, location, startDate, expectedCompletion, totalBudget, projectType, description, address, imageUrl } = req.body ?? {}

  try {
    const existing = await Project.findOne({ _id: id, customer_id: req.user.id })
    if (!existing) return res.status(404).json({ message: 'Project not found' })

    if (name != null && name.trim().length < 2) {
      return res.status(400).json({ message: 'Give the project a name' })
    }

    const patch = { updated_at: new Date() }
    if (name != null) patch.name = name.trim()
    if (location !== undefined) patch.location = location?.trim() || null
    if (startDate !== undefined) patch.start_date = startDate || null
    if (expectedCompletion !== undefined) patch.expected_completion = expectedCompletion || null
    if (totalBudget !== undefined) patch.total_budget = totalBudget !== '' && totalBudget != null ? Number(totalBudget) : null
    if (projectType !== undefined) patch.project_type = projectType?.trim() || null
    if (description !== undefined) patch.description = description?.trim() || null
    if (address !== undefined) patch.address = address?.trim() || null
    if (imageUrl !== undefined) patch.image_url = imageUrl || null

    const updated = await Project.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).lean()
    res.json({ project: publicProject(updated) })
  } catch (err) {
    console.error('Update project error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listMyProjects(req, res) {
  try {
    let projects
    if (req.user.role === 'customer') {
      projects = await Project.find({ customer_id: req.user.id }).sort({ created_at: -1 }).lean()
    } else {
      const memberships = await ProjectMember.find({ user_id: req.user.id }).lean()
      const projectIds = memberships.map((m) => m.project_id)
      const rawProjects = await Project.find({ _id: { $in: projectIds } }).sort({ created_at: -1 }).lean()
      const customers = await User.find({ _id: { $in: rawProjects.map((p) => p.customer_id) } }).select('_id full_name').lean()
      const nameById = new Map(customers.map((u) => [u._id, u.full_name]))
      projects = rawProjects.map((p) => ({ ...p, customer_name: nameById.get(p.customer_id) }))
    }
    res.json({ projects: projects.map(publicProject) })
  } catch (err) {
    console.error('List projects error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function canAccessProject(userId, role, projectId) {
  if (role === 'customer') {
    const project = await Project.findOne({ _id: projectId, customer_id: userId }).select('_id').lean()
    return !!project
  }
  const membership = await ProjectMember.findOne({ project_id: projectId, user_id: userId }).select('_id').lean()
  return !!membership
}

export async function getProject(req, res) {
  const { id } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, id)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const project = await Project.findById(id).lean()
    if (!project) return res.status(404).json({ message: 'Project not found' })
    const customer = await User.findById(project.customer_id).select('full_name').lean()

    const memberRows = await ProjectMember.find({ project_id: id }).lean()
    const memberUsers = await User.find({ _id: { $in: memberRows.map((m) => m.user_id) } }).select('_id full_name email').lean()
    const userById = new Map(memberUsers.map((u) => [u._id, u]))
    const members = memberRows.map((m) => ({
      id: userById.get(m.user_id)?._id,
      fullName: userById.get(m.user_id)?.full_name,
      email: userById.get(m.user_id)?.email,
      roleOnProject: m.role_on_project,
    }))

    res.json({ project: { ...publicProject({ ...project, customer_name: customer?.full_name }), members } })
  } catch (err) {
    console.error('Get project error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function inviteSupervisor(req, res) {
  const { id: projectId } = req.params
  const { fullName, email, phone } = req.body ?? {}

  const errors = {}
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter the supervisor’s full name'
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address'
  if (!phone || !PHONE_RE.test(phone.replace(/[\s-]/g, '').trim())) errors.phone = 'Enter a valid Indian phone number'
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors })

  try {
    const project = await Project.findOne({ _id: projectId, customer_id: req.user.id }).lean()
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const normalizedEmail = email.trim().toLowerCase()
    let supervisor = await User.findOne({ email: normalizedEmail })
    let tempPassword = null

    if (supervisor && supervisor.role !== 'supervisor') {
      return res.status(409).json({
        message: 'This email already belongs to an account that is not a supervisor account',
        errors: { email: 'Already registered with a different role' },
      })
    }

    await withTransaction(async (session) => {
      if (!supervisor) {
        tempPassword = randomBytes(6).toString('base64url')
        const passwordHash = await bcrypt.hash(tempPassword, 12)
        const [created] = await User.create(
          [{ full_name: fullName.trim(), email: normalizedEmail, phone: phone.trim(), password_hash: passwordHash, role: 'supervisor', email_verified_at: new Date() }],
          { session }
        )
        supervisor = created
      }

      await ProjectMember.updateOne(
        { project_id: projectId, user_id: supervisor._id },
        { $setOnInsert: { role_on_project: 'supervisor', created_at: new Date() } },
        { upsert: true, session }
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

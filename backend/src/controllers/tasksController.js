import Task from '../models/Task.js'
import ContractorTeamMember from '../models/ContractorTeamMember.js'
import ContractorCompany from '../models/ContractorCompany.js'
import ProjectMember from '../models/ProjectMember.js'
import { canAccessProject } from './projectsController.js'
import { nextSeq } from '../models/Counter.js'
import { uuidId } from '../models/_shared.js'

const TYPES = ['materials', 'work', 'site_visit']
const STATUSES = ['pending', 'in_progress', 'completed']
const PRIORITIES = ['high', 'medium', 'low']
const ID_PREFIX = { pending: 'PD', in_progress: 'IP', completed: 'CM' }

const publicTask = (t, contractorName, contractorRole, contractorCompany) => ({
  id: t._id,
  displayId: `${ID_PREFIX[t.status]}-${100 + Number(t.seq)}`,
  type: t.type,
  title: t.title,
  description: t.description,
  projectName: t.project_name,
  projectId: t.project_id,
  projectLocation: t.project_location,
  personName: t.person_name,
  priority: t.priority,
  status: t.status,
  progressPercent: t.progress_percent ?? 0,
  startDate: t.start_date,
  dueDate: t.due_date,
  createdAt: t.created_at,
  startedAt: t.started_at,
  completedAt: t.completed_at,
  assignedContractorId: t.assigned_contractor_id || null,
  assignedContractorName: contractorName || null,
  assignedContractorRole: contractorRole || null,
  assignedContractorCompany: contractorCompany || null,
})

// Replaces PROJECT_TASK_JOIN — resolves contractor name/role/company for a
// batch of tasks with two extra queries instead of a SQL join.
async function enrichTasks(tasks) {
  const contractorIds = [...new Set(tasks.map((t) => t.assigned_contractor_id).filter(Boolean))]
  if (!contractorIds.length) return tasks.map((t) => publicTask(t))

  const members = await ContractorTeamMember.find({ _id: { $in: contractorIds } }).lean()
  const memberById = new Map(members.map((m) => [m._id, m]))
  const companyIds = [...new Set(members.map((m) => m.contractor_id))]
  const companies = await ContractorCompany.find({ _id: { $in: companyIds } }).lean()
  const companyById = new Map(companies.map((c) => [c._id, c]))

  return tasks.map((t) => {
    const member = t.assigned_contractor_id ? memberById.get(t.assigned_contractor_id) : null
    const company = member ? companyById.get(member.contractor_id) : null
    return publicTask(t, member?.name, member?.role, company?.name)
  })
}

export async function listTasks(req, res) {
  try {
    const tasks = await Task.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean()
    res.json({ tasks: await enrichTasks(tasks) })
  } catch (err) {
    console.error('List tasks error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createTask(req, res) {
  const { type, title, description, projectName, projectLocation, personName, priority, projectId } = req.body ?? {}

  const errors = {}
  if (!title || !title.trim()) errors.title = 'Enter a title'
  if (!type || !TYPES.includes(type)) errors.type = 'Choose a valid type'
  if (priority && !PRIORITIES.includes(priority)) errors.priority = 'Choose a valid priority'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  if (projectId) {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })
  }

  try {
    const seq = await nextSeq('tasks')
    const task = await Task.create({
      _id: uuidId(),
      user_id: req.user.id,
      seq,
      type,
      title: title.trim(),
      description: description?.trim() || null,
      project_name: projectName?.trim() || null,
      project_location: projectLocation?.trim() || null,
      person_name: personName?.trim() || null,
      priority: priority || 'medium',
      project_id: projectId || null,
    })
    res.status(201).json({ task: publicTask(task.toObject()) })
  } catch (err) {
    console.error('Create task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function listProjectTasks(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const tasks = await Task.find({ project_id: projectId }).sort({ created_at: -1 }).lean()
    res.json({ tasks: await enrichTasks(tasks) })
  } catch (err) {
    console.error('List project tasks error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function assignTask(req, res) {
  const { id: projectId, taskId } = req.params
  const { contractorMemberId, startDate, dueDate } = req.body ?? {}

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    if (contractorMemberId) {
      const member = await ContractorTeamMember.findById(contractorMemberId).lean()
      const membership = member
        ? await ProjectMember.findOne({ project_id: projectId, user_id: member.user_id, role_on_project: 'contractor' }).lean()
        : null
      if (!member || !membership) {
        return res.status(400).json({ message: 'Assign this contractor to the project before assigning them a task' })
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project_id: projectId },
      { $set: { assigned_contractor_id: contractorMemberId || null, start_date: startDate || null, due_date: dueDate || null } },
      { returnDocument: 'after' }
    ).lean()
    if (!task) return res.status(404).json({ message: 'Task not found' })

    res.json({ task: (await enrichTasks([task]))[0] })
  } catch (err) {
    console.error('Assign task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateProjectTaskProgress(req, res) {
  const { id: projectId, taskId } = req.params
  const { status, progressPercent } = req.body ?? {}

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Choose a valid status', errors: { status: 'Choose a valid status' } })
  }
  if (progressPercent != null && (Number(progressPercent) < 0 || Number(progressPercent) > 100)) {
    return res.status(400).json({ message: 'Progress must be between 0 and 100' })
  }

  try {
    if (req.user.role === 'contractor') {
      const task = await Task.findOne({ _id: taskId, project_id: projectId }).lean()
      const member = task?.assigned_contractor_id ? await ContractorTeamMember.findById(task.assigned_contractor_id).lean() : null
      if (!task || !member || member.user_id !== req.user.id) {
        return res.status(404).json({ message: 'Task not found' })
      }
    } else {
      const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
      if (!allowed) return res.status(404).json({ message: 'Project not found' })
    }

    const patch = {}
    if (status) {
      patch.status = status
      if (status === 'in_progress') patch.started_at = new Date()
      if (status === 'completed') patch.completed_at = new Date()
    }
    if (progressPercent != null) patch.progress_percent = Number(progressPercent)

    const task = await Task.findOneAndUpdate({ _id: taskId, project_id: projectId }, { $set: patch }, { returnDocument: 'after' }).lean()
    if (!task) return res.status(404).json({ message: 'Task not found' })

    res.json({ task: (await enrichTasks([task]))[0] })
  } catch (err) {
    console.error('Update project task progress error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteProjectTask(req, res) {
  const { id: projectId, taskId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const deleted = await Task.findOneAndDelete({ _id: taskId, project_id: projectId })
    if (!deleted) return res.status(404).json({ message: 'Task not found' })
    res.json({ message: 'Task removed' })
  } catch (err) {
    console.error('Delete project task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateTaskStatus(req, res) {
  const { id } = req.params
  const { status } = req.body ?? {}

  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Choose a valid status', errors: { status: 'Choose a valid status' } })
  }

  try {
    const patch = { status }
    if (status === 'in_progress') patch.started_at = new Date()
    if (status === 'completed') patch.completed_at = new Date()

    const task = await Task.findOneAndUpdate({ _id: id, user_id: req.user.id }, { $set: patch }, { returnDocument: 'after' }).lean()
    if (!task) return res.status(404).json({ message: 'Task not found' })
    res.json({ task: publicTask(task) })
  } catch (err) {
    console.error('Update task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteTask(req, res) {
  const { id } = req.params
  try {
    const deleted = await Task.findOneAndDelete({ _id: id, user_id: req.user.id })
    if (!deleted) return res.status(404).json({ message: 'Task not found' })
    res.json({ message: 'Task removed' })
  } catch (err) {
    console.error('Delete task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

import ProjectUpdate from '../models/ProjectUpdate.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import ContractorTeamMember from '../models/ContractorTeamMember.js'
import Project from '../models/Project.js'
import { canAccessProject, publicProject } from './projectsController.js'
import { withTransaction } from '../config/mongo.js'

const MILESTONES = [
  { key: 'foundation', label: 'Foundation Work', threshold: 15 },
  { key: 'plinth', label: 'Plinth & Columns', threshold: 30 },
  { key: 'walls', label: 'Wall Construction', threshold: 55 },
  { key: 'electrical', label: 'Electrical Work', threshold: 75 },
  { key: 'plumbing', label: 'Plumbing Work', threshold: 90 },
  { key: 'finishing', label: 'Finishing', threshold: 100 },
]

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function buildMilestones(project) {
  const progress = project.progressPercent
  let dateRanges = null
  if (project.startDate && project.expectedCompletion) {
    const start = new Date(project.startDate)
    const end = new Date(project.expectedCompletion)
    const totalDays = Math.max(1, Math.round((end - start) / 86400000))
    const perPhase = totalDays / MILESTONES.length
    dateRanges = MILESTONES.map((_, i) => ({
      start: addDays(start, Math.round(i * perPhase)),
      end: addDays(start, Math.round((i + 1) * perPhase)),
    }))
  }

  let prevThreshold = 0
  return MILESTONES.map((m, i) => {
    let status = 'pending'
    if (progress >= m.threshold) status = 'completed'
    else if (progress >= prevThreshold) status = 'in_progress'
    prevThreshold = m.threshold
    return {
      key: m.key,
      label: m.label,
      status,
      startDate: dateRanges?.[i]?.start.toISOString().slice(0, 10) ?? null,
      endDate: dateRanges?.[i]?.end.toISOString().slice(0, 10) ?? null,
    }
  })
}

const publicUpdate = (u) => ({
  id: u._id,
  title: u.title,
  description: u.description,
  progressPercent: u.progress_percent,
  photoUrls: u.photo_urls || [],
  location: u.location,
  authorName: u.author_name,
  authorRole: u.author_role,
  authorId: u.author_id,
  taskId: u.task_id,
  taskTitle: u.task_title || null,
  contractorId: u.contractor_id,
  contractorName: u.contractor_name || null,
  createdAt: u.created_at,
})

// Replaces the 3-way JOIN (users/contractor_team_members/tasks) with a
// batch enrichment pass over already-fetched updates.
async function enrichUpdates(updates) {
  const authorIds = [...new Set(updates.map((u) => u.author_id))]
  const contractorIds = [...new Set(updates.map((u) => u.contractor_id).filter(Boolean))]
  const taskIds = [...new Set(updates.map((u) => u.task_id).filter(Boolean))]

  const [authors, contractors, tasks] = await Promise.all([
    User.find({ _id: { $in: authorIds } }).select('_id full_name role').lean(),
    contractorIds.length ? ContractorTeamMember.find({ _id: { $in: contractorIds } }).select('_id name').lean() : [],
    taskIds.length ? Task.find({ _id: { $in: taskIds } }).select('_id title').lean() : [],
  ])
  const authorById = new Map(authors.map((a) => [a._id, a]))
  const contractorById = new Map(contractors.map((c) => [c._id, c]))
  const taskById = new Map(tasks.map((t) => [t._id, t]))

  return updates.map((u) => publicUpdate({
    ...u,
    author_name: authorById.get(u.author_id)?.full_name,
    author_role: authorById.get(u.author_id)?.role,
    contractor_name: u.contractor_id ? contractorById.get(u.contractor_id)?.name : null,
    task_title: u.task_id ? taskById.get(u.task_id)?.title : null,
  }))
}

export async function getProjectProgress(req, res) {
  const { id } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, id)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const projectDoc = await Project.findById(id).lean()
    if (!projectDoc) return res.status(404).json({ message: 'Project not found' })
    const project = publicProject(projectDoc)

    const updateRows = await ProjectUpdate.find({ project_id: id }).sort({ created_at: -1 }).limit(50).lean()

    const taskRows = await Task.aggregate([
      { $match: { project_id: id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const taskCounts = { pending: 0, in_progress: 0, completed: 0 }
    for (const row of taskRows) taskCounts[row._id] = row.count

    res.json({
      project,
      milestones: buildMilestones(project),
      updates: await enrichUpdates(updateRows),
      taskCounts,
    })
  } catch (err) {
    console.error('Get project progress error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addProgressUpdate(req, res) {
  const { id: projectId } = req.params
  const { title, description, progressPercent, photoUrls, location, taskId } = req.body ?? {}

  if (!title || title.trim().length < 2) {
    return res.status(400).json({ message: 'Give the update a title' })
  }
  if (progressPercent != null && (progressPercent < 0 || progressPercent > 100)) {
    return res.status(400).json({ message: 'Progress must be between 0 and 100' })
  }
  const cleanPhotoUrls = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 6) : []

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    let contractorId = null
    if (req.user.role === 'contractor') {
      const member = await ContractorTeamMember.findOne({ user_id: req.user.id }).select('_id').lean()
      contractorId = member?._id || null
    }

    let validTaskId = null
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, project_id: projectId }).select('_id').lean()
      validTaskId = task?._id || null
    }

    const update = await withTransaction(async (session) => {
      const [created] = await ProjectUpdate.create(
        [{
          project_id: projectId, author_id: req.user.id, title: title.trim(), description: description?.trim() || null,
          progress_percent: progressPercent ?? null, photo_urls: cleanPhotoUrls, location: location?.trim() || null,
          task_id: validTaskId, contractor_id: contractorId,
        }],
        { session }
      )
      if (progressPercent != null) {
        await Project.updateOne({ _id: projectId }, { $set: { progress_percent: progressPercent, updated_at: new Date() } }, { session })
      }
      return created
    })

    const enriched = await enrichUpdates([update.toObject()])
    res.status(201).json({ update: enriched[0] })
  } catch (err) {
    console.error('Add progress update error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function editProgressUpdate(req, res) {
  const { id: projectId, updateId } = req.params
  const { title, description, progressPercent, photoUrls, location } = req.body ?? {}

  if (!title || title.trim().length < 2) {
    return res.status(400).json({ message: 'Give the update a title' })
  }
  if (progressPercent != null && (progressPercent < 0 || progressPercent > 100)) {
    return res.status(400).json({ message: 'Progress must be between 0 and 100' })
  }
  const cleanPhotoUrls = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 6) : []

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const updated = await withTransaction(async (session) => {
      const doc = await ProjectUpdate.findOneAndUpdate(
        { _id: updateId, project_id: projectId },
        { $set: { title: title.trim(), description: description?.trim() || null, progress_percent: progressPercent ?? null, photo_urls: cleanPhotoUrls, location: location?.trim() || null } },
        { returnDocument: 'after', session }
      )
      if (!doc) return null

      const latest = await ProjectUpdate.findOne({ project_id: projectId }).sort({ created_at: -1 }).select('_id').session(session).lean()
      if (progressPercent != null && latest?._id === updateId) {
        await Project.updateOne({ _id: projectId }, { $set: { progress_percent: progressPercent, updated_at: new Date() } }, { session })
      }
      return doc
    })
    if (!updated) return res.status(404).json({ message: 'Update not found' })

    const enriched = await enrichUpdates([updated.toObject()])
    res.json({ update: enriched[0] })
  } catch (err) {
    console.error('Edit progress update error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteProgressUpdate(req, res) {
  const { id: projectId, updateId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const deleted = await withTransaction(async (session) => {
      const removed = await ProjectUpdate.findOneAndDelete({ _id: updateId, project_id: projectId }, { session })
      if (!removed) return false

      const latestWithProgress = await ProjectUpdate.findOne({ project_id: projectId, progress_percent: { $ne: null } })
        .sort({ created_at: -1 }).select('progress_percent').session(session).lean()
      await Project.updateOne(
        { _id: projectId },
        { $set: { progress_percent: latestWithProgress ? latestWithProgress.progress_percent : 0, updated_at: new Date() } },
        { session }
      )
      return true
    })
    if (!deleted) return res.status(404).json({ message: 'Update not found' })

    res.json({ message: 'Update deleted' })
  } catch (err) {
    console.error('Delete progress update error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

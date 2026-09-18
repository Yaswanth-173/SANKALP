import { query, withTransaction } from '../config/db.js'
import { canAccessProject, publicProject } from './projectsController.js'

// Fixed construction phases, in order. A milestone's status is derived from
// the project's current progress_percent rather than tracked separately, so
// there's one source of truth (the % on the project) instead of two things
// that can drift out of sync.
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

// Splits the project's own start/expected-completion dates evenly across
// the 6 phases — a reasonable approximation from real project dates, not
// a fabricated schedule, and only shown when both dates are actually set.
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
  id: u.id,
  title: u.title,
  description: u.description,
  progressPercent: u.progress_percent,
  photoUrls: u.photo_urls || [],
  authorName: u.author_name,
  createdAt: u.created_at,
})

export async function getProjectProgress(req, res) {
  const { id } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, id)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows: projectRows } = await query(
      `SELECT p.*, u.full_name AS customer_name FROM projects p JOIN users u ON u.id = p.customer_id WHERE p.id = $1`,
      [id]
    )
    if (!projectRows.length) return res.status(404).json({ message: 'Project not found' })
    const project = publicProject(projectRows[0])

    const { rows: updateRows } = await query(
      `SELECT pu.*, u.full_name AS author_name FROM project_updates pu
       JOIN users u ON u.id = pu.author_id
       WHERE pu.project_id = $1 ORDER BY pu.created_at DESC LIMIT 50`,
      [id]
    )

    const { rows: taskRows } = await query(
      `SELECT status, count(*)::int AS count FROM tasks WHERE project_id = $1 GROUP BY status`,
      [id]
    )
    const taskCounts = { pending: 0, in_progress: 0, completed: 0 }
    for (const row of taskRows) taskCounts[row.status] = row.count

    res.json({
      project,
      milestones: buildMilestones(project),
      updates: updateRows.map(publicUpdate),
      taskCounts,
    })
  } catch (err) {
    console.error('Get project progress error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function addProgressUpdate(req, res) {
  const { id: projectId } = req.params
  const { title, description, progressPercent, photoUrls } = req.body ?? {}

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

    const update = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO project_updates (project_id, author_id, title, description, progress_percent, photo_urls)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [projectId, req.user.id, title.trim(), description?.trim() || null, progressPercent ?? null, JSON.stringify(cleanPhotoUrls)]
      )
      if (progressPercent != null) {
        await client.query('UPDATE projects SET progress_percent = $1, updated_at = now() WHERE id = $2', [progressPercent, projectId])
      }
      return rows[0]
    })

    const { rows: authorRows } = await query('SELECT full_name FROM users WHERE id = $1', [req.user.id])
    res.status(201).json({ update: publicUpdate({ ...update, author_name: authorRows[0]?.full_name }) })
  } catch (err) {
    console.error('Add progress update error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

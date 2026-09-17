import { query } from '../config/db.js'

const TYPES = ['materials', 'work', 'site_visit']
const STATUSES = ['pending', 'in_progress', 'completed']
const PRIORITIES = ['high', 'medium', 'low']
const ID_PREFIX = { pending: 'PD', in_progress: 'IP', completed: 'CM' }

const publicTask = (t) => ({
  id: t.id,
  displayId: `${ID_PREFIX[t.status]}-${100 + Number(t.seq)}`,
  type: t.type,
  title: t.title,
  description: t.description,
  projectName: t.project_name,
  projectLocation: t.project_location,
  personName: t.person_name,
  priority: t.priority,
  status: t.status,
  createdAt: t.created_at,
  startedAt: t.started_at,
  completedAt: t.completed_at,
})

export async function listTasks(req, res) {
  try {
    const { rows } = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ tasks: rows.map(publicTask) })
  } catch (err) {
    console.error('List tasks error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createTask(req, res) {
  const { type, title, description, projectName, projectLocation, personName, priority } = req.body ?? {}

  const errors = {}
  if (!title || !title.trim()) errors.title = 'Enter a title'
  if (!type || !TYPES.includes(type)) errors.type = 'Choose a valid type'
  if (priority && !PRIORITIES.includes(priority)) errors.priority = 'Choose a valid priority'

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const { rows } = await query(
      `INSERT INTO tasks (user_id, type, title, description, project_name, project_location, person_name, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        type,
        title.trim(),
        description?.trim() || null,
        projectName?.trim() || null,
        projectLocation?.trim() || null,
        personName?.trim() || null,
        priority || 'medium',
      ]
    )
    res.status(201).json({ task: publicTask(rows[0]) })
  } catch (err) {
    console.error('Create task error', err)
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
    const timestampColumn = status === 'in_progress' ? 'started_at' : status === 'completed' ? 'completed_at' : null
    const { rows } = await query(
      `UPDATE tasks SET status = $1${timestampColumn ? `, ${timestampColumn} = now()` : ''}
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Task not found' })
    res.json({ task: publicTask(rows[0]) })
  } catch (err) {
    console.error('Update task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteTask(req, res) {
  const { id } = req.params
  try {
    const { rows } = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Task not found' })
    res.json({ message: 'Task removed' })
  } catch (err) {
    console.error('Delete task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

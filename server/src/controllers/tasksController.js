import { query } from '../config/db.js'
import { canAccessProject } from './projectsController.js'

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
  assignedContractorName: t.contractor_name || null,
  assignedContractorRole: t.contractor_role || null,
  assignedContractorCompany: t.contractor_company || null,
})

const PROJECT_TASK_JOIN = `
  SELECT t.*, ctm.name AS contractor_name, ctm.role AS contractor_role, cc.name AS contractor_company
  FROM tasks t
  LEFT JOIN contractor_team_members ctm ON ctm.id = t.assigned_contractor_id
  LEFT JOIN contractor_companies cc ON cc.id = ctm.contractor_id
`

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
    const { rows } = await query(
      `INSERT INTO tasks (user_id, type, title, description, project_name, project_location, person_name, priority, project_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        type,
        title.trim(),
        description?.trim() || null,
        projectName?.trim() || null,
        projectLocation?.trim() || null,
        personName?.trim() || null,
        priority || 'medium',
        projectId || null,
      ]
    )
    res.status(201).json({ task: publicTask(rows[0]) })
  } catch (err) {
    console.error('Create task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Full task list for a project, gated by project access (not just
// user_id = requester) so a supervisor can see the customer's tasks too.
export async function listProjectTasks(req, res) {
  const { id: projectId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rows } = await query(`${PROJECT_TASK_JOIN} WHERE t.project_id = $1 ORDER BY t.created_at DESC`, [projectId])
    res.json({ tasks: rows.map(publicTask) })
  } catch (err) {
    console.error('List project tasks error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Only a customer/supervisor with project access can assign a contractor to
// one of the project's tasks — and only a contractor already assigned to
// the *project* (via assignContractorToProject) is a valid pick, so task
// assignment can't be used to sneak someone onto a project they're not on.
export async function assignTask(req, res) {
  const { id: projectId, taskId } = req.params
  const { contractorMemberId, startDate, dueDate } = req.body ?? {}

  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    if (contractorMemberId) {
      const { rows: memberRows } = await query(
        `SELECT ctm.id FROM contractor_team_members ctm
         JOIN project_members pm ON pm.user_id = ctm.user_id
         WHERE ctm.id = $1 AND pm.project_id = $2 AND pm.role_on_project = 'contractor'`,
        [contractorMemberId, projectId]
      )
      if (!memberRows.length) {
        return res.status(400).json({ message: 'Assign this contractor to the project before assigning them a task' })
      }
    }

    const { rows } = await query(
      `UPDATE tasks SET assigned_contractor_id = $1, start_date = $2, due_date = $3
       WHERE id = $4 AND project_id = $5 RETURNING *`,
      [contractorMemberId || null, startDate || null, dueDate || null, taskId, projectId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Task not found' })

    const { rows: enriched } = await query(`${PROJECT_TASK_JOIN} WHERE t.id = $1`, [rows[0].id])
    res.json({ task: publicTask(enriched[0]) })
  } catch (err) {
    console.error('Assign task error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Status/progress update scoped to a project, usable by the project's
// customer/supervisor OR by the specific contractor this task is assigned
// to (checked directly, since a contractor's role alone doesn't grant
// access — only being the assignee on this exact task does).
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
      const { rows } = await query(
        `SELECT t.id FROM tasks t
         JOIN contractor_team_members ctm ON ctm.id = t.assigned_contractor_id
         WHERE t.id = $1 AND t.project_id = $2 AND ctm.user_id = $3`,
        [taskId, projectId, req.user.id]
      )
      if (!rows.length) return res.status(404).json({ message: 'Task not found' })
    } else {
      const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
      if (!allowed) return res.status(404).json({ message: 'Project not found' })
    }

    const timestampColumn = status === 'in_progress' ? 'started_at' : status === 'completed' ? 'completed_at' : null
    const { rows } = await query(
      `UPDATE tasks SET
         status = COALESCE($1, status),
         progress_percent = COALESCE($2, progress_percent)
         ${timestampColumn ? `, ${timestampColumn} = now()` : ''}
       WHERE id = $3 AND project_id = $4 RETURNING *`,
      [status || null, progressPercent != null ? Number(progressPercent) : null, taskId, projectId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Task not found' })

    const { rows: enriched } = await query(`${PROJECT_TASK_JOIN} WHERE t.id = $1`, [rows[0].id])
    res.json({ task: publicTask(enriched[0]) })
  } catch (err) {
    console.error('Update project task progress error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Delete scoped to project access (customer/supervisor), unlike the
// personal DELETE /api/tasks/:id which only checks task ownership — a
// supervisor should be able to remove a task the customer created on the
// same project, and vice versa.
export async function deleteProjectTask(req, res) {
  const { id: projectId, taskId } = req.params
  try {
    const allowed = await canAccessProject(req.user.id, req.user.role, projectId)
    if (!allowed) return res.status(404).json({ message: 'Project not found' })

    const { rowCount } = await query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [taskId, projectId])
    if (!rowCount) return res.status(404).json({ message: 'Task not found' })
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

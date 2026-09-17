import { query } from '../config/db.js'

const COLORS = ['gold', 'blue', 'teal', 'rose', 'violet']

const publicNote = (n) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  color: n.color,
  createdAt: n.created_at,
  updatedAt: n.updated_at,
})

export async function listNotes(req, res) {
  try {
    const { rows } = await query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    )
    res.json({ notes: rows.map(publicNote) })
  } catch (err) {
    console.error('List notes error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createNote(req, res) {
  const { title, content, color } = req.body ?? {}

  const errors = {}
  if (!content || !content.trim()) errors.content = 'Write something first'
  if (color && !COLORS.includes(color)) errors.color = 'Invalid color'

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const { rows } = await query(
      `INSERT INTO notes (user_id, title, content, color) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title?.trim() || null, content.trim(), color || 'gold']
    )
    res.status(201).json({ note: publicNote(rows[0]) })
  } catch (err) {
    console.error('Create note error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateNote(req, res) {
  const { id } = req.params
  const { title, content, color } = req.body ?? {}

  if (color && !COLORS.includes(color)) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors: { color: 'Invalid color' } })
  }
  if (content !== undefined && !content.trim()) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors: { content: 'Write something first' } })
  }

  try {
    const { rows } = await query(
      `UPDATE notes SET
         title = COALESCE($1, title),
         content = COALESCE($2, content),
         color = COALESCE($3, color),
         updated_at = now()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title?.trim(), content?.trim(), color, id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Note not found' })
    res.json({ note: publicNote(rows[0]) })
  } catch (err) {
    console.error('Update note error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteNote(req, res) {
  const { id } = req.params
  try {
    const { rows } = await query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Note not found' })
    res.json({ message: 'Note deleted' })
  } catch (err) {
    console.error('Delete note error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

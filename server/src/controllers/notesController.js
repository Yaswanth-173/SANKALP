import Note from '../models/Note.js'

const COLORS = ['gold', 'blue', 'teal', 'rose', 'violet']

const publicNote = (n) => ({
  id: n._id,
  title: n.title,
  content: n.content,
  color: n.color,
  createdAt: n.created_at,
  updatedAt: n.updated_at,
})

export async function listNotes(req, res) {
  try {
    const notes = await Note.find({ user_id: req.user.id }).sort({ updated_at: -1 }).lean()
    res.json({ notes: notes.map(publicNote) })
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
    const note = await Note.create({
      user_id: req.user.id,
      title: title?.trim() || null,
      content: content.trim(),
      color: color || 'gold',
    })
    res.status(201).json({ note: publicNote(note) })
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
    const patch = { updated_at: new Date() }
    if (title !== undefined) patch.title = title?.trim() || null
    if (content !== undefined) patch.content = content.trim()
    if (color !== undefined) patch.color = color

    const note = await Note.findOneAndUpdate({ _id: id, user_id: req.user.id }, { $set: patch }, { returnDocument: 'after' })
    if (!note) return res.status(404).json({ message: 'Note not found' })
    res.json({ note: publicNote(note) })
  } catch (err) {
    console.error('Update note error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteNote(req, res) {
  const { id } = req.params
  try {
    const deleted = await Note.findOneAndDelete({ _id: id, user_id: req.user.id })
    if (!deleted) return res.status(404).json({ message: 'Note not found' })
    res.json({ message: 'Note deleted' })
  } catch (err) {
    console.error('Delete note error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

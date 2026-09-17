import { query } from '../config/db.js'

const EVENT_TYPES = ['site_visit', 'delivery', 'milestone', 'other']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// pg's DATE parser builds the JS Date via `new Date(year, month, day)`
// (local-timezone midnight), so it must be read back with local getters
// — UTC getters would roll it back a day on servers ahead of UTC (e.g. IST).
const formatDate = (d) => {
  if (typeof d === 'string') return d
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const publicEvent = (e) => ({
  id: e.id,
  title: e.title,
  notes: e.notes,
  date: formatDate(e.event_date),
  type: e.event_type,
  createdAt: e.created_at,
})

export async function listEvents(req, res) {
  const { month, year } = req.query

  try {
    let rows
    if (month && year) {
      const m = String(month).padStart(2, '0')
      ;({ rows } = await query(
        `SELECT * FROM calendar_events
         WHERE user_id = $1 AND to_char(event_date, 'YYYY-MM') = $2
         ORDER BY event_date ASC`,
        [req.user.id, `${year}-${m}`]
      ))
    } else {
      ;({ rows } = await query(
        'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date ASC',
        [req.user.id]
      ))
    }
    res.json({ events: rows.map(publicEvent) })
  } catch (err) {
    console.error('List events error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createEvent(req, res) {
  const { title, notes, date, type } = req.body ?? {}

  const errors = {}
  if (!title || !title.trim()) errors.title = 'Enter a title'
  if (!date || !DATE_RE.test(date)) errors.date = 'Choose a valid date'
  if (type && !EVENT_TYPES.includes(type)) errors.type = 'Invalid event type'

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const { rows } = await query(
      `INSERT INTO calendar_events (user_id, title, notes, event_date, event_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title.trim(), notes?.trim() || null, date, type || 'other']
    )
    res.status(201).json({ event: publicEvent(rows[0]) })
  } catch (err) {
    console.error('Create event error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateEvent(req, res) {
  const { id } = req.params
  const { title, notes, date, type } = req.body ?? {}

  const errors = {}
  if (title !== undefined && !title.trim()) errors.title = 'Enter a title'
  if (date !== undefined && !DATE_RE.test(date)) errors.date = 'Choose a valid date'
  if (type !== undefined && !EVENT_TYPES.includes(type)) errors.type = 'Invalid event type'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const { rows } = await query(
      `UPDATE calendar_events SET
         title = COALESCE($1, title),
         notes = COALESCE($2, notes),
         event_date = COALESCE($3, event_date),
         event_type = COALESCE($4, event_type),
         updated_at = now()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [title?.trim(), notes?.trim(), date, type, id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Event not found' })
    res.json({ event: publicEvent(rows[0]) })
  } catch (err) {
    console.error('Update event error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteEvent(req, res) {
  const { id } = req.params
  try {
    const { rows } = await query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Event not found' })
    res.json({ message: 'Event deleted' })
  } catch (err) {
    console.error('Delete event error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

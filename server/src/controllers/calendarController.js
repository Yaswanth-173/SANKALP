import CalendarEvent from '../models/CalendarEvent.js'

const EVENT_TYPES = ['site_visit', 'delivery', 'milestone', 'other']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const publicEvent = (e) => ({
  id: e._id,
  title: e.title,
  notes: e.notes,
  date: e.event_date,
  type: e.event_type,
  createdAt: e.created_at,
})

export async function listEvents(req, res) {
  const { month, year } = req.query
  try {
    const filter = { user_id: req.user.id }
    if (month && year) {
      const m = String(month).padStart(2, '0')
      filter.event_date = { $regex: `^${year}-${m}` }
    }
    const events = await CalendarEvent.find(filter).sort({ event_date: 1 }).lean()
    res.json({ events: events.map(publicEvent) })
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
    const event = await CalendarEvent.create({
      user_id: req.user.id,
      title: title.trim(),
      notes: notes?.trim() || null,
      event_date: date,
      event_type: type || 'other',
    })
    res.status(201).json({ event: publicEvent(event) })
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
    const patch = { updated_at: new Date() }
    if (title !== undefined) patch.title = title.trim()
    if (notes !== undefined) patch.notes = notes?.trim() || null
    if (date !== undefined) patch.event_date = date
    if (type !== undefined) patch.event_type = type

    const event = await CalendarEvent.findOneAndUpdate({ _id: id, user_id: req.user.id }, { $set: patch }, { returnDocument: 'after' })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json({ event: publicEvent(event) })
  } catch (err) {
    console.error('Update event error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteEvent(req, res) {
  const { id } = req.params
  try {
    const deleted = await CalendarEvent.findOneAndDelete({ _id: id, user_id: req.user.id })
    if (!deleted) return res.status(404).json({ message: 'Event not found' })
    res.json({ message: 'Event deleted' })
  } catch (err) {
    console.error('Delete event error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

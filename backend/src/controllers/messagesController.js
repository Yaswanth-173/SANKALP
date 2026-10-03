import Contact from '../models/Contact.js'
import Message from '../models/Message.js'
import CalendarEvent from '../models/CalendarEvent.js'
import { withTransaction } from '../config/mongo.js'

const ROLES = ['contractor', 'supervisor', 'worker', 'material_shop']
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/

const ROLE_LABELS = {
  contractor: 'Contractor',
  supervisor: 'Supervisor',
  worker: 'Worker',
  material_shop: 'Material Shop',
}

function todayDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const publicContact = (c) => ({
  id: c._id,
  name: c.name,
  role: c.role,
  phone: c.phone,
  dealNote: c.deal_note,
  createdAt: c.created_at,
  lastMessageAt: c.last_message?.[0]?.created_at ?? null,
  lastMessagePreview: c.last_message?.[0]?.content ?? null,
})

const publicMessage = (m) => ({
  id: m._id,
  contactId: m.contact_id,
  sender: m.sender,
  content: m.content,
  createdAt: m.created_at,
})

export async function listContacts(req, res) {
  try {
    // Replaces `LEFT JOIN LATERAL (... ORDER BY created_at DESC LIMIT 1)` —
    // a pipeline-based $lookup with its own sort+limit does the same thing.
    const contacts = await Contact.aggregate([
      { $match: { user_id: req.user.id } },
      {
        $lookup: {
          from: 'messages',
          let: { contactId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$contact_id', '$$contactId'] } } },
            { $sort: { created_at: -1 } },
            { $limit: 1 },
            { $project: { content: 1, created_at: 1 } },
          ],
          as: 'last_message',
        },
      },
      { $addFields: { sort_at: { $ifNull: [{ $arrayElemAt: ['$last_message.created_at', 0] }, '$created_at'] } } },
      { $sort: { sort_at: -1 } },
    ])
    res.json({ contacts: contacts.map(publicContact) })
  } catch (err) {
    console.error('List contacts error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function createContact(req, res) {
  const { name, role, phone, dealNote } = req.body ?? {}

  const errors = {}
  if (!name || !name.trim()) errors.name = 'Enter a name'
  if (!role || !ROLES.includes(role)) errors.role = 'Choose a valid role'
  if (phone && !PHONE_RE.test(phone.trim())) errors.phone = 'Enter a valid phone number'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const contact = await withTransaction(async (session) => {
      const [newContact] = await Contact.create(
        [{ user_id: req.user.id, name: name.trim(), role, phone: phone?.trim() || null, deal_note: dealNote?.trim() || null }],
        { session }
      )

      const roleLabel = ROLE_LABELS[role]
      const eventType = role === 'material_shop' ? 'delivery' : 'milestone'
      await CalendarEvent.create(
        [{
          user_id: req.user.id,
          title: `New deal: ${newContact.name} (${roleLabel})`,
          notes: dealNote?.trim() || null,
          event_date: todayDateKey(),
          event_type: eventType,
        }],
        { session }
      )

      return newContact
    })
    res.status(201).json({ contact: publicContact(contact) })
  } catch (err) {
    console.error('Create contact error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function deleteContact(req, res) {
  const { id } = req.params
  try {
    const deleted = await Contact.findOneAndDelete({ _id: id, user_id: req.user.id })
    if (!deleted) return res.status(404).json({ message: 'Contact not found' })
    res.json({ message: 'Contact removed' })
  } catch (err) {
    console.error('Delete contact error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function assertOwnedContact(contactId, userId) {
  const contact = await Contact.findOne({ _id: contactId, user_id: userId }).select('_id').lean()
  return !!contact
}

export async function listMessages(req, res) {
  const { contactId } = req.params
  try {
    if (!(await assertOwnedContact(contactId, req.user.id))) {
      return res.status(404).json({ message: 'Contact not found' })
    }
    const messages = await Message.find({ contact_id: contactId }).sort({ created_at: 1 }).lean()
    res.json({ messages: messages.map(publicMessage) })
  } catch (err) {
    console.error('List messages error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function sendMessage(req, res) {
  const { contactId } = req.params
  const { content } = req.body ?? {}

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Write a message first', errors: { content: 'Write a message first' } })
  }

  try {
    if (!(await assertOwnedContact(contactId, req.user.id))) {
      return res.status(404).json({ message: 'Contact not found' })
    }
    const message = await Message.create({ contact_id: contactId, sender: 'customer', content: content.trim() })
    res.status(201).json({ chatMessage: publicMessage(message) })
  } catch (err) {
    console.error('Send message error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

import { query, withTransaction } from '../config/db.js'

const ROLES = ['contractor', 'supervisor', 'worker', 'material_shop']
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/

const ROLE_LABELS = {
  contractor: 'Contractor',
  supervisor: 'Supervisor',
  worker: 'Worker',
  material_shop: 'Material Shop',
}

// pg's DATE parser builds local-midnight dates; format the CURRENT
// server date the same way a DATE column would round-trip it.
function todayDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const publicContact = (c) => ({
  id: c.id,
  name: c.name,
  role: c.role,
  phone: c.phone,
  dealNote: c.deal_note,
  createdAt: c.created_at,
  lastMessageAt: c.last_message_at ?? null,
  lastMessagePreview: c.last_message_preview ?? null,
})

const publicMessage = (m) => ({
  id: m.id,
  contactId: m.contact_id,
  sender: m.sender,
  content: m.content,
  createdAt: m.created_at,
})

export async function listContacts(req, res) {
  try {
    const { rows } = await query(
      `SELECT c.*, m.content AS last_message_preview, m.created_at AS last_message_at
       FROM contacts c
       LEFT JOIN LATERAL (
         SELECT content, created_at FROM messages
         WHERE contact_id = c.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
       WHERE c.user_id = $1
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [req.user.id]
    )
    res.json({ contacts: rows.map(publicContact) })
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
    const contact = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO contacts (user_id, name, role, phone, deal_note) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, name.trim(), role, phone?.trim() || null, dealNote?.trim() || null]
      )
      const newContact = rows[0]

      const roleLabel = ROLE_LABELS[role]
      const eventType = role === 'material_shop' ? 'delivery' : 'milestone'
      const title = `New deal: ${newContact.name} (${roleLabel})`
      await client.query(
        `INSERT INTO calendar_events (user_id, title, notes, event_date, event_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, title, dealNote?.trim() || null, todayDateKey(), eventType]
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
    const { rows } = await query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Contact not found' })
    res.json({ message: 'Contact removed' })
  } catch (err) {
    console.error('Delete contact error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

async function assertOwnedContact(contactId, userId) {
  const { rows } = await query('SELECT id FROM contacts WHERE id = $1 AND user_id = $2', [contactId, userId])
  return rows.length > 0
}

export async function listMessages(req, res) {
  const { contactId } = req.params
  try {
    if (!(await assertOwnedContact(contactId, req.user.id))) {
      return res.status(404).json({ message: 'Contact not found' })
    }
    const { rows } = await query(
      'SELECT * FROM messages WHERE contact_id = $1 ORDER BY created_at ASC',
      [contactId]
    )
    res.json({ messages: rows.map(publicMessage) })
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
    const { rows } = await query(
      `INSERT INTO messages (contact_id, sender, content) VALUES ($1, 'customer', $2) RETURNING *`,
      [contactId, content.trim()]
    )
    res.status(201).json({ chatMessage: publicMessage(rows[0]) })
  } catch (err) {
    console.error('Send message error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

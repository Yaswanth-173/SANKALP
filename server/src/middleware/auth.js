import { verifyToken } from '../utils/jwt.js'
import { query } from '../config/db.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token
    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = verifyToken(token)
    const { rows } = await query(
      'SELECT id, full_name, username, email, phone, role, preferences, location FROM users WHERE id = $1',
      [decoded.id]
    )
    if (!rows.length) return res.status(401).json({ message: 'User not found' })

    req.user = rows[0]
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' })
  }
}

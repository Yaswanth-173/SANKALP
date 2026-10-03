import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token
    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).select('full_name username email phone role preferences location').lean()
    if (!user) return res.status(401).json({ message: 'User not found' })

    // Every other controller (ported from the Postgres version, where
    // req.user was a plain row with an `.id` column) reads `req.user.id`,
    // not `req.user._id` — aliasing here means none of them needed to change.
    req.user = { ...user, id: user._id }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource' })
    }
    next()
  }
}

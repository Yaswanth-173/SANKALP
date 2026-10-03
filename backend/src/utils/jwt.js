import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!SECRET && process.env.NODE_ENV === 'production') {
	throw new Error('JWT_SECRET must be configured in production')
}

export const signToken = (payload) => jwt.sign(payload, SECRET || 'local-development-secret', { expiresIn: EXPIRES_IN })
export const verifyToken = (token) => jwt.verify(token, SECRET || 'local-development-secret')

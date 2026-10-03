import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  updatePreferences,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Scoped to the endpoints an anonymous attacker could actually abuse
// (credential stuffing, OTP guessing, account enumeration). Deliberately
// does NOT cover /me or /logout — those run on every page load for an
// already-identified session and aren't a brute-force target, so rate
// limiting them would just lock out normal users browsing the site.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
})

router.post('/register', authLimiter, register)
router.post('/verify-email', authLimiter, verifyEmail)
router.post('/resend-verification', authLimiter, resendVerification)
router.post('/login', authLimiter, login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.patch('/profile', requireAuth, updateProfile)
router.post('/change-password', requireAuth, changePassword)
router.patch('/preferences', requireAuth, updatePreferences)

export default router

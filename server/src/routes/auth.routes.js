import { Router } from 'express'
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
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.patch('/profile', requireAuth, updateProfile)
router.post('/change-password', requireAuth, changePassword)
router.patch('/preferences', requireAuth, updatePreferences)

export default router

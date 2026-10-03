import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'
import { sendOtpEmail, sendVerificationEmail } from '../utils/mailer.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const DEFAULT_PREFERENCES = { theme: 'dark', language: 'en', emailNotifications: true }

const publicUser = (u) => ({
  id: u._id,
  fullName: u.full_name,
  username: u.username,
  email: u.email,
  phone: u.phone,
  role: u.role,
  location: u.location || null,
  preferences: { ...DEFAULT_PREFERENCES, ...(u.preferences || {}) },
})

const isProd = process.env.NODE_ENV === 'production'
const cookieOptions = (remember) => ({
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
})

export async function register(req, res) {
  const { fullName, username, phone, email, password, confirmPassword } = req.body ?? {}

  const errors = {}
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter your full name'
  if (!username || !USERNAME_RE.test(username.trim())) errors.username = 'Use 3-30 letters, numbers or underscores'
  if (!phone || !PHONE_RE.test(phone.replace(/[\s-]/g, '').trim())) errors.phone = 'Enter a valid Indian phone number'
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address'
  if (!password || !PASSWORD_RE.test(password)) errors.password = 'Password must be at least 8 characters with a letter and a number'
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = username.trim().toLowerCase()
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] })
    if (existing) {
      return res.status(409).json({
        message: 'An account with this email or username already exists',
        errors: { email: 'Email or username already registered' },
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      full_name: fullName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      phone: phone.trim(),
      password_hash: passwordHash,
      role: 'customer',
    })
    await issueVerificationOtp(user)
    res.status(201).json({
      message: 'Account created. Check your email for the verification code.',
      verificationRequired: true,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email or username already exists',
        errors: { email: 'Email or username already registered' },
      })
    }
    console.error('Register error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 30 * 1000
const MAX_VERIFICATION_ATTEMPTS = 5

const createOtp = () => String(randomInt(100000, 1000000))

async function issueVerificationOtp(user) {
  const otp = createOtp()
  const now = new Date()
  const otpHash = await bcrypt.hash(otp, 12)
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        verification_otp_hash: otpHash,
        verification_otp_expires: new Date(now.getTime() + OTP_TTL_MS),
        verification_attempts: 0,
        verification_sent_at: now,
        updated_at: now,
      },
    }
  )
  await sendVerificationEmail(user.email, otp)
}

export async function verifyEmail(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const otp = String(req.body?.otp || '').trim()
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Enter a valid email and 6-digit verification code' })
  }

  try {
    const user = await User.findOne({ email })
    if (!user || user.email_verified_at || !user.verification_otp_hash || !user.verification_otp_expires) {
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }
    if (user.verification_attempts >= MAX_VERIFICATION_ATTEMPTS || new Date(user.verification_otp_expires) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }

    const matches = await bcrypt.compare(otp, user.verification_otp_hash)
    if (!matches) {
      await User.updateOne({ _id: user._id }, { $inc: { verification_attempts: 1 } })
      return res.status(400).json({ message: 'Invalid or expired verification code' })
    }

    const verifiedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: { email_verified_at: new Date(), verification_otp_hash: null, verification_otp_expires: null, verification_attempts: 0, updated_at: new Date() },
      },
      { returnDocument: 'after' }
    )
    const token = signToken({ id: verifiedUser._id, role: verifiedUser.role })
    res.cookie('token', token, cookieOptions(true))
    return res.json({ message: 'Email verified successfully', user: publicUser(verifiedUser) })
  } catch (err) {
    console.error('Verify email error', err)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function resendVerification(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const genericResponse = { message: 'If the account can be verified, a new code has been sent.' }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' })

  try {
    const user = await User.findOne({ email })
    if (!user || user.email_verified_at) return res.json(genericResponse)
    if (user.verification_sent_at && Date.now() - new Date(user.verification_sent_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait before requesting another code.' })
    }
    await issueVerificationOtp(user)
    return res.json(genericResponse)
  } catch (err) {
    console.error('Resend verification error', err)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body ?? {}
  if (!email || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ message: 'Enter a valid email address' })
  }

  const genericResponse = { message: 'If an account exists for that email, a reset code has been sent.' }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if (!user) return res.json(genericResponse)

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)
    const expires = new Date(Date.now() + OTP_TTL_MS)
    await User.updateOne({ _id: user._id }, { $set: { reset_otp_hash: otpHash, reset_otp_expires: expires } })

    try {
      await sendOtpEmail(email.trim().toLowerCase(), otp)
    } catch (mailErr) {
      console.error('Failed to send OTP email', mailErr)
    }

    res.json(genericResponse)
  } catch (err) {
    console.error('Forgot password error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword, confirmPassword } = req.body ?? {}

  const errors = {}
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address'
  if (!otp || !/^\d{6}$/.test(otp.trim())) errors.otp = 'Enter the 6-digit code'
  if (!newPassword || !PASSWORD_RE.test(newPassword)) errors.newPassword = 'Password must be at least 8 characters with a letter and a number'
  if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    const invalid = { message: 'Invalid or expired code', errors: { otp: 'Invalid or expired code' } }

    if (!user || !user.reset_otp_hash || !user.reset_otp_expires) return res.status(400).json(invalid)
    if (new Date(user.reset_otp_expires).getTime() < Date.now()) return res.status(400).json(invalid)
    const match = await bcrypt.compare(otp.trim(), user.reset_otp_hash)
    if (!match) return res.status(400).json(invalid)

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await User.updateOne(
      { _id: user._id },
      { $set: { password_hash: passwordHash, reset_otp_hash: null, reset_otp_expires: null, updated_at: new Date() } }
    )

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error('Reset password error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) })
}

const THEMES = ['dark', 'light']
const LANGUAGES = ['en', 'hi', 'te']

export async function updatePreferences(req, res) {
  const { theme, language, emailNotifications } = req.body ?? {}

  const errors = {}
  if (theme !== undefined && !THEMES.includes(theme)) errors.theme = 'Invalid theme'
  if (language !== undefined && !LANGUAGES.includes(language)) errors.language = 'Invalid language'
  if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') errors.emailNotifications = 'Invalid value'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const patch = { ...DEFAULT_PREFERENCES, ...(req.user.preferences || {}) }
    if (theme !== undefined) patch.theme = theme
    if (language !== undefined) patch.language = language
    if (emailNotifications !== undefined) patch.emailNotifications = emailNotifications

    const updated = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { preferences: patch, updated_at: new Date() } },
      { returnDocument: 'after' }
    )
    res.json({ user: publicUser(updated) })
  } catch (err) {
    console.error('Update preferences error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function updateProfile(req, res) {
  const { fullName, phone, location } = req.body ?? {}

  const errors = {}
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter your full name'
  if (!phone || !PHONE_RE.test(phone.replace(/[\s-]/g, '').trim())) errors.phone = 'Enter a valid Indian phone number'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { full_name: fullName.trim(), phone: phone.trim(), location: location?.trim() || null, updated_at: new Date() } },
      { returnDocument: 'after' }
    )
    res.json({ message: 'Profile updated', user: publicUser(updated) })
  } catch (err) {
    console.error('Update profile error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body ?? {}

  const errors = {}
  if (!currentPassword) errors.currentPassword = 'Enter your current password'
  if (!newPassword || !PASSWORD_RE.test(newPassword)) errors.newPassword = 'Password must be at least 8 characters with a letter and a number'
  if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields', errors })
  }

  try {
    const user = await User.findById(req.user._id).select('password_hash')
    const match = await bcrypt.compare(currentPassword, user.password_hash)
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect', errors: { currentPassword: 'Current password is incorrect' } })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await User.updateOne({ _id: req.user._id }, { $set: { password_hash: passwordHash, updated_at: new Date() } })
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Change password error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export async function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd })
  res.json({ message: 'Logged out' })
}

export async function login(req, res) {
  const { email: identifier, password, remember } = req.body ?? {}
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' })
  }

  try {
    const normalized = identifier.trim().toLowerCase()
    const user = await User.findOne({ $or: [{ email: normalized }, { username: normalized }] })
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (!user.email_verified_at) {
      return res.status(403).json({ message: 'Please verify your email before signing in', verificationRequired: true })
    }

    const token = signToken({ id: user._id, role: user.role })
    res.cookie('token', token, cookieOptions(remember))
    res.json({ message: 'Signed in successfully', user: publicUser(user) })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

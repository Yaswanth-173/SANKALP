export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_RE = /^[0-9+\-\s()]{7,15}$/
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function validateSignUp({ fullName, phone, email, password, confirmPassword }) {
  const errors = {}
  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name'
  }
  if (!phone || !PHONE_RE.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number'
  }
  if (!email || !EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!password || !PASSWORD_RE.test(password)) {
    errors.password = 'At least 8 characters, with a letter and a number'
  }
  if (!confirmPassword || password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email || !EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!password) {
    errors.password = 'Enter your password'
  }
  return errors
}

export function validateEmail({ email }) {
  const errors = {}
  if (!email || !EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  return errors
}

export function validateResetPassword({ otp, newPassword, confirmPassword }) {
  const errors = {}
  if (!otp || !/^\d{6}$/.test(otp.trim())) {
    errors.otp = 'Enter the 6-digit code'
  }
  if (!newPassword || !PASSWORD_RE.test(newPassword)) {
    errors.newPassword = 'At least 8 characters, with a letter and a number'
  }
  if (!confirmPassword || newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

export function validateProfile({ fullName, phone }) {
  const errors = {}
  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name'
  }
  if (!phone || !PHONE_RE.test(phone.trim())) {
    errors.phone = 'Enter a valid phone number'
  }
  return errors
}

export function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {}
  if (!currentPassword) {
    errors.currentPassword = 'Enter your current password'
  }
  if (!newPassword || !PASSWORD_RE.test(newPassword)) {
    errors.newPassword = 'At least 8 characters, with a letter and a number'
  }
  if (!confirmPassword || newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

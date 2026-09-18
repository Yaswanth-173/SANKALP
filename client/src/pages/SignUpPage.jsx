import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordToggle from '../components/PasswordToggle.jsx'
import Spinner from '../components/Spinner.jsx'
import { validateSignUp } from '../utils/validators.js'
import { useTranslation } from '../i18n/index.js'
import { useAuth } from '../context/AuthContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_MODE_MESSAGE = 'This is a demo deployment with no connected backend, so new accounts can\'t be created here. Ask whoever shared this demo with you for the demo sign-in credentials.'

const initialForm = {
  fullName: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function SignUpPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setSession } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | verify | success | error
  const [formError, setFormError] = useState('')
  const [otp, setOtp] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const validationErrors = validateSignUp(form)
    setErrors(validationErrors)
    setTouched({ fullName: true, username: true, phone: true, email: true, password: true, confirmPassword: true })
    setFormError('')

    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    if (DEMO_MODE) {
      setFormError(DEMO_MODE_MESSAGE)
      setStatus('error')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        setFormError(data.message || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('verify')
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
      setStatus('error')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setFormError('Enter the 6-digit verification code sent to your email.')
      return
    }
    setStatus('submitting')
    setFormError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.message || 'Invalid or expired verification code.')
        setStatus('verify')
        return
      }
      setSession(data.user)
      setStatus('success')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
      setStatus('verify')
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const data = await res.json()
      setFormError(res.ok ? data.message : data.message || 'Unable to resend code.')
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
    }
  }

  return (
    <AuthLayout
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      footer={
        <>
          {t('auth.signup.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
            {t('auth.signup.signIn')}
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p className="font-display text-lg font-semibold text-ink">{t('auth.signup.successTitle')}</p>
            <p className="text-sm text-ink/60">{t('auth.signup.successSubtitle')}</p>
          </motion.div>
        ) : status === 'verify' ? (
          <motion.form
            key="verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleVerify}
            className="flex flex-col gap-4"
          >
            {formError && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">{formError}</p>}
            <p className="text-sm text-ink/60">Enter the 6-digit code sent to {form.email}.</p>
            <FormField
              id="otp"
              label="Email verification code"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={status === 'submitting'} className="group relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70">
              {status === 'submitting' && <Spinner className="h-4 w-4" />}
              Verify email
            </button>
            <button type="button" onClick={handleResend} className="text-sm text-gold-400 hover:text-gold-300">Resend code</button>
          </motion.form>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {formError}
              </motion.p>
            )}

            <FormField
              id="fullName"
              label={t('auth.signup.fullName')}
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.fullName ? errors.fullName : ''}
              placeholder={t('auth.signup.fullName')}
              autoComplete="name"
            />
            <FormField
              id="phone"
              label={t('auth.signup.phone')}
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : ''}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
            <FormField
              id="username"
              label="Username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.username ? errors.username : ''}
              placeholder="your_username"
              autoComplete="username"
            />
            <FormField
              id="email"
              label={t('auth.signup.email')}
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <FormField
              id="password"
              label={t('auth.signup.password')}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : ''}
              placeholder={t('auth.signup.password')}
              autoComplete="new-password"
              hint={touched.password && errors.password ? undefined : t('auth.signup.passwordHint')}
              rightElement={
                <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} label="password" />
              }
            />
            <FormField
              id="confirmPassword"
              label={t('auth.signup.confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              placeholder={t('auth.signup.confirmPassword')}
              autoComplete="new-password"
              rightElement={
                <PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} label="confirm password" />
              }
            />

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="group relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' && <Spinner className="h-4 w-4" />}
              {status === 'submitting' ? t('auth.signup.submitting') : t('auth.signup.submit')}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default SignUpPage

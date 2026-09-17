import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordToggle from '../components/PasswordToggle.jsx'
import Spinner from '../components/Spinner.jsx'
import { validateSignUp } from '../utils/validators.js'
import { useTranslation } from '../i18n/index.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function SignUpPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [formError, setFormError] = useState('')

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
    setTouched({ fullName: true, phone: true, email: true, password: true, confirmPassword: true })
    setFormError('')

    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
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

      if (data.token) localStorage.setItem('sankalp_token', data.token)
      setStatus('success')
      setTimeout(() => navigate('/login'), 1600)
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
      setStatus('error')
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

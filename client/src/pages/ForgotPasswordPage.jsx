import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordToggle from '../components/PasswordToggle.jsx'
import Spinner from '../components/Spinner.jsx'
import { validateEmail, validateResetPassword } from '../utils/validators.js'
import { useTranslation } from '../i18n/index.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState('email') // email | reset | done
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | error
  const [formError, setFormError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [resendStatus, setResendStatus] = useState('idle') // idle | sending
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const requestOtp = async () => {
    let res
    try {
      res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      throw new Error('Could not reach the server. Please check your connection and try again.')
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
    return data.message
  }

  const handleResend = async () => {
    if (resendStatus === 'sending' || resendCooldown > 0) return
    setResendStatus('sending')
    setFormError('')
    try {
      const message = await requestOtp()
      setInfoMessage(`${message} (new code sent)`)
      setResendCooldown(30)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setResendStatus('idle')
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const validationErrors = validateEmail({ email })
    setErrors(validationErrors)
    setTouched({ email: true })
    setFormError('')
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const message = await requestOtp()
      setInfoMessage(message)
      setErrors({})
      setTouched({})
      setStatus('idle')
      setStep('reset')
      setResendCooldown(30)
    } catch (err) {
      setFormError(err.message)
      setStatus('error')
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const validationErrors = validateResetPassword(form)
    setErrors(validationErrors)
    setTouched({ otp: true, newPassword: true, confirmPassword: true })
    setFormError('')
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        setFormError(data.message || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStep('done')
      setTimeout(() => navigate('/login'), 1800)
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <AuthLayout
      title={
        step === 'email'
          ? t('auth.forgot.step1Title')
          : step === 'reset'
            ? t('auth.forgot.step2Title')
            : t('auth.forgot.doneTitle')
      }
      subtitle={
        step === 'email'
          ? t('auth.forgot.step1Subtitle')
          : step === 'reset'
            ? t('auth.forgot.step2Subtitle', { email })
            : t('auth.forgot.doneSubtitle')
      }
      footer={
        <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
          {t('auth.forgot.backToSignIn')}
        </Link>
      }
    >
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.form
            key="email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleEmailSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            {formError && (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
                {formError}
              </p>
            )}
            <FormField
              id="email"
              label={t('auth.login.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched({ email: true })}
              error={touched.email ? errors.email : ''}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' && <Spinner className="h-4 w-4" />}
              {status === 'submitting' ? t('auth.forgot.sendingCode') : t('auth.forgot.sendCode')}
            </button>
          </motion.form>
        )}

        {step === 'reset' && (
          <motion.form
            key="reset"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleResetSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            {infoMessage && !formError && (
              <p className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-sm text-gold-300">
                {infoMessage}
              </p>
            )}
            {formError && (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
                {formError}
              </p>
            )}
            <FormField
              id="otp"
              label={t('auth.forgot.otpLabel')}
              type="text"
              value={form.otp}
              onChange={(e) => setForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              onBlur={() => setTouched((p) => ({ ...p, otp: true }))}
              error={touched.otp ? errors.otp : ''}
              placeholder="123456"
              autoComplete="one-time-code"
            />
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'sending' || resendCooldown > 0}
              className="-mt-2 flex items-center gap-1.5 self-start text-xs font-medium text-gold-400 hover:text-gold-300 disabled:cursor-not-allowed disabled:text-ink/30"
            >
              {resendStatus === 'sending' && <Spinner className="h-3 w-3" />}
              {resendCooldown > 0 ? t('auth.forgot.resendIn', { s: resendCooldown }) : t('auth.forgot.resend')}
            </button>
            <FormField
              id="newPassword"
              label={t('auth.forgot.newPassword')}
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
              error={touched.newPassword ? errors.newPassword : ''}
              placeholder={t('auth.forgot.newPassword')}
              autoComplete="new-password"
              hint={touched.newPassword && errors.newPassword ? undefined : t('auth.signup.passwordHint')}
              rightElement={
                <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} label="password" />
              }
            />
            <FormField
              id="confirmPassword"
              label={t('auth.forgot.confirmNewPassword')}
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              placeholder={t('auth.forgot.confirmNewPassword')}
              autoComplete="new-password"
              rightElement={
                <PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} label="confirm password" />
              }
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' && <Spinner className="h-4 w-4" />}
              {status === 'submitting' ? t('auth.forgot.resetting') : t('auth.forgot.resetPassword')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setFormError('')
                setInfoMessage('')
              }}
              className="text-xs text-ink/40 hover:text-ink/70"
            >
              {t('auth.forgot.useAnotherEmail')}
            </button>
          </motion.form>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-4 text-center"
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
            <p className="text-sm text-ink/60">{t('auth.forgot.takingToSignIn')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default ForgotPasswordPage

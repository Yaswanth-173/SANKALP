import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordToggle from '../components/PasswordToggle.jsx'
import Spinner from '../components/Spinner.jsx'
import { validateLogin } from '../utils/validators.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTranslation } from '../i18n/index.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'

function LoginPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | error
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

    const validationErrors = validateLogin(form)
    setErrors(validationErrors)
    setTouched({ email: true, password: true })
    setFormError('')

    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, remember }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.message || 'Invalid email or password')
        setStatus('error')
        return
      }

      if (data.token) {
        const storage = remember ? localStorage : sessionStorage
        storage.setItem('sankalp_token', data.token)
      }
      setSession(data.user)
      navigate('/dashboard')
    } catch {
      setFormError('Could not reach the server. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.newToSankalp')}{' '}
          <Link to="/signup" className="font-medium text-gold-400 hover:text-gold-300">
            {t('auth.login.createAccount')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
          id="email"
          label={t('auth.login.email')}
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
          label={t('auth.login.password')}
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? errors.password : ''}
          placeholder={t('auth.login.password')}
          autoComplete="current-password"
          rightElement={
            <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} label="password" />
          }
        />

        <div className="flex items-center justify-between text-sm">
          <label htmlFor="remember" className="flex items-center gap-2 text-ink/60">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 bg-navy-900 accent-gold-500"
            />
            {t('auth.login.rememberMe')}
          </label>
          <Link to="/forgot-password" className="text-gold-400 hover:text-gold-300">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' && <Spinner className="h-4 w-4" />}
          {status === 'submitting' ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage

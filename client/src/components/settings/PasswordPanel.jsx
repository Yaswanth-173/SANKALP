import { useState } from 'react'
import FormField from '../FormField.jsx'
import PasswordToggle from '../PasswordToggle.jsx'
import Spinner from '../Spinner.jsx'
import { apiFetch } from '../../utils/api.js'
import { validateChangePassword } from '../../utils/validators.js'
import { useTranslation } from '../../i18n/index.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function PasswordPanel({ onBack }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear only on change (safe) — never on blur, which can race with a
    // submit-button click and cause the retry to miss the button entirely.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }
  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const validationErrors = validateChangePassword(form)
    setErrors(validationErrors)
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true })
    setMessage('')
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setMessage(t('settings.passwordPanel.updated'))
      setStatus('success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTouched({})
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      setMessage(err.message)
      setStatus('error')
    }
  }

  return (
    <SettingsPanelShell title={t('settings.password.title')} onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {message && (
          <p className={`text-sm ${status === 'success' ? 'text-gold-300' : 'text-red-400'}`}>{message}</p>
        )}
        <FormField
          id="currentPassword"
          label={t('settings.passwordPanel.current')}
          type={show.current ? 'text' : 'password'}
          value={form.currentPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.currentPassword ? errors.currentPassword : ''}
          autoComplete="current-password"
          rightElement={
            <PasswordToggle visible={show.current} onToggle={() => setShow((s) => ({ ...s, current: !s.current }))} label="current password" />
          }
        />
        <FormField
          id="newPassword"
          label={t('settings.passwordPanel.new')}
          type={show.next ? 'text' : 'password'}
          value={form.newPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.newPassword ? errors.newPassword : ''}
          autoComplete="new-password"
          hint={touched.newPassword && errors.newPassword ? undefined : t('settings.passwordPanel.hint')}
          rightElement={
            <PasswordToggle visible={show.next} onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} label="new password" />
          }
        />
        <FormField
          id="confirmPassword"
          label={t('settings.passwordPanel.confirm')}
          type={show.confirm ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword ? errors.confirmPassword : ''}
          autoComplete="new-password"
          rightElement={
            <PasswordToggle visible={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} label="confirm password" />
          }
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex items-center justify-center gap-2 self-start rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' && <Spinner className="h-4 w-4" />}
          {t('settings.passwordPanel.submit')}
        </button>
      </form>
    </SettingsPanelShell>
  )
}

export default PasswordPanel

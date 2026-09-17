import { useState } from 'react'
import FormField from '../FormField.jsx'
import Spinner from '../Spinner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiFetch } from '../../utils/api.js'
import { validateProfile } from '../../utils/validators.js'
import { useTranslation } from '../../i18n/index.js'
import { STATE_CITIES } from '../../data/indianCities.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function ProfilePanel({ onBack }) {
  const { t } = useTranslation()
  const { user, setSession } = useAuth()
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', location: user?.location || '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const validationErrors = validateProfile(form)
    setErrors(validationErrors)
    setTouched({ fullName: true, phone: true })
    setMessage('')
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const data = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setSession(data.user)
      setMessage(t('settings.profilePanel.updated'))
      setStatus('success')
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      setMessage(err.message)
      setStatus('error')
    }
  }

  return (
    <SettingsPanelShell title={t('settings.profile.title')} onBack={onBack}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {message && (
          <p className={`text-sm ${status === 'success' ? 'text-gold-300' : 'text-red-400'}`}>{message}</p>
        )}
        <FormField
          id="fullName"
          label={t('settings.profilePanel.fullName')}
          value={form.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.fullName ? errors.fullName : ''}
        />
        <FormField id="email" label={t('settings.profilePanel.email')} value={user?.email || ''} disabled onChange={() => {}} />
        <FormField
          id="phone"
          label={t('settings.profilePanel.phone')}
          type="tel"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone ? errors.phone : ''}
        />
        <div>
          <label htmlFor="location" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">
            Your City
          </label>
          <select
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full rounded-lg border border-ink/15 bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-gold-500/70 focus:bg-navy-900 focus:ring-2 focus:ring-gold-500/20"
          >
            <option value="">Not set</option>
            {Object.entries(STATE_CITIES).map(([state, cities]) => (
              <optgroup key={state} label={state}>
                {cities.map((city) => (
                  <option key={`${state}-${city}`} value={city}>{city}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink/35">Used to show material shops near you.</p>
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex items-center justify-center gap-2 self-start rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' && <Spinner className="h-4 w-4" />}
          {t('settings.profilePanel.save')}
        </button>
      </form>
    </SettingsPanelShell>
  )
}

export default ProfilePanel

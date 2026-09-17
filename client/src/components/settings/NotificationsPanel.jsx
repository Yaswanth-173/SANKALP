import { useState } from 'react'
import { usePreferences } from '../../context/PreferencesContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function NotificationsPanel({ onBack }) {
  const { t } = useTranslation()
  const { emailNotifications, update } = usePreferences()
  const [saved, setSaved] = useState(false)

  const handleToggle = async () => {
    await update({ emailNotifications: !emailNotifications })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <SettingsPanelShell title={t('settings.notifications.title')} onBack={onBack}>
      <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-navy-900/40 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-ink">{t('settings.notificationsPanel.email')}</p>
          <p className="mt-0.5 text-xs text-ink/45">{t('settings.notificationsPanel.emailDesc')}</p>
        </div>
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={emailNotifications}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
            emailNotifications ? 'bg-gold-500' : 'bg-ink/15'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
              emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {saved && <p className="mt-3 text-xs text-gold-300">{t('settings.notificationsPanel.saved')}</p>}
    </SettingsPanelShell>
  )
}

export default NotificationsPanel

import { useTranslation } from '../../i18n/index.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function HelpPanel({ onBack }) {
  const { t } = useTranslation()
  return (
    <SettingsPanelShell title={t('settings.help.title')} onBack={onBack}>
      <div className="rounded-xl border border-ink/10 bg-navy-900/40 p-4">
        <p className="text-sm leading-relaxed text-ink/70">{t('settings.helpPanel.body')}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-ink/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 text-gold-400">
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span>{t('settings.helpPanel.location')}</span>
        </div>
      </div>
    </SettingsPanelShell>
  )
}

export default HelpPanel

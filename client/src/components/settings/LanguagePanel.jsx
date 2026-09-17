import { usePreferences } from '../../context/PreferencesContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function LanguagePanel({ onBack }) {
  const { t } = useTranslation()
  const { language, update } = usePreferences()

  const options = [
    { value: 'en', label: t('settings.languagePanel.english') },
    { value: 'hi', label: t('settings.languagePanel.hindi') },
    { value: 'te', label: t('settings.languagePanel.telugu') },
  ]

  return (
    <SettingsPanelShell title={t('settings.language.title')} onBack={onBack}>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = language === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => update({ language: opt.value })}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
                active ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-ink/10 bg-navy-900/40 text-ink hover:border-ink/20'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {active && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </SettingsPanelShell>
  )
}

export default LanguagePanel

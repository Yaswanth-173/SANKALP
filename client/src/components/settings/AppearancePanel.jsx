import { motion } from 'framer-motion'
import { MoonIcon, SunIcon } from '../dashboard/icons.jsx'
import { usePreferences } from '../../context/PreferencesContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import SettingsPanelShell from './SettingsPanelShell.jsx'

function AppearancePanel({ onBack }) {
  const { t } = useTranslation()
  const { theme, setTheme } = usePreferences()

  const options = [
    { value: 'dark', icon: MoonIcon, label: t('settings.appearancePanel.dark'), desc: t('settings.appearancePanel.darkDesc') },
    { value: 'light', icon: SunIcon, label: t('settings.appearancePanel.light'), desc: t('settings.appearancePanel.lightDesc') },
  ]

  return (
    <SettingsPanelShell title={t('settings.appearance.title')} onBack={onBack}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon
          const active = theme === opt.value
          return (
            <motion.button
              key={opt.value}
              onClick={(e) => setTheme(opt.value, { x: e.clientX, y: e.clientY })}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-200 ${
                active ? 'border-gold-500/50 bg-gold-500/10' : 'border-ink/10 bg-navy-900/40 hover:border-ink/20'
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-gold-500/20 text-gold-300' : 'bg-ink/5 text-ink/50'}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-ink">{opt.label}</span>
              <span className="text-xs text-ink/45">{opt.desc}</span>
            </motion.button>
          )
        })}
      </div>
    </SettingsPanelShell>
  )
}

export default AppearancePanel

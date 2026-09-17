import { motion } from 'framer-motion'
import { useTranslation } from '../../i18n/index.js'

function SettingsPanelShell({ title, onBack, children }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-xs font-medium text-ink/50 hover:text-gold-400"
      >
        {t('settings.back')}
      </button>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </motion.div>
  )
}

export default SettingsPanelShell

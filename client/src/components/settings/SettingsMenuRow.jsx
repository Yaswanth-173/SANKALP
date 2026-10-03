import { motion } from 'framer-motion'
import { ChevronRightIcon } from '../dashboard/icons.jsx'

function SettingsMenuRow({ icon: Icon, title, description, onClick, danger = false, index = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4 }}
      className={`flex w-full items-center gap-4 rounded-xl border border-ink/10 bg-navy-900/40 px-4 py-3.5 text-left transition-colors duration-200 hover:border-gold-500/30 hover:bg-navy-900/70 ${
        danger ? 'hover:border-danger/30' : ''
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          danger ? 'border-danger/20 bg-danger/10 text-danger' : 'border-gold-500/20 bg-gold-500/10 text-accent'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-danger' : 'text-ink'}`}>{title}</p>
        {description && <p className="mt-0.5 truncate text-xs text-fg-subtle">{description}</p>}
      </div>
      {!danger && <ChevronRightIcon className="h-4 w-4 shrink-0 text-fg-subtle" />}
    </motion.button>
  )
}

export default SettingsMenuRow

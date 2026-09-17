import { motion, AnimatePresence } from 'framer-motion'
import { roleConfig } from './roleConfig.js'
import { useTranslation } from '../../i18n/index.js'

const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatWhen(iso, language) {
  if (!iso) return ''
  const locale = LOCALE_MAP[language] || 'en-IN'
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function ContactList({ contacts, activeId, onSelect, onDelete, onAddClick }) {
  const { t, language } = useTranslation()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
          {t('messages.yourDeals')}
        </h3>
        <button
          onClick={onAddClick}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-charcoal transition-transform duration-200 hover:scale-110"
          aria-label="Add a deal"
        >
          +
        </button>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {contacts.length === 0 && (
          <p className="px-1 py-4 text-sm text-ink/40">{t('messages.noDeals')}</p>
        )}
        <AnimatePresence initial={false}>
          {contacts.map((c, i) => {
            const cfg = roleConfig(c.role)
            const active = c.id === activeId
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                onClick={() => onSelect(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(c.id)
                }}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
                  active ? `${cfg.border} ${cfg.bg}` : 'border-transparent hover:bg-ink/5'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{c.name}</span>
                    <span className="shrink-0 text-[11px] text-ink/30">{formatWhen(c.lastMessageAt, language)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className="text-[11px] text-ink/40">{t(cfg.labelKey)}</span>
                  </div>
                  {c.lastMessagePreview && (
                    <p className="mt-0.5 truncate text-xs text-ink/40">{c.lastMessagePreview}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(c.id)
                  }}
                  aria-label={`Remove ${c.name}`}
                  className="shrink-0 rounded-md p-1 text-ink/0 group-hover:text-ink/30 hover:!text-red-400 hover:bg-red-400/10"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ContactList

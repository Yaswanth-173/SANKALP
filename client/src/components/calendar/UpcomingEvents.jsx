import { eventTypeConfig } from './eventTypes.js'
import { useTranslation } from '../../i18n/index.js'

const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

function formatShortDate(dateKey, language) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE_MAP[language] || 'en-IN', { day: 'numeric', month: 'short' })
}

function UpcomingEvents({ events, onSelectDate }) {
  const { t, language } = useTranslation()
  if (events.length === 0) return null

  return (
    <div className="mt-4 rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
        {t('calendar.upcoming')}
      </h3>
      <div className="mt-3 space-y-2">
        {events.map((ev) => {
          const cfg = eventTypeConfig(ev.type)
          return (
            <button
              key={ev.id}
              onClick={() => onSelectDate(ev.date)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-ink/5"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.color}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{ev.title}</span>
              <span className="shrink-0 text-xs text-ink/40">{formatShortDate(ev.date, language)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default UpcomingEvents

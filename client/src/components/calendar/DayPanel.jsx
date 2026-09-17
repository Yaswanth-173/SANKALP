import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { EVENT_TYPES, eventTypeConfig } from './eventTypes.js'
import { useTranslation } from '../../i18n/index.js'

const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

function formatDateLabel(dateKey, language) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE_MAP[language] || 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function DayPanel({ dateKey, events, onCreate, onDelete }) {
  const { t, language } = useTranslation()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('other')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || status === 'submitting') return
    setStatus('submitting')
    setError('')
    try {
      await onCreate({ title: title.trim(), type, notes: notes.trim(), date: dateKey })
      setTitle('')
      setNotes('')
      setType('other')
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus('idle')
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-navy-900/50 p-5">
      <h3 className="font-display text-base font-semibold text-ink">{formatDateLabel(dateKey, language)}</h3>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <p className="text-sm text-ink/40">{t('calendar.noEvents')}</p>
          )}
          {events.map((ev) => {
            const cfg = eventTypeConfig(ev.type)
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                whileHover={{ y: -2, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`flex items-start justify-between gap-2 rounded-lg border ${cfg.border} bg-navy-950/50 px-3 py-2 shadow-none hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.color}`} />
                    <span className={`text-xs font-medium uppercase tracking-wide ${cfg.text}`}>{t(cfg.labelKey)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{ev.title}</p>
                  {ev.notes && <p className="mt-0.5 text-xs text-ink/50">{ev.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  disabled={deletingId === ev.id}
                  aria-label="Delete event"
                  className="shrink-0 rounded-md p-1 text-ink/30 hover:bg-red-400/10 hover:text-red-400"
                >
                  {deletingId === ev.id ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  )}
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-ink/10 pt-4">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('calendar.addEvent')}
          className="w-full rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
        />
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                type === opt.value ? `${opt.border} ${opt.text} bg-ink/5` : 'border-ink/10 text-ink/40 hover:text-ink/70'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!title.trim() || status === 'submitting'}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-charcoal transition-colors duration-200 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'submitting' && <Spinner className="h-3.5 w-3.5" />}
          {t('calendar.addEventBtn')}
        </button>
      </form>
    </div>
  )
}

export default DayPanel

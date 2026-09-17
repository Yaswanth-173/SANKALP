import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { roleConfig } from './roleConfig.js'
import { useTranslation } from '../../i18n/index.js'

const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

function formatTime(iso, language) {
  return new Date(iso).toLocaleTimeString(LOCALE_MAP[language] || 'en-IN', { hour: 'numeric', minute: '2-digit' })
}

function ChatThread({ contact, messages, loading, onSend }) {
  const { t, language } = useTranslation()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-ink/40">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/10 bg-navy-950/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
            <path d="M4 5h16v11H8l-4 4V5Z" />
          </svg>
        </span>
        <p className="mt-3 text-sm">{t('messages.selectDeal')}</p>
      </div>
    )
  }

  const cfg = roleConfig(contact.role)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      await onSend(draft.trim())
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          {contact.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
          <p className="text-xs text-ink/40">{t(cfg.labelKey)}{contact.dealNote ? ` · ${contact.dealNote}` : ''}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-5 w-5 text-ink/40" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink/30">{t('messages.noMessages')}</p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="flex justify-end"
              >
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-gold-500 px-3.5 py-2 text-sm text-charcoal">
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className="mt-1 text-right text-[10px] text-charcoal/60">{formatTime(m.createdAt, language)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink/10 px-4 py-3">
        <p className="mb-2 text-[11px] text-ink/30">
          {t('messages.willReply', { name: contact.name })}
        </p>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('messages.messagePlaceholder', { name: contact.name })}
            className="flex-1 rounded-full border border-ink/15 bg-navy-950/60 px-4 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-charcoal transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatThread

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { NOTE_COLOR_LIST, noteColorConfig } from './noteColors.js'
import { useTranslation } from '../../i18n/index.js'

function NoteComposer({ onCreate }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [color, setColor] = useState('gold')
  const [status, setStatus] = useState('idle')

  const close = () => {
    setOpen(false)
    setContent('')
    setColor('gold')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || status === 'submitting') return
    setStatus('submitting')
    try {
      await onCreate({ content: content.trim(), color })
      close()
    } finally {
      setStatus('idle')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[160px] rounded-2xl border border-dashed border-ink/15 bg-navy-900/30 p-4 transition-colors duration-300 hover:border-gold-500/40"
    >
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="flex h-full min-h-[128px] w-full flex-col items-center justify-center gap-2 text-ink/40 transition-colors duration-200 hover:text-gold-400"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-xl">
              +
            </span>
            <span className="text-sm">{t('notes.addNote')}</span>
          </motion.button>
        ) : (
          <motion.form
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex h-full flex-col"
          >
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') close()
              }}
              placeholder={t('notes.placeholder')}
              rows={4}
              className="flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {NOTE_COLOR_LIST.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Choose color ${c}`}
                    className={`h-4 w-4 rounded-full ${noteColorConfig(c).accent} ${
                      color === c ? 'ring-2 ring-ink/60' : 'opacity-50 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={close} className="text-xs text-ink/40 hover:text-ink/70">
                  {t('notes.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || status === 'submitting'}
                  className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'submitting' && <Spinner className="h-3 w-3" />}
                  {t('notes.save')}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default NoteComposer

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { ROLES } from './roleConfig.js'
import { useTranslation } from '../../i18n/index.js'

function AddDealModal({ open, onClose, onCreate }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [role, setRole] = useState('contractor')
  const [phone, setPhone] = useState('')
  const [dealNote, setDealNote] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')

  const reset = () => {
    setName('')
    setRole('contractor')
    setPhone('')
    setDealNote('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || status === 'submitting') return
    setStatus('submitting')
    setError('')
    try {
      await onCreate({ name: name.trim(), role, phone: phone.trim(), dealNote: dealNote.trim() })
      reset()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold text-ink">{t('messages.addDeal')}</h3>
            <p className="mt-1 text-xs text-ink/50">{t('messages.addDealDesc')}</p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('messages.namePlaceholder')}
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />

              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                      role === r.value ? `${r.border} ${r.color} bg-ink/5` : 'border-ink/10 text-ink/40 hover:text-ink/70'
                    }`}
                  >
                    {t(r.labelKey)}
                  </button>
                ))}
              </div>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('messages.phonePlaceholder')}
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />
              <input
                value={dealNote}
                onChange={(e) => setDealNote(e.target.value)}
                placeholder={t('messages.dealNotePlaceholder')}
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />

              <div className="mt-1 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="text-xs text-ink/40 hover:text-ink/70">
                  {t('messages.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || status === 'submitting'}
                  className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'submitting' && <Spinner className="h-3.5 w-3.5" />}
                  {t('messages.add')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddDealModal

import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
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
    <Modal open={Boolean(open)} onClose={onClose} label="Add deal" className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-pop">
            <h3 className="font-display text-lg font-semibold text-ink">{t('messages.addDeal')}</h3>
            <p className="mt-1 text-xs text-fg-subtle">{t('messages.addDealDesc')}</p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {error && <p className="text-xs text-danger">{error}</p>}

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('messages.namePlaceholder')}
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-fg-subtle focus:border-gold-500/60"
              />

              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                      role === r.value ? `${r.border} ${r.color} bg-ink/5` : 'border-ink/10 text-fg-subtle hover:text-fg'
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
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-fg-subtle focus:border-gold-500/60"
              />
              <input
                value={dealNote}
                onChange={(e) => setDealNote(e.target.value)}
                placeholder={t('messages.dealNotePlaceholder')}
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-fg-subtle focus:border-gold-500/60"
              />

              <div className="mt-1 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="text-xs text-fg-subtle hover:text-fg">
                  {t('messages.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || status === 'submitting'}
                  className="btn btn-primary"
                >
                  {status === 'submitting' && <Spinner className="h-3.5 w-3.5" />}
                  {t('messages.add')}
                </button>
              </div>
            </form>
    </Modal>
  )
}

export default AddDealModal

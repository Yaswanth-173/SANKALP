import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { TYPE_CONFIG, PRIORITY_CONFIG } from './taskIcons.jsx'

function AddTaskModal({ open, onClose, onCreate }) {
  const [type, setType] = useState('work')
  const [priority, setPriority] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [personName, setPersonName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')

  const reset = () => {
    setType('work')
    setPriority('medium')
    setTitle('')
    setDescription('')
    setProjectName('')
    setProjectLocation('')
    setPersonName('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || status === 'submitting') return
    setStatus('submitting')
    setError('')
    try {
      await onCreate({
        type,
        priority,
        title: title.trim(),
        description: description.trim(),
        projectName: projectName.trim(),
        projectLocation: projectLocation.trim(),
        personName: personName.trim(),
      })
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
            <h3 className="font-display text-lg font-semibold text-ink">New Report</h3>
            <p className="mt-1 text-xs text-ink/50">Log a task, materials request, or site visit for your project.</p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_CONFIG).map(([value, cfg]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                      type === value ? `border-gold-500/40 ${cfg.color} bg-ink/5` : 'border-ink/10 text-ink/40 hover:text-ink/70'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PRIORITY_CONFIG).map(([value, cfg]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                      priority === value ? `${cfg.border} ${cfg.color} bg-ink/5` : 'border-ink/10 text-ink/40 hover:text-ink/70'
                    }`}
                  >
                    {cfg.label} Priority
                  </button>
                ))}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Request title (e.g. Material Approval)"
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (e.g. Approval for bathroom tiles)"
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />
              <input
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                placeholder="Location (optional)"
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />
              <input
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Reported by (optional)"
                className="rounded-lg border border-ink/15 bg-navy-950/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold-500/60"
              />

              <div className="mt-1 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="text-xs text-ink/40 hover:text-ink/70">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || status === 'submitting'}
                  className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'submitting' && <Spinner className="h-3.5 w-3.5" />}
                  Add Report
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddTaskModal

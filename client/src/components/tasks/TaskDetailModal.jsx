import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { TYPE_CONFIG, PRIORITY_CONFIG } from './taskIcons.jsx'

const NEXT_STATUS = { pending: 'in_progress', in_progress: 'completed', completed: null }
const NEXT_LABEL = { pending: 'Start Work', in_progress: 'Mark Complete' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function TaskDetailModal({ task, onClose, onAdvance, onDelete }) {
  const [busy, setBusy] = useState(false)

  if (!task) return null
  const typeCfg = TYPE_CONFIG[task.type]
  const TypeIcon = typeCfg.icon
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const nextStatus = NEXT_STATUS[task.status]

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {task && (
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
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink/10 bg-navy-900 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-ink/35">#{task.displayId}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink">{task.title}</h3>
              </div>
              <button onClick={onClose} className="rounded-md p-1 text-ink/40 hover:bg-ink/5 hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {task.description && <p className="mt-2 text-sm text-ink/60">{task.description}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                <TypeIcon className="h-3.5 w-3.5" /> {typeCfg.label}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${priorityCfg.border} ${priorityCfg.bg} ${priorityCfg.color}`}>
                {priorityCfg.label} Priority
              </span>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-ink/10 bg-navy-950/40 p-3.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-ink/40">Project</span>
                <span className="text-right text-ink/80">
                  {task.projectName || '—'}
                  {task.projectLocation && <span className="block text-xs text-ink/40">{task.projectLocation}</span>}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink/40">Reported On</span>
                <span className="text-ink/80">{formatDate(task.createdAt)}</span>
              </div>
              {task.startedAt && (
                <div className="flex justify-between gap-3">
                  <span className="text-ink/40">Started On</span>
                  <span className="text-ink/80">{formatDate(task.startedAt)}</span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex justify-between gap-3">
                  <span className="text-ink/40">Completed On</span>
                  <span className="text-ink/80">{formatDate(task.completedAt)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-ink/40">Person</span>
                <span className="text-ink/80">{task.personName || '—'}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => run(() => onDelete(task.id))}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
              >
                Delete Report
              </button>
              {nextStatus && (
                <button
                  onClick={() => run(() => onAdvance(task, nextStatus))}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal hover:bg-gold-400 disabled:opacity-50"
                >
                  {busy && <Spinner className="h-3.5 w-3.5" />} {NEXT_LABEL[task.status]}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default TaskDetailModal

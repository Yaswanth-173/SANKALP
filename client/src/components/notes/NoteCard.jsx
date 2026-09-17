import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { noteColorConfig } from './noteColors.js'
import { useTranslation } from '../../i18n/index.js'

const TILT_RANGE = 7
const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

function formatTimestamp(iso, language) {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[language] || 'en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function NoteCard({ note, onSave, onDelete, index = 0 }) {
  const { language } = useTranslation()
  const cardRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 260, damping: 20, mass: 0.6 })
  const springY = useSpring(rotateY, { stiffness: 260, damping: 20, mass: 0.6 })

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cfg = noteColorConfig(note.color)

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * TILT_RANGE * 2)
    rotateX.set(-py * TILT_RANGE * 2)
  }
  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const handleSave = async () => {
    if (!draft.trim() || draft === note.content) {
      setDraft(note.content)
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(note.id, { content: draft.trim() })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = (color) => {
    onSave(note.id, { color })
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(note.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, rotate: index % 2 === 0 ? -2 : 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.4, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.03, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`group relative flex min-h-[160px] flex-col rounded-2xl border ${cfg.border} ${cfg.bg} p-4 shadow-lg backdrop-blur-sm`}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 20px 45px -15px ${cfg.glow}` }}
        />

        <div style={{ transform: 'translateZ(20px)' }} className="flex items-center justify-between">
          <span className={`h-2 w-2 rounded-full ${cfg.accent}`} />
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {Object.keys({ gold: 1, blue: 1, teal: 1, rose: 1, violet: 1 }).map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                aria-label={`Set color ${c}`}
                className={`h-3 w-3 rounded-full ${noteColorConfig(c).accent} ${
                  note.color === c ? 'ring-2 ring-ink/60' : 'opacity-50 hover:opacity-100'
                }`}
              />
            ))}
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete note"
              className="ml-1 rounded-md p-1 text-ink/30 hover:bg-red-400/10 hover:text-red-400"
            >
              {deleting ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          style={{ transform: 'translateZ(15px)' }}
          className="mt-2 flex-1 cursor-text"
          onClick={() => !editing && setEditing(true)}
        >
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
                if (e.key === 'Escape') {
                  setDraft(note.content)
                  setEditing(false)
                }
              }}
              rows={5}
              className="w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{note.content}</p>
          )}
        </div>

        <div style={{ transform: 'translateZ(10px)' }} className="mt-3 flex items-center justify-between text-[11px] text-ink/30">
          <span>{formatTimestamp(note.updatedAt, language)}</span>
          {saving && <Spinner className="h-3 w-3" />}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default NoteCard

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import NoteCard from '../components/notes/NoteCard.jsx'
import NoteComposer from '../components/notes/NoteComposer.jsx'
import { apiFetch } from '../utils/api.js'
import { useTranslation } from '../i18n/index.js'

function NotesPage() {
  const { t } = useTranslation()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/notes')
        setNotes(data.notes)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCreate = async ({ content, color }) => {
    const data = await apiFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ content, color }),
    })
    setNotes((prev) => [data.note, ...prev])
  }

  const handleSave = async (id, patch) => {
    const data = await apiFetch(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)))
  }

  const handleDelete = async (id) => {
    await apiFetch(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title={t('notes.title')}
            subtitle={t('notes.subtitle')}
          />

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <NoteComposer onCreate={handleCreate} />
            <AnimatePresence mode="popLayout">
              {notes.map((note, i) => (
                <NoteCard key={note.id} note={note} index={i} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </DashboardShell>
  )
}

export default NotesPage

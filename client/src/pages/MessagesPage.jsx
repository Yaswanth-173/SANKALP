import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import ContactList from '../components/messages/ContactList.jsx'
import ChatThread from '../components/messages/ChatThread.jsx'
import AddDealModal from '../components/messages/AddDealModal.jsx'
import { apiFetch } from '../utils/api.js'
import { useTranslation } from '../i18n/index.js'

function MessagesPage() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileView, setMobileView] = useState('list') // list | thread
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/messages/contacts')
        setContacts(data.contacts)
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [])

  useEffect(() => {
    if (!activeId) return
    setLoadingMessages(true)
    ;(async () => {
      try {
        const data = await apiFetch(`/api/messages/contacts/${activeId}/messages`)
        setMessages(data.messages)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingMessages(false)
      }
    })()
  }, [activeId])

  const activeContact = contacts.find((c) => c.id === activeId) || null

  const handleSelect = (id) => {
    setActiveId(id)
    setMobileView('thread')
  }

  const handleCreateContact = async (payload) => {
    const data = await apiFetch('/api/messages/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setContacts((prev) => [data.contact, ...prev])
  }

  const handleDeleteContact = async (id) => {
    await apiFetch(`/api/messages/contacts/${id}`, { method: 'DELETE' })
    setContacts((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
      setMobileView('list')
    }
  }

  const handleSend = async (content) => {
    const data = await apiFetch(`/api/messages/contacts/${activeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    setMessages((prev) => [...prev, data.chatMessage])
    setContacts((prev) =>
      prev
        .map((c) =>
          c.id === activeId
            ? { ...c, lastMessagePreview: data.chatMessage.content, lastMessageAt: data.chatMessage.createdAt }
            : c
        )
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))
    )
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title={t('messages.title')}
            subtitle={t('messages.subtitle')}
          />

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 grid h-[calc(100vh-220px)] min-h-[420px] grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-ink/10 bg-navy-900/40 lg:grid-cols-[300px_1fr]"
          >
            <div className={`overflow-hidden border-ink/10 p-3 lg:block lg:border-r ${mobileView === 'list' ? 'block' : 'hidden'}`}>
              <ContactList
                contacts={contacts}
                activeId={activeId}
                onSelect={handleSelect}
                onDelete={handleDeleteContact}
                onAddClick={() => setModalOpen(true)}
              />
            </div>

            <div className={`overflow-hidden lg:block ${mobileView === 'thread' ? 'block' : 'hidden'}`}>
              {mobileView === 'thread' && (
                <button
                  onClick={() => setMobileView('list')}
                  className="m-2 flex items-center gap-1 text-xs text-ink/50 hover:text-ink lg:hidden"
                >
                  {t('messages.backToDeals')}
                </button>
              )}
              <ChatThread contact={activeContact} messages={messages} loading={loadingMessages} onSend={handleSend} />
            </div>
          </motion.div>

          <AddDealModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateContact} />
        </>
      )}
    </DashboardShell>
  )
}

export default MessagesPage

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import Spinner from '../components/Spinner.jsx'
import { SkeletonRows } from '../components/ui/Skeleton.jsx'
import { CartIcon } from '../components/contractors/contractorIcons.jsx'
import { CONTRACTOR_ICON_IMAGES } from '../components/contractors/contractorIconImages.js'
import { findCategoryByName, isCartDealNote } from '../data/contractorCategories.js'
import { apiFetch } from '../utils/api.js'

function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/messages/contacts')
        setItems(data.contacts.filter((c) => isCartDealNote(c.dealNote)))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      await apiFetch(`/api/messages/contacts/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="Cart"
            subtitle="Contractor categories you've added, ready to follow up on."
          />

          {error && <p className="mt-5 text-sm text-danger">{error}</p>}

          {loading ? (
            <SkeletonRows className="mt-6" />
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-16 flex flex-col items-center gap-4 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 bg-navy-900/60 text-fg-subtle">
                <CartIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-base font-semibold text-ink">Your cart is empty</p>
                <p className="mt-1 text-sm text-fg-subtle">Browse contractor categories and add the ones you need.</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/contractors')}
                className="btn btn-primary mt-2"
              >
                Browse Contractors
              </button>
            </motion.div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const category = findCategoryByName(item.name)
                  const iconSrc = category ? CONTRACTOR_ICON_IMAGES[category.slug] : null
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -4 }}
                      className="flex flex-col rounded-2xl border border-ink/10 bg-navy-900/50 p-5 transition-colors duration-300 hover:border-gold-500/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {iconSrc ? (
                          <img src={iconSrc} alt="" className="h-11 w-11" draggable={false} />
                        ) : (
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10 bg-ink/5 text-accent/90">
                            <CartIcon className="h-5 w-5" />
                          </span>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removingId === item.id}
                          className="rounded-md p-1.5 text-fg-subtle hover:bg-danger/10 hover:text-danger"
                          aria-label={`Remove ${item.name}`}
                        >
                          {removingId === item.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <h3 className="mt-3 font-display text-sm font-semibold text-ink">{item.name}</h3>
                      {item.dealNote?.includes('Requested:') && (
                        <p className="mt-1 text-xs font-medium text-accent">
                          {item.dealNote.split('Requested:')[1].trim()}
                        </p>
                      )}
                      {category?.description && (
                        <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{category.description}</p>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        {category && (
                          <button
                            onClick={() => navigate(`/dashboard/contractors/${category.slug}`)}
                            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-fg-muted transition-colors duration-200 hover:border-gold-500/40 hover:text-ink"
                          >
                            View Details
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/dashboard/messages')}
                          className="flex-1 rounded-lg bg-gold-500/15 px-3 py-2 text-xs font-semibold text-accent transition-colors duration-200 hover:bg-gold-500/25"
                        >
                          View in Messages
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default CartPage

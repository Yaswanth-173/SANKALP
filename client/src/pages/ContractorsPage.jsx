import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import CategoryTabs from '../components/contractors/CategoryTabs.jsx'
import ContractorCard from '../components/contractors/ContractorCard.jsx'
import { SearchIcon } from '../components/contractors/contractorIcons.jsx'
import { CONTRACTOR_GROUPS, FULL_HOUSE, isCartDealNote } from '../data/contractorCategories.js'
import { apiFetch } from '../utils/api.js'

function ContractorsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [cartByName, setCartByName] = useState({}) // { [categoryName]: contactId }

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/messages/contacts')
        const next = {}
        data.contacts
          .filter((c) => isCartDealNote(c.dealNote))
          .forEach((c) => {
            next[c.name] = c.id
          })
        setCartByName(next)
      } catch {
        // non-fatal — cards just start unaware of existing cart state
      }
    })()
  }, [])

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    const groups = activeTab === 'all' ? CONTRACTOR_GROUPS : CONTRACTOR_GROUPS.filter((g) => g.id === activeTab)
    const flat = groups.flatMap((g) => g.categories)
    if (!q) return flat
    return flat.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }, [activeTab, query])

  const showFullHouse = activeTab === 'all' && !query.trim()

  const handleAddToCart = async (category) => {
    const data = await apiFetch('/api/messages/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: category.name,
        role: 'contractor',
        dealNote: `Added from Contractor Categories`,
      }),
    })
    setCartByName((prev) => ({ ...prev, [category.name]: data.contact.id }))
    setToast(`${category.name} added to your deals`)
    setTimeout(() => setToast(null), 3200)
  }

  const handleRemoveFromCart = async (category) => {
    const id = cartByName[category.name]
    if (!id) return
    await apiFetch(`/api/messages/contacts/${id}`, { method: 'DELETE' })
    setCartByName((prev) => {
      const next = { ...prev }
      delete next[category.name]
      return next
    })
    setToast(`${category.name} removed from your deals`)
    setTimeout(() => setToast(null), 3200)
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title="List of Contractors"
            subtitle="Find and manage trusted construction professionals."
          />

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contractors…"
                className="w-full rounded-full border border-ink/15 bg-navy-900/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-gold-500/50"
              />
            </div>

            <CategoryTabs groups={CONTRACTOR_GROUPS} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="contents"
              >
                {showFullHouse && (
                  <div className="sm:col-span-2 xl:col-span-2">
                    <ContractorCard
                      category={FULL_HOUSE}
                      featured
                      inCart={Boolean(cartByName[FULL_HOUSE.name])}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                    />
                  </div>
                )}
                {visibleCategories.map((cat, i) => (
                  <ContractorCard
                    key={cat.slug}
                    category={cat}
                    index={i}
                    inCart={Boolean(cartByName[cat.name])}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {visibleCategories.length === 0 && !showFullHouse && (
            <p className="mt-10 text-center text-sm text-ink/40">No contractors match "{query}".</p>
          )}

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-gold-500/40 bg-navy-900 px-5 py-2.5 text-sm text-ink shadow-2xl"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </DashboardShell>
  )
}

export default ContractorsPage

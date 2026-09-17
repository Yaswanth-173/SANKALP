import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import { BackArrowIcon, ChevronRightIcon } from '../components/dashboard/icons.jsx'
import { CartIcon, CheckCircleIcon } from '../components/contractors/contractorIcons.jsx'
import { CONTRACTOR_ICON_IMAGES } from '../components/contractors/contractorIconImages.js'
import { MessagesIcon } from '../components/dashboard/icons.jsx'
import { findCategoryBySlug, FULL_HOUSE, isCartDealNote } from '../data/contractorCategories.js'
import { apiFetch } from '../utils/api.js'
import Spinner from '../components/Spinner.jsx'

const UNAVAILABLE_STATS = ['Projects Completed', 'Service Area', 'Starting Price', 'Estimated Duration']

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function ContractorDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const category = findCategoryBySlug(slug)
  const [busy, setBusy] = useState(false)
  const [cartId, setCartId] = useState(null)
  const [cartDealNote, setCartDealNote] = useState(null)
  const [checkingCart, setCheckingCart] = useState(true)
  const [toast, setToast] = useState(null)
  const [company, setCompany] = useState(null)
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'profile'

  useEffect(() => {
    if (!category) return
    ;(async () => {
      try {
        const data = await apiFetch('/api/contractors')
        const match = data.contractors.find((c) => c.name === category.name)
        setCompany(match || null)
      } catch {
        setCompany(null)
      } finally {
        setLoadingCompany(false)
      }
    })()

    ;(async () => {
      try {
        const data = await apiFetch('/api/messages/contacts')
        const match = data.contacts.find((c) => c.name === category.name && isCartDealNote(c.dealNote))
        setCartId(match ? match.id : null)
        setCartDealNote(match ? match.dealNote : null)
      } catch {
        setCartId(null)
        setCartDealNote(null)
      } finally {
        setCheckingCart(false)
      }
    })()
  }, [category])

  // Once both the team roster and any existing request are loaded, restore
  // which specific person was previously requested (if any) and jump
  // straight to their profile instead of the picker list.
  useEffect(() => {
    if (!company || !cartDealNote) return
    const marker = 'Requested: '
    const idx = cartDealNote.indexOf(marker)
    if (idx === -1) return
    const requestedText = cartDealNote.slice(idx + marker.length)
    const match = company.team.find((m) => requestedText.startsWith(m.name))
    if (match) {
      setSelectedMemberId(match.id)
      setView('profile')
    }
  }, [company, cartDealNote])

  if (!category) {
    return (
      <DashboardShell>
        {({ onMenuClick }) => (
          <>
            <DashboardHeader onMenuClick={onMenuClick} title="Not found" subtitle="This contractor category doesn't exist." />
            <button
              onClick={() => navigate('/dashboard/contractors')}
              className="mt-6 flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
            >
              <BackArrowIcon className="h-4 w-4" /> Back to Contractors
            </button>
          </>
        )}
      </DashboardShell>
    )
  }

  const isFullHouse = category.slug === FULL_HOUSE.slug
  const iconSrc = CONTRACTOR_ICON_IMAGES[category.slug]
  const services = isFullHouse ? null : category.services
  const selectedMember = company?.team.find((m) => m.id === selectedMemberId) || null

  const handleSelectMember = (memberId) => {
    setSelectedMemberId(memberId)
    setView('profile')
  }

  const handleToggleRequest = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (cartId) {
        await apiFetch(`/api/messages/contacts/${cartId}`, { method: 'DELETE' })
        setCartId(null)
        setCartDealNote(null)
        setToast('Request cancelled')
      } else {
        const baseNote = isFullHouse ? 'Complete home construction package requested' : 'Added from Contractor Categories'
        const dealNote = selectedMember
          ? `${baseNote} — Requested: ${selectedMember.name} (${selectedMember.role})`
          : baseNote
        const data = await apiFetch('/api/messages/contacts', {
          method: 'POST',
          body: JSON.stringify({ name: category.name, role: 'contractor', dealNote }),
        })
        setCartId(data.contact.id)
        setCartDealNote(dealNote)
        setToast(
          selectedMember
            ? `Request sent to ${selectedMember.name} — check Messages`
            : 'Request sent — check Messages for updates'
        )
      }
      setTimeout(() => setToast(null), 3200)
    } finally {
      setBusy(false)
    }
  }

  const showPicker = view === 'list' || !company
  const headerTitle = view === 'profile' && selectedMember ? selectedMember.name : category.name
  const headerSubtitle = view === 'profile' && selectedMember ? `${selectedMember.role} · ${category.name}` : category.description

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title={headerTitle} subtitle={headerSubtitle} />

          {view === 'profile' && company ? (
            <button
              onClick={() => setView('list')}
              className="mt-5 flex items-center gap-2 text-sm text-ink/50 transition-colors hover:text-ink"
            >
              <BackArrowIcon className="h-4 w-4" /> Back to Team List
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard/contractors')}
              className="mt-5 flex items-center gap-2 text-sm text-ink/50 transition-colors hover:text-ink"
            >
              <BackArrowIcon className="h-4 w-4" /> Back to Contractors
            </button>
          )}

          <AnimatePresence mode="wait">
            {showPicker ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-navy-900/60 to-navy-900/60 p-6 sm:flex-row sm:items-center">
                  <img src={iconSrc} alt="" draggable={false} className="h-20 w-20 shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-ink">{category.name}</h2>
                      <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gold-300">
                        {isFullHouse ? 'Full House Construction' : category.groupLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">{category.description}</p>
                  </div>
                </div>

                {isFullHouse ? (
                  <div className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/50 p-6">
                    <h3 className="font-display text-lg font-semibold text-gold-400">{FULL_HOUSE.packageTitle}</h3>
                    <p className="mt-1 text-sm text-ink/50">Everything your build needs, coordinated end to end.</p>
                    <div className="mt-5 space-y-1">
                      {FULL_HOUSE.checklist.map((step, i) => (
                        <div key={step} className="flex items-center gap-3 border-b border-ink/5 py-2.5 last:border-b-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                            <CheckCircleIcon className="h-4 w-4" />
                          </span>
                          <span className="text-sm text-ink/80">{step}</span>
                          <span className="ml-auto text-xs text-ink/25">Step {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/50 p-6">
                    <h3 className="font-display text-lg font-semibold text-gold-400">Services Offered</h3>
                    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {services?.map((service) => (
                        <div key={service} className="flex items-center gap-2.5 rounded-lg border border-ink/10 bg-navy-950/40 px-3 py-2">
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-gold-400" />
                          <span className="text-sm text-ink/80">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {category.bestFor && (
                  <div className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Best For</p>
                    <p className="mt-1.5 text-sm text-ink/75">{category.bestFor}</p>
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/40 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-ink">Contractor Profile</h3>
                    {!loadingCompany && (
                      <span className={`text-xs ${company ? 'text-emerald-400' : 'text-ink/35'}`}>
                        {company ? 'Verified team on file' : 'Not yet available'}
                      </span>
                    )}
                  </div>

                  {loadingCompany ? (
                    <div className="mt-6 flex justify-center">
                      <Spinner className="h-5 w-5 text-ink/40" />
                    </div>
                  ) : company ? (
                    <>
                      <p className="mt-1 text-sm text-ink/50">
                        {company.teamSize} verified professionals on this team, ready to take on your project.
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-ink/10 bg-navy-950/40 px-3 py-2.5 text-center">
                          <p className="text-xs text-ink/40">Experience</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{company.minExperience}–{company.maxExperience} yrs</p>
                        </div>
                        <div className="rounded-lg border border-ink/10 bg-navy-950/40 px-3 py-2.5 text-center">
                          <p className="text-xs text-ink/40">Rating</p>
                          <p className="mt-1 text-sm font-semibold text-gold-300">★ {company.avgRating}/5</p>
                        </div>
                        <div className="rounded-lg border border-ink/10 bg-navy-950/40 px-3 py-2.5 text-center">
                          <p className="text-xs text-ink/40">Availability</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{company.availableCount}/{company.teamSize} available</p>
                        </div>
                        <div className="rounded-lg border border-ink/10 bg-navy-950/40 px-3 py-2.5 text-center">
                          <p className="text-xs text-ink/40">Team Size</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{company.teamSize} people</p>
                        </div>
                        {UNAVAILABLE_STATS.map((label) => (
                          <div key={label} className="rounded-lg border border-dashed border-ink/10 px-3 py-2.5 text-center">
                            <p className="text-xs text-ink/35">{label}</p>
                            <p className="mt-1 text-sm font-medium text-ink/30">—</p>
                          </div>
                        ))}
                      </div>

                      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink/40">
                        Choose a Professional
                      </p>
                      <div className="space-y-1.5">
                        {company.team.map((member, i) => (
                          <motion.button
                            type="button"
                            key={member.id}
                            onClick={() => handleSelectMember(member.id)}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                            whileHover={{ x: 2 }}
                            className="flex w-full items-center gap-3 rounded-lg border border-ink/10 bg-navy-950/30 px-3 py-2.5 text-left transition-colors duration-150 hover:border-gold-500/40 hover:bg-gold-500/5"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-300">
                              {initials(member.name)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                              <p className="text-xs text-ink/45">{member.role} · {member.experienceYears} yrs exp</p>
                            </div>
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                member.availability === 'Available' ? 'bg-emerald-400' : 'bg-ink/25'
                              }`}
                            />
                            <span className="shrink-0 text-xs font-medium text-gold-300">★ {member.rating}</span>
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink/30" />
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-ink/50">
                      We haven't onboarded verified contractor businesses for this category yet, so we can't show
                      real experience, ratings or pricing here. Send a request below and our team will follow up
                      once a match is ready.
                    </p>
                  )}
                </div>

                {!company && !loadingCompany && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleRequest}
                    disabled={busy || checkingCart}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors duration-200 sm:w-auto sm:px-8 ${
                      cartId
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-400/15 hover:text-red-400'
                        : 'bg-gold-500 text-charcoal hover:bg-gold-400'
                    } disabled:cursor-wait disabled:opacity-80`}
                  >
                    {busy || checkingCart ? (
                      <Spinner className="h-4 w-4" />
                    ) : cartId ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4" /> Request Sent
                      </>
                    ) : (
                      <>
                        <CartIcon className="h-4 w-4" /> {isFullHouse ? 'Request This Package' : 'Request Quote'}
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {selectedMember && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-navy-900/60 to-navy-900/60 p-6 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold-500/15 font-display text-2xl font-bold text-gold-300">
                      {initials(selectedMember.name)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold text-ink">{selectedMember.name}</h2>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                            selectedMember.availability === 'Available'
                              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                              : 'border-ink/15 bg-ink/5 text-ink/50'
                          }`}
                        >
                          {selectedMember.availability}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink/60">
                        {selectedMember.role} · {category.name}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-ink/70">{selectedMember.experienceYears} yrs experience</span>
                        <span className="font-medium text-gold-300">★ {selectedMember.rating}/5</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {category.bestFor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 rounded-2xl border border-ink/10 bg-navy-900/40 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Best For</p>
                    <p className="mt-1.5 text-sm text-ink/75">{category.bestFor}</p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleRequest}
                    disabled={busy || checkingCart}
                    className={`group/req flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors duration-200 sm:flex-none sm:px-8 ${
                      cartId
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-400/15 hover:text-red-400'
                        : 'bg-gold-500 text-charcoal hover:bg-gold-400'
                    } disabled:cursor-wait disabled:opacity-80`}
                  >
                    {busy || checkingCart ? (
                      <Spinner className="h-4 w-4" />
                    ) : cartId ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 group-hover/req:hidden" />
                        <span className="group-hover/req:hidden">Request Sent</span>
                        <span className="hidden group-hover/req:inline">Cancel Request</span>
                      </>
                    ) : (
                      <>
                        <CartIcon className="h-4 w-4" />
                        {selectedMember ? `Request ${selectedMember.name.split(' ')[0]}` : 'Request Quote'}
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => navigate('/dashboard/messages')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 py-3.5 text-sm font-semibold text-ink/70 transition-colors duration-200 hover:border-gold-500/30 hover:text-ink sm:flex-none sm:px-8"
                  >
                    <MessagesIcon className="h-4 w-4" /> Contact via Messages
                  </button>
                </motion.div>
                <p className="mt-3 text-xs text-ink/35">Reviews will appear here once contractor profiles are live.</p>
              </motion.div>
            )}
          </AnimatePresence>

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

export default ContractorDetailPage

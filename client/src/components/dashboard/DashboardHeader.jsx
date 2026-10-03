import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import ThemeToggle from '../ThemeToggle.jsx'
import { BellIcon, ChevronDownIcon, LogoutIcon, MenuIcon } from './icons.jsx'

// Closes a popover on outside click or Escape.
function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}

const popover = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.16 },
}

function DashboardHeader({ onMenuClick, title, subtitle }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null) // null | 'notifications' | 'profile'
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)
  const close = useCallback(() => setOpen(null), [])
  useDismiss(notificationsRef, open === 'notifications', close)
  useDismiss(profileRef, open === 'profile', close)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials =
    user?.fullName
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-fg-muted hover:bg-ink/5 hover:text-fg lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title ?? t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {subtitle ??
              (user?.fullName
                ? t('dashboard.subtitleWithName', { name: user.fullName.split(' ')[0] })
                : t('dashboard.subtitle'))}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setOpen((v) => (v === 'notifications' ? null : 'notifications'))}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={open === 'notifications'}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/60 text-fg-muted transition-colors duration-200 hover:text-accent"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {open === 'notifications' && (
              <motion.div
                {...popover}
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
              >
                <p className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">Notifications</p>
                <div className="flex flex-col items-center px-6 py-8 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg-subtle">
                    <BellIcon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-fg">You’re all caught up</p>
                  <p className="mt-1 text-xs text-fg-subtle">No notifications yet.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setOpen((v) => (v === 'profile' ? null : 'profile'))}
            aria-haspopup="menu"
            aria-expanded={open === 'profile'}
            className="flex items-center gap-2 rounded-full border border-line bg-surface/60 py-1 pl-1 pr-2.5 transition-colors duration-200 hover:border-gold-500/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-accent">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight text-fg">{user?.fullName || t('common.loading')}</span>
              <span className="block text-xs capitalize leading-tight text-fg-subtle">
                {user?.role === 'customer' ? t('common.customer') : user?.role || t('common.customer')}
              </span>
            </span>
            <ChevronDownIcon className={`h-3.5 w-3.5 text-fg-subtle transition-transform ${open === 'profile' ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {open === 'profile' && (
              <motion.div
                {...popover}
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-pop"
              >
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/10"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader

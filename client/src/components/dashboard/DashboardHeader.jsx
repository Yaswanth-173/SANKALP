import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import ThemeToggle from '../ThemeToggle.jsx'
import { BellIcon, ChevronDownIcon, LogoutIcon, MenuIcon } from './icons.jsx'

function DashboardHeader({ onMenuClick, title, subtitle }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 text-ink/70 hover:bg-ink/5 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title ?? t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {subtitle ??
              (user?.fullName
                ? t('dashboard.subtitleWithName', { name: user.fullName.split(' ')[0] })
                : t('dashboard.subtitle'))}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-navy-900/60 text-ink/70 transition-colors duration-200 hover:text-gold-300"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-400" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-navy-900/60 py-1 pl-1 pr-2.5 transition-colors duration-200 hover:border-gold-500/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-300">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight text-ink">
                {user?.fullName || t('common.loading')}
              </span>
              <span className="block text-[10px] capitalize leading-tight text-ink/45">
                {user?.role === 'customer' ? t('common.customer') : user?.role || t('common.customer')}
              </span>
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-ink/40" />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-ink/10 bg-navy-900 shadow-xl"
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/10"
              >
                <LogoutIcon className="h-4 w-4" />
                Log out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}

export default DashboardHeader

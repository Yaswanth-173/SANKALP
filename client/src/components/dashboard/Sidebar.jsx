import { motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import LogoTilt from '../LogoTilt.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTranslation } from '../../i18n/index.js'
import { CartIcon } from '../contractors/contractorIcons.jsx'
import {
  BackArrowIcon,
  CalendarIcon,
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MessagesIcon,
  NotesIcon,
  SettingsIcon,
} from './icons.jsx'

// Reused by every role's portal — pass `navItems` to show a different menu
// (see SupervisorLayout) instead of the customer's.
function Sidebar({ onClose, navItems: navItemsProp }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems = navItemsProp || [
    { to: '/dashboard', label: t('nav.dashboard'), icon: DashboardIcon, end: true },
    { to: '/dashboard/calendar', label: t('nav.calendar'), icon: CalendarIcon },
    { to: '/dashboard/notes', label: t('nav.notes'), icon: NotesIcon },
    { to: '/dashboard/messages', label: t('nav.messages'), icon: MessagesIcon },
    { to: '/dashboard/cart', label: 'Cart', icon: CartIcon },
    { to: '/dashboard/settings', label: t('nav.settings'), icon: SettingsIcon },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full w-64 shrink-0 flex-col border-r border-ink/10 bg-navy-900/80 px-4 py-5"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
        >
          <BackArrowIcon className="h-4.5 w-4.5" />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink lg:hidden"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center py-2">
        <LogoTilt className="h-20 w-auto" entrance={false} />
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'border-gold-500/40 bg-gold-500/10 text-gold-300'
                  : 'border-transparent text-ink/60 hover:border-ink/10 hover:bg-ink/5 hover:text-ink'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl border border-red-400/20 px-3.5 py-2.5 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-400/10"
      >
        <LogoutIcon className="h-5 w-5" />
        {t('nav.logout')}
      </button>
    </motion.aside>
  )
}

export default Sidebar

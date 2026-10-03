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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface/90 px-3 py-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-svh">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-subtle transition-colors duration-200 hover:bg-ink/5 hover:text-fg"
        >
          <BackArrowIcon className="h-4.5 w-4.5" />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-subtle hover:bg-ink/5 hover:text-fg lg:hidden"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex justify-center pb-4">
        <LogoTilt className="h-14 w-auto" entrance={false} />
      </div>

      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">Menu</p>
      <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive ? 'bg-gold-500/10 text-accent' : 'text-fg-muted hover:bg-ink/5 hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-500 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                />
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout} className="btn btn-danger mt-3 justify-start">
        <LogoutIcon className="h-5 w-5" />
        {t('nav.logout')}
      </button>
    </aside>
  )
}

export default Sidebar

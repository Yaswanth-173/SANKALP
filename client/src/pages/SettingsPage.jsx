import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import SettingsMenuRow from '../components/settings/SettingsMenuRow.jsx'
import ProfilePanel from '../components/settings/ProfilePanel.jsx'
import NotificationsPanel from '../components/settings/NotificationsPanel.jsx'
import PasswordPanel from '../components/settings/PasswordPanel.jsx'
import AppearancePanel from '../components/settings/AppearancePanel.jsx'
import LanguagePanel from '../components/settings/LanguagePanel.jsx'
import HelpPanel from '../components/settings/HelpPanel.jsx'
import { UserIcon, BellIcon, LockIcon, MoonIcon, GlobeIcon, HelpIcon, LogoutIcon } from '../components/dashboard/icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTranslation } from '../i18n/index.js'

function SettingsPage() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState('menu')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const rows = [
    { key: 'profile', icon: UserIcon, title: t('settings.profile.title'), description: t('settings.profile.description') },
    { key: 'notifications', icon: BellIcon, title: t('settings.notifications.title'), description: t('settings.notifications.description') },
    { key: 'password', icon: LockIcon, title: t('settings.password.title'), description: t('settings.password.description') },
    { key: 'appearance', icon: MoonIcon, title: t('settings.appearance.title'), description: t('settings.appearance.description') },
    { key: 'language', icon: GlobeIcon, title: t('settings.language.title'), description: t('settings.language.description') },
    { key: 'help', icon: HelpIcon, title: t('settings.help.title'), description: t('settings.help.description') },
  ]

  const panels = {
    profile: ProfilePanel,
    notifications: NotificationsPanel,
    password: PasswordPanel,
    appearance: AppearancePanel,
    language: LanguagePanel,
    help: HelpPanel,
  }

  const ActivePanel = panels[view]

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title={t('settings.title')} subtitle={t('settings.subtitle')} />
          <div className="mt-7 max-w-xl">
            <AnimatePresence mode="wait">
              {view === 'menu' ? (
                <div key="menu" className="flex flex-col gap-2.5">
                  {rows.map((row, i) => (
                    <SettingsMenuRow
                      key={row.key}
                      icon={row.icon}
                      title={row.title}
                      description={row.description}
                      index={i}
                      onClick={() => setView(row.key)}
                    />
                  ))}
                  <SettingsMenuRow
                    icon={LogoutIcon}
                    title={t('settings.logout')}
                    onClick={handleLogout}
                    danger
                    index={rows.length}
                  />
                </div>
              ) : (
                ActivePanel && <ActivePanel key={view} onBack={() => setView('menu')} />
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </DashboardShell>
  )
}

export default SettingsPage

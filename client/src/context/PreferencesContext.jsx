import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { apiFetch } from '../utils/api.js'

const PreferencesContext = createContext(null)

const STORAGE_KEY = 'sankalp_preferences'
const DEFAULTS = { theme: 'dark', language: 'en', emailNotifications: true }

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function writeLocal(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
}

// Gold shockwave ring + flash spawned at the click origin on a theme
// switch. A plain DOM node (not React state) since it's a fire-and-forget
// visual effect with no bearing on app state; self-removes after playing.
function spawnThemeRipple(x, y, radius) {
  const ripple = document.createElement('div')
  ripple.className = 'theme-ripple'
  ripple.style.setProperty('--rx', `${x}px`)
  ripple.style.setProperty('--ry', `${y}px`)
  ripple.style.setProperty('--rr', `${radius}px`)
  ripple.style.setProperty('--ripple-color', 'rgba(234, 180, 36, 0.85)')
  document.body.appendChild(ripple)
  requestAnimationFrame(() => ripple.classList.add('is-active'))
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
  setTimeout(() => ripple.remove(), 1500)
}

export function PreferencesProvider({ children }) {
  const { user, status } = useAuth()
  const [preferences, setPreferences] = useState(readLocal)

  // Apply the theme to the document root immediately, and on every change.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme)
  }, [preferences.theme])

  // Once the account loads, its saved preferences take over from localStorage.
  useEffect(() => {
    if (status === 'authenticated' && user?.preferences) {
      setPreferences({ ...DEFAULTS, ...user.preferences })
      writeLocal({ ...DEFAULTS, ...user.preferences })
    }
  }, [status, user])

  // Animates a theme change as a circle expanding from the click origin,
  // using the View Transitions API. Falls back to a plain instant swap
  // (which the existing CSS color-transition on <body> then softens) in
  // browsers without support, or when the user prefers reduced motion.
  const setTheme = (theme, origin) => {
    if (theme === preferences.theme) return

    const root = document.documentElement
    const x = origin?.x ?? window.innerWidth - 48
    const y = origin?.y ?? 48
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
    root.style.setProperty('--theme-x', `${x}px`)
    root.style.setProperty('--theme-y', `${y}px`)
    root.style.setProperty('--theme-r', `${maxRadius}px`)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canAnimate = typeof document.startViewTransition === 'function' && !prefersReducedMotion

    if (canAnimate) {
      document.startViewTransition(() => {
        root.setAttribute('data-theme', theme)
      })
    } else {
      root.setAttribute('data-theme', theme)
    }

    if (!prefersReducedMotion) {
      spawnThemeRipple(x, y, maxRadius)
    }

    update({ theme })
  }

  const update = async (patch) => {
    const next = { ...preferences, ...patch }
    setPreferences(next)
    writeLocal(next)

    if (status === 'authenticated') {
      try {
        await apiFetch('/api/auth/preferences', {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      } catch {
        // The UI already reflects the change; a failed sync isn't worth
        // reverting the toggle over — it'll resync on next successful save.
      }
    }
  }

  return (
    <PreferencesContext.Provider value={{ ...preferences, update, setTheme }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider')
  return ctx
}

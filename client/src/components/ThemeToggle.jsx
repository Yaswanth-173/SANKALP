import { AnimatePresence, motion } from 'framer-motion'
import { MoonIcon, SunIcon } from './dashboard/icons.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'

/**
 * One-click sun/moon theme switch. Triggers the same gold shockwave-ring
 * reveal as the Settings > Appearance panel (via setTheme), so switching
 * from anywhere in the app feels consistent.
 */
function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = usePreferences()
  const isDark = theme === 'dark'

  const handleClick = (e) => {
    setTheme(isDark ? 'light' : 'dark', { x: e.clientX, y: e.clientY })
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88, rotate: isDark ? -25 : 25 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-navy-900/60 text-ink/70 transition-colors duration-200 hover:text-gold-300 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.4 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <MoonIcon className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.4 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <SunIcon className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default ThemeToggle

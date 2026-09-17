import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import LogoTilt from './LogoTilt.jsx'
import ThemeToggle from './ThemeToggle.jsx'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? 'bg-navy-950/85 backdrop-blur-md border-b border-ink/5'
          : 'bg-gradient-to-b from-navy-950/70 to-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <LogoTilt className="h-16 w-auto sm:h-20" />

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={() => navigate('/login')}
            className="group relative overflow-hidden rounded-full border border-gold-500/60 px-5 py-2 text-sm font-medium tracking-wide text-gold-400 transition-colors duration-300 hover:text-charcoal sm:px-6 sm:text-base"
          >
            <span className="absolute inset-0 -translate-x-full bg-gold-500 transition-transform duration-300 ease-out group-hover:translate-x-0" />
            <span className="relative">Login / Sign In</span>
          </button>
        </div>
      </nav>
    </motion.header>
  )
}

export default Navbar

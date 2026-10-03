import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LogoTilt from '../LogoTilt.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { CloseIcon, MenuIcon } from '../dashboard/icons.jsx'
import { NAV_LINKS } from './content.js'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled ? 'border-b border-line/70 bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link to="/" aria-label="Sankalp home" className="shrink-0">
          <LogoTilt className="h-10 w-auto sm:h-12" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="group flex items-baseline gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
              >
                <span className="tabular text-xs text-fg-subtle transition-colors group-hover:text-accent">0{i + 1}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button to="/login" variant="ghost" className="hidden sm:inline-flex">
            Log in
          </Button>
          <Button to="/signup" className="hidden sm:inline-flex">
            Get started
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-gold-500/60 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} placement="right" label="Menu" className="flex h-full w-full flex-col bg-canvas sm:max-w-md sm:border-l sm:border-line">
        <div aria-hidden="true" className="bg-blueprint-grid pointer-events-none absolute inset-0" />
        <div className="relative flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6">
          <span className="eyebrow">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg hover:border-gold-500/60"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <ul className="relative flex flex-1 flex-col justify-center gap-1 px-4 sm:px-6">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="group flex items-baseline gap-4 border-b border-line/60 py-4 font-display text-4xl font-semibold text-fg transition-colors hover:text-accent"
              >
                <span className="tabular text-sm font-medium text-fg-subtle">0{i + 1}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="relative grid grid-cols-2 gap-3 p-4 sm:p-6">
          <Button to="/login" variant="secondary" size="lg">
            Log in
          </Button>
          <Button to="/signup" size="lg">
            Get started
          </Button>
        </div>
      </Modal>
    </header>
  )
}

export default Navbar

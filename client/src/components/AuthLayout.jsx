import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import BuildingIllustration from './landing/BuildingIllustration.jsx'
import { HERO } from './landing/content.js'

/**
 * Split auth screen: a blueprint brand panel on large screens, the form on
 * the right. Below `lg` only the form column shows.
 */
function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-svh w-full bg-canvas lg:grid-cols-2">
      {/* Brand panel — blueprint paper in both themes. */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-[#0c1b36] lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{
          '--color-blueprint': '#8db8ff',
          backgroundImage:
            'linear-gradient(rgb(141 184 255 / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(141 184 255 / 0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      >
        <Link to="/" tabIndex={-1} className="relative z-10 inline-block self-start">
          <Logo className="h-12 w-auto" />
        </Link>
        <BuildingIllustration variant="blueprint" className="absolute inset-x-[10%] top-[16%] h-[62%] w-[80%]" />
        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcb66]">{HERO.eyebrow}</span>
          <p className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight text-white">{HERO.subtitle}</p>
        </div>
      </aside>

      {/* Form column */}
      <div className="relative flex flex-col">
        <div aria-hidden="true" className="bg-blueprint-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] lg:hidden" />
        <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" aria-label="Sankalp home" className="lg:invisible">
            <Logo className="h-10 w-auto" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="relative flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-fg-muted sm:text-base">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 border-t border-line/70 pt-6 text-sm text-fg-muted">{footer}</div>}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default AuthLayout

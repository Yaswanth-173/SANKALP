import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-navy-950 px-5 py-16">
      {/* Cinematic atmosphere, matching the landing page hero */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(234,180,36,0.10),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(234,180,36,0.06),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(32,42,74,0.9),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(234,180,36,0.08),_transparent_55%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.06]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(246,196,83,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(246,196,83,0.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-ink/10 bg-ink/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <Link to="/" aria-label="Sankalp home">
            <Logo className="h-14 w-auto" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-7 text-center"
        >
          {eyebrow && (
            <span className="text-xs font-medium uppercase tracking-[0.35em] text-gold-400/90">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-ink/60">{subtitle}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          {children}
        </motion.div>

        {footer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-7 text-center text-sm text-ink/50"
          >
            {footer}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default AuthLayout

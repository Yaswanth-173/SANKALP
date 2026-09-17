import { motion } from 'framer-motion'
import LogoTilt from './LogoTilt.jsx'

function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-navy-950 px-5 py-12 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center"
      >
        <LogoTilt className="h-14 w-auto" entrance={false} />
        <p className="max-w-md text-sm text-ink/60">
          Sankalp is a digital construction ecosystem bringing planning,
          design, materials, professionals and construction management
          together in one connected platform.
        </p>
        <motion.div
          whileHover={{ y: -2, color: 'rgb(246 196 83)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center gap-2 text-sm text-ink/70"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4 text-gold-400"
          >
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <span>Andhra Pradesh, India</span>
        </motion.div>
        <p className="text-xs text-ink/30">
          © {new Date().getFullYear()} Sankalp. All rights reserved.
        </p>
      </motion.div>
    </footer>
  )
}

export default Footer

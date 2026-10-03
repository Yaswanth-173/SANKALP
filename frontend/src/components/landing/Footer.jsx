import { Link } from 'react-router-dom'
import Logo from '../Logo.jsx'
import { FOOTER, NAV_LINKS } from './content.js'

const ACCOUNT_LINKS = [
  { to: '/login', label: 'Log in' },
  { to: '/signup', label: 'Create account' },
  { to: '/forgot-password', label: 'Forgot password' },
]

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line/60 bg-canvas">
      <div className="container-page grid gap-12 py-16 sm:py-20 md:grid-cols-12">
        <div className="md:col-span-6">
          <Link to="/" aria-label="Sankalp home" className="inline-block">
            <Logo className="h-12 w-auto" />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-fg-muted">{FOOTER.blurb}</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-fg-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 text-accent" aria-hidden="true">
              <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {FOOTER.location}
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-6 md:justify-items-end">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">Explore</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-fg-muted transition-colors hover:text-accent">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">Account</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-fg-muted transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Oversized brand wordmark (decorative; the logo above is the accessible brand). */}
      <div aria-hidden="true" className="container-page select-none">
        <p data-footer-brand className="-mb-[0.12em] text-center font-display text-display-2xl font-bold text-ink/[0.06]">
          SANKALP
        </p>
      </div>

      <div className="border-t border-line/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Sankalp. All rights reserved.</p>
          <a href="#top" className="transition-colors hover:text-accent">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

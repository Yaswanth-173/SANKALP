import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { roleHome } from '../utils/roleHome.js'

function NotFoundPage() {
  const { status, user } = useAuth()
  const signedIn = status === 'authenticated'

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-canvas">
      <div aria-hidden="true" className="bg-blueprint-grid absolute inset-0" />
      <header className="container-page relative py-5">
        <Link to="/" aria-label="Sankalp home" className="inline-block">
          <Logo className="h-10 w-auto sm:h-12" />
        </Link>
      </header>

      <section className="container-page relative flex flex-1 flex-col items-start justify-center pb-24">
        <span className="eyebrow">Error 404</span>
        <p aria-hidden="true" className="mt-4 font-display text-display-2xl font-bold text-ink/10">
          404
        </p>
        <h1 className="-mt-4 max-w-2xl font-display text-display font-semibold text-fg sm:-mt-10">
          This page isn’t on the blueprint.
        </h1>
        <p className="mt-4 max-w-md text-fg-muted">
          The link may be broken or the page may have moved. Let’s get you back on site.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/" size="lg">
            Back to home
          </Button>
          {signedIn && (
            <Button to={roleHome(user?.role)} variant="secondary" size="lg">
              Go to dashboard
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}

export default NotFoundPage

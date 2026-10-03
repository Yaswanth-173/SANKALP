import { Component } from 'react'

/**
 * Catches render errors anywhere below it so a crash shows a recoverable
 * screen instead of a blank page. Also catches failed lazy-route chunk
 * loads (e.g. after a deploy), where a reload is the fix.
 */
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas px-5">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="eyebrow">Something went wrong</span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-fg">This page hit a snag</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Try reloading. If it keeps happening, head back to the home page.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a href="/" className="btn btn-secondary">
              Go home
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

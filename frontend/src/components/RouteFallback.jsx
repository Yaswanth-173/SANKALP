/**
 * Shown while a lazy route's chunk downloads. Renders nothing visible for
 * the first ~250ms (most chunk loads finish sooner), then a thin amber
 * progress bar, so fast navigations never flash a loader.
 */
function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-40 bg-canvas">
      <span className="sr-only">Loading page…</span>
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden opacity-0 [animation:fade-in_0.3s_ease_0.25s_forwards]">
        <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      </div>
    </div>
  )
}

export default RouteFallback

/** A shimmering placeholder block. Size it with className (h-*, w-*, rounded-*). */
export function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-lg bg-ink/[0.06] after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-ink/[0.06] after:to-transparent ${className}`}
    />
  )
}

/** A grid of card-shaped skeletons, for list/grid pages while data loads. */
export function SkeletonCards({ count = 6, className = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3', label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" className={`grid gap-4 ${className}`}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}

/** Stacked row skeletons, for tables and lists. */
export function SkeletonRows({ count = 5, label = 'Loading', className = '' }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col gap-2.5 ${className}`}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

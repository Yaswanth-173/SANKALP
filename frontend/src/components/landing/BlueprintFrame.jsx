/**
 * Drafting-sheet frame: corner crop marks and a scale bar around a visual,
 * so illustrations read as technical drawings rather than floating art.
 */
function BlueprintFrame({ children, className = '', label = 'Scale 1 : 200' }) {
  const corner = 'pointer-events-none absolute h-5 w-5 border-gold-500/70'
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden="true" className={`${corner} left-0 top-0 border-l border-t`} />
      <span aria-hidden="true" className={`${corner} right-0 top-0 border-r border-t`} />
      <span aria-hidden="true" className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden="true" className={`${corner} bottom-0 right-0 border-b border-r`} />
      <div className="absolute inset-4 sm:inset-6">{children}</div>
      <div aria-hidden="true" className="absolute bottom-2 right-8 flex items-center gap-2 text-xs text-fg-subtle">
        <span className="flex h-1.5 w-14 border border-fg-subtle/60">
          <span className="w-1/2 bg-fg-subtle/60" />
        </span>
        {label}
      </div>
    </div>
  )
}

export default BlueprintFrame

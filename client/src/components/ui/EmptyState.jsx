/**
 * Friendly placeholder for "nothing here yet" and error states. Pass an
 * `action` node (usually a <Button>) to give the user an obvious next step.
 */
function EmptyState({ icon, title, description, action, tone = 'neutral', className = '' }) {
  const toneRing = tone === 'error' ? 'border-danger/30 text-danger' : 'border-line text-accent'
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink/[0.02] px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-surface ${toneRing}`}>
          {icon}
        </span>
      )}
      <h3 className="mt-4 font-display text-lg font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export default EmptyState

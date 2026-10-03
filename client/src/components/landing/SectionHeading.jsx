/**
 * Numbered section header used across the landing page:
 * "01 ── EYEBROW" over a display heading, optional lead paragraph.
 */
function SectionHeading({ index, eyebrow, title, lead, align = 'left', className = '', titleClassName = '' }) {
  const centered = align === 'center'
  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      <span className={`eyebrow ${centered ? 'justify-center' : ''}`}>
        {index && <span className="tabular text-fg-subtle">{index}</span>}
        <span aria-hidden="true" className="h-px w-8 bg-gold-500/60" />
        {eyebrow}
      </span>
      <h2 className={`mt-5 font-display text-display font-semibold text-fg ${titleClassName}`}>{title}</h2>
      {lead && <p className={`mt-5 text-base leading-relaxed text-fg-muted sm:text-lg ${centered ? 'mx-auto' : ''} max-w-2xl`}>{lead}</p>}
    </div>
  )
}

export default SectionHeading

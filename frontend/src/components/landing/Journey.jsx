import SectionHeading from './SectionHeading.jsx'
import { JOURNEY } from './content.js'

/**
 * The seven build stages. Laid out as a responsive grid (the fallback for
 * mobile, low-end devices and reduced motion); the desktop pinned
 * horizontal timeline is layered on top of this same markup later.
 */
function Journey() {
  return (
    <section id="journey" className="section-pad relative border-t border-line/60 bg-surface/40">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading index="03" eyebrow={JOURNEY.eyebrow} title={JOURNEY.title} />
          <p className="tabular text-sm text-fg-subtle">
            {String(JOURNEY.stages.length).padStart(2, '0')} stages · Plan → Completion
          </p>
        </div>

        <ol data-journey-track className="relative mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.stages.map((stage, i) => (
            <li key={stage.label} data-journey-stage={i} className={`group relative flex flex-col bg-canvas p-6 sm:p-7 ${i === JOURNEY.stages.length - 1 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-500/40 bg-gold-500/10 text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d={stage.icon} />
                  </svg>
                </span>
                <span className="tabular font-display text-4xl font-bold text-ink/10 transition-colors group-hover:text-gold-500/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-semibold text-fg">{stage.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{stage.copy}</p>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold-500 transition-transform duration-500 group-hover:scale-x-100" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default Journey

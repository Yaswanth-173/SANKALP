import SectionHeading from './SectionHeading.jsx'
import { ABOUT } from './content.js'

// Fragment positions on a circle, as percentages of the square diagram.
const RADIUS = 38
const nodes = ABOUT.fragments.map((label, i) => {
  const angle = ((360 / ABOUT.fragments.length) * i - 90) * (Math.PI / 180)
  return { label, x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) }
})

function About() {
  return (
    <section id="about" className="section-pad relative border-t border-line/60 bg-surface/40">
      <div className="container-page grid items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading
            index="01"
            eyebrow={ABOUT.eyebrow}
            title={
              <>
                {ABOUT.titleA} <span className="text-accent">{ABOUT.titleB}</span>
              </>
            }
          />
          <div className="mt-6 flex max-w-xl flex-col gap-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            {ABOUT.paragraphs.map((p) => (
              <p key={p.slice(0, 16)}>{p}</p>
            ))}
          </div>
        </div>

        {/* Hub diagram: six disciplines wired into one centre. */}
        <div className="relative mx-auto aspect-square w-full max-w-[28rem]">
          <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="0.3" strokeDasharray="1 1.5" />
            <circle cx="50" cy="50" r={RADIUS - 14} fill="none" stroke="var(--color-line)" strokeWidth="0.3" />
            {nodes.map((n) => (
              <line key={n.label} data-spoke x1="50" y1="50" x2={n.x} y2={n.y} stroke="var(--color-gold-500)" strokeOpacity="0.55" strokeWidth="0.35" />
            ))}
          </svg>

          {nodes.map((n) => (
            <span
              key={n.label}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-fg-muted shadow-card transition-colors hover:border-gold-500/60 hover:text-accent sm:text-sm"
            >
              {n.label}
            </span>
          ))}

          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/60 bg-charcoal font-display text-sm font-bold text-gold-400 shadow-glow sm:h-24 sm:w-24 sm:text-base">
            Sankalp
          </span>
        </div>
      </div>
    </section>
  )
}

export default About

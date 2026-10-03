import SectionHeading from './SectionHeading.jsx'
import BuildingIllustration from './BuildingIllustration.jsx'
import { STORY } from './content.js'

/**
 * Blueprint → reality comparison. The blueprint sheet sits underneath and
 * the finished building is revealed over it through a clip-path; the
 * divider position is a single CSS variable (--reveal) so the scroll
 * animation only has to tween one value.
 */
function BlueprintStory() {
  return (
    <section id="story" className="section-pad relative overflow-hidden">
      <div className="container-page grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading index="02" eyebrow={STORY.eyebrow} title={STORY.title} />
          <ol className="mt-10 flex flex-col">
            {STORY.frames.map((frame, i) => (
              <li key={frame.title} data-story-step={i} className="flex gap-5 border-t border-line/70 py-5 last:border-b">
                <span className="tabular pt-0.5 font-display text-sm font-semibold text-accent">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-fg">{frame.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted sm:text-base">{frame.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-7">
          <div
            data-story-visual
            style={{ '--reveal': '50%' }}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-line shadow-pop"
          >
            {/* Blueprint sheet (always dark blue paper, in both themes) */}
            <div
              className="absolute inset-0 bg-[#0c1b36]"
              style={{
                '--color-blueprint': '#8db8ff',
                backgroundImage:
                  'linear-gradient(rgb(141 184 255 / 0.12) 1px, transparent 1px), linear-gradient(90deg, rgb(141 184 255 / 0.12) 1px, transparent 1px), linear-gradient(rgb(141 184 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(141 184 255 / 0.05) 1px, transparent 1px)',
                backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
              }}
            >
              <BuildingIllustration variant="blueprint" className="absolute inset-[8%] h-[84%] w-[84%]" />
              <span className="absolute left-5 top-5 rounded-md border border-[#8db8ff]/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b9d3ff]">
                Blueprint
              </span>
            </div>

            {/* Finished building, revealed from the right */}
            <div
              data-story-reality
              className="absolute inset-0 bg-gradient-to-b from-surface-2 via-canvas to-surface"
              style={{ clipPath: 'inset(0 0 0 var(--reveal))' }}
            >
              <div aria-hidden="true" className="absolute left-1/2 top-[18%] h-48 w-48 -translate-x-1/2 rounded-full bg-gold-500/25 blur-3xl" />
              <BuildingIllustration className="absolute inset-[8%] h-[84%] w-[84%]" />
              <span className="absolute right-5 top-5 rounded-md border border-gold-500/50 bg-canvas/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent backdrop-blur">
                Reality
              </span>
            </div>

            {/* Divider */}
            <div aria-hidden="true" className="absolute inset-y-0 w-px bg-gold-500" style={{ left: 'var(--reveal)' }}>
              <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500 bg-charcoal text-gold-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BlueprintStory

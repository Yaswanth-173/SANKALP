import SectionHeading from './SectionHeading.jsx'
import { SUPPORT } from './content.js'

const ICONS = [
  'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  'M4 5h16v11H8l-4 4V5Zm4 5h8M8 13h5',
  'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 2a6 6 0 0 0-6 6v1h20v-1a6 6 0 0 0-6-6',
]

function Support() {
  return (
    <section id="support" className="section-pad relative border-t border-line/60 bg-surface/40">
      <div className="container-page">
        <SectionHeading index="05" eyebrow="Help" title={SUPPORT.title} />
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {SUPPORT.items.map((item, i) => (
            <li
              key={item.title}
              className="card group flex flex-col p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-glow sm:p-7"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent transition-colors group-hover:border-gold-500/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d={ICONS[i]} />
                </svg>
              </span>
              <h3 className="mt-6 font-display text-lg font-semibold text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Support

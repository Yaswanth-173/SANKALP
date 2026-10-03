import { CONTRACTOR_ICON_IMAGES } from '../contractors/contractorIconImages.js'
import { CONTRACTOR_CATEGORIES, MATERIALS } from './content.js'

/**
 * Two counter-scrolling rows: real catalog materials and every contractor
 * category. Pure CSS loop (content duplicated once, translated -50%), so it
 * runs without JS; it pauses on hover and stops for reduced motion.
 */
function Row({ items, renderItem, reverse = false, duration }) {
  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <ul
        data-marquee-row
        style={{ '--marquee-duration': duration, animationDirection: reverse ? 'reverse' : 'normal' }}
        className="flex w-max shrink-0 animate-marquee gap-3 pr-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
      >
        {[...items, ...items].map((item, i) => (
          <li key={i} aria-hidden={i >= items.length ? 'true' : undefined} className="shrink-0">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MaterialsMarquee() {
  return (
    <section aria-labelledby="marquee-heading" className="relative overflow-hidden py-16 sm:py-24">
      <div className="container-page mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <h2 id="marquee-heading" className="eyebrow">
          <span aria-hidden="true" className="h-px w-8 bg-gold-500/60" />
          Materials &amp; professionals on Sankalp
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <Row
          items={MATERIALS}
          duration="70s"
          renderItem={(m) => (
            <figure className="flex w-56 items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 pr-4">
              <img
                src={`/materials/${m.slug}.webp`}
                alt=""
                width="56"
                height="56"
                loading="lazy"
                decoding="async"
                className="h-14 w-14 shrink-0 rounded-xl bg-surface-2 object-cover"
              />
              <figcaption className="text-sm font-medium text-fg">{m.name}</figcaption>
            </figure>
          )}
        />
        <Row
          items={CONTRACTOR_CATEGORIES}
          reverse
          duration="120s"
          renderItem={(c) => (
            <span className="flex items-center gap-2.5 rounded-full border border-line bg-canvas py-1.5 pl-1.5 pr-4 text-sm font-medium text-fg-muted">
              <img src={CONTRACTOR_ICON_IMAGES[c.slug]} alt="" width="28" height="28" loading="lazy" decoding="async" className="h-7 w-7 rounded-full bg-surface-2 object-contain p-0.5" />
              {c.name.replace(/ Contractor$/, '')}
            </span>
          )}
        />
      </div>
    </section>
  )
}

export default MaterialsMarquee

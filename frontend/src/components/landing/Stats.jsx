import { STATS } from './content.js'

function Stats() {
  return (
    <section aria-label="Sankalp in numbers" className="relative border-y border-line/60 bg-surface/40">
      <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-2 py-10 sm:py-14 ${i % 2 === 1 ? 'border-l border-line/60 pl-5 sm:pl-8' : ''} ${
              i > 0 && i % 2 === 0 ? 'lg:border-l lg:border-line/60 lg:pl-8' : ''
            } ${i < 2 ? 'border-b border-line/60 lg:border-b-0' : ''}`}
          >
            <dt className="order-2 text-xs font-medium uppercase tracking-[0.18em] text-fg-subtle sm:text-sm sm:tracking-[0.14em]">{stat.label}</dt>
            <dd data-counter={stat.value} className="tabular order-1 font-display text-display-lg font-semibold text-fg">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default Stats

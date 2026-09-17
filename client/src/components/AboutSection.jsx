import { motion } from 'framer-motion'

const fragments = ['Plans', 'Architects', 'Materials', 'Contractors', 'Workers', 'Budgets']

function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-navy-900 px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs font-medium uppercase tracking-[0.4em] text-gold-400/90">
            What is Sankalp?
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Construction has always meant many moving parts.
            <br className="hidden sm:block" /> Sankalp brings them together.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ink/65 sm:text-lg">
            A single build touches architects, material suppliers,
            contractors, supervisors and workers — each working with their
            own tools, timelines and paperwork. Sankalp is a digital
            ecosystem that connects every one of these activities into a
            single, coherent platform, so the people building your home can
            plan, coordinate and track progress in one place.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/65 sm:text-lg">
            It is not a marketplace bolted onto a website — it is
            construction, made digital, from the first sketch to the final
            handover.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-80 items-center justify-center sm:h-96"
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute h-56 w-56 rounded-full bg-gold-500/10 blur-3xl sm:h-72 sm:w-72"
          />
          <div className="relative flex h-full w-full items-center justify-center rounded-3xl border border-ink/10 bg-navy-800/60">
            <div className="relative h-40 w-40 sm:h-48 sm:w-48">
              {fragments.map((label, i) => {
                const angle = (360 / fragments.length) * i
                return (
                  <motion.div
                    key={`line-${label}`}
                    initial={{ scaleY: 0, opacity: 0, rotate: angle + 180 }}
                    whileInView={{ scaleY: 1, opacity: 1, rotate: angle + 180 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      transformOrigin: 'top left',
                      background: 'linear-gradient(to bottom, rgba(234,180,36,0.65), transparent)',
                    }}
                    className="absolute left-1/2 top-1/2 h-[7.5rem] w-px"
                  />
                )
              })}

              {fragments.map((label, i) => {
                const angle = (360 / fragments.length) * i
                return (
                  <div
                    key={label}
                    style={{
                      transform: `rotate(${angle}deg) translate(0, -7.5rem) rotate(-${angle}deg)`,
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      whileHover={{
                        scale: 1.15,
                        borderColor: 'rgba(234,180,36,0.6)',
                        color: '#f6c453',
                      }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        opacity: { duration: 0.6, delay: 0.15 * i },
                        scale: { duration: 0.6, delay: 0.15 * i },
                        y: {
                          duration: 3 + i * 0.3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.25,
                        },
                      }}
                      className="block cursor-default whitespace-nowrap rounded-full border border-ink/15 bg-navy-900 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors sm:text-sm"
                    >
                      {label}
                    </motion.span>
                  </div>
                )
              })}

              <motion.span
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(234,180,36,0.2)',
                    '0 0 38px rgba(234,180,36,0.4)',
                    '0 0 20px rgba(234,180,36,0.2)',
                  ],
                  scale: [1, 1.04, 1],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/60 bg-charcoal font-display text-sm font-bold text-gold-400 sm:h-20 sm:w-20 sm:text-base"
              >
                Sankalp
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default AboutSection

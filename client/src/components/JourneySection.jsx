import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const stages = [
  {
    label: 'Plan',
    copy: 'Define the vision, scope and budget for the build.',
    icon: (
      <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z M14 4v6h6" />
    ),
  },
  {
    label: 'Design',
    copy: 'Turn the vision into detailed architectural drawings.',
    icon: <path d="M3 21 14 10m0 0 3.5-3.5a2.121 2.121 0 0 1 3 3L17 13m-3-3 3 3M4 21h4l10-10-4-4L4 17v4Z" />,
  },
  {
    label: 'Materials',
    copy: 'Source and track the right materials for every stage.',
    icon: (
      <path d="M3 7 12 3l9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" />
    ),
  },
  {
    label: 'Professionals',
    copy: 'Connect with verified contractors, supervisors and workers.',
    icon: (
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 2a6 6 0 0 0-6 6v1h20v-1a6 6 0 0 0-6-6" />
    ),
  },
  {
    label: 'Construction',
    copy: 'Execution on-site, coordinated and tracked in real time.',
    icon: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  },
  {
    label: 'Management',
    copy: 'Monitor progress, cost and quality from one place.',
    icon: <path d="M4 19V5m0 14h16M8 15v-4m4 4V9m4 6v-7" />,
  },
  {
    label: 'Completion',
    copy: 'Move into a home built with clarity and control.',
    icon: <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-8Zm7 5 2 2 4-4" />,
  },
]

function JourneySection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.75', 'end 0.4'],
  })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section
      id="journey"
      ref={ref}
      className="relative bg-navy-950 px-5 py-28 sm:px-8 sm:py-36"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="text-xs font-medium uppercase tracking-[0.4em] text-gold-400/90"
        >
          The Sankalp Journey
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl"
        >
          One connected path, from idea to home
        </motion.h2>
      </div>

      <div className="relative mx-auto mt-20 max-w-3xl">
        {/* Track */}
        <div className="absolute left-6 top-0 h-full w-px bg-ink/10 sm:left-1/2 sm:-translate-x-1/2" />
        {/* Progress fill */}
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-6 top-0 w-px bg-gradient-to-b from-gold-400 to-gold-600 shadow-[0_0_12px_rgba(234,180,36,0.6)] sm:left-1/2 sm:-translate-x-1/2"
        />

        <ol className="flex flex-col gap-14">
          {stages.map((stage, i) => {
            const alignRight = i % 2 === 1
            return (
              <motion.li
                key={stage.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex items-start gap-5 pl-16 sm:w-1/2 sm:pl-0 ${
                  alignRight
                    ? 'sm:ml-auto sm:flex-row sm:pl-10 sm:text-left'
                    : 'sm:mr-auto sm:flex-row-reverse sm:pr-10 sm:text-right'
                }`}
              >
                <span className="absolute left-0 top-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-navy-900 text-gold-400 sm:static">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    {stage.icon}
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink sm:text-xl">
                    {String(i + 1).padStart(2, '0')} — {stage.label}
                  </h3>
                  <p className="mt-1.5 max-w-xs text-sm text-ink/60 sm:text-base">
                    {stage.copy}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default JourneySection

import { motion } from 'framer-motion'

const frames = [
  {
    title: 'The Idea',
    copy: 'Every build starts as a plan and a budget.',
    from: 'from-navy-800',
    to: 'to-navy-600',
    icon: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7v.5h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z" />,
  },
  {
    title: 'Design & Materials',
    copy: 'Drawings take shape, materials are selected.',
    from: 'from-navy-700',
    to: 'to-gold-600/40',
    icon: <path d="M3 21 14 10m0 0 3.5-3.5a2.121 2.121 0 0 1 3 3L17 13m-3-3 3 3M4 21h4l10-10-4-4L4 17v4Z" />,
  },
  {
    title: 'Professionals at Work',
    copy: 'Verified teams execute on-site, coordinated end to end.',
    from: 'from-gold-600/30',
    to: 'to-navy-700',
    icon: <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-8 2a6 6 0 0 0-6 6v1h20v-1a6 6 0 0 0-6-6" />,
  },
  {
    title: 'The Completed Home',
    copy: 'Built with clarity, delivered with confidence.',
    from: 'from-navy-600',
    to: 'to-gold-500/30',
    icon: <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-8Z" />,
  },
]

function VisualStorySection() {
  return (
    <section className="relative bg-navy-950 py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="text-xs font-medium uppercase tracking-[0.4em] text-gold-400/90"
        >
          From Blueprint to Home
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl"
        >
          A story told in one continuous build
        </motion.h2>
      </div>

      <div className="mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {frames.map((frame, i) => (
          <motion.div
            key={frame.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex h-80 w-[78vw] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br ${frame.from} ${frame.to} p-6 sm:h-96 sm:w-[360px] sm:p-8`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="absolute -right-6 -top-6 h-40 w-40 text-ink/10"
            >
              {frame.icon}
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 h-9 w-9 text-gold-400"
            >
              {frame.icon}
            </svg>
            <h3 className="font-display text-xl font-semibold text-ink">
              {frame.title}
            </h3>
            <p className="mt-2 text-sm text-ink/70">{frame.copy}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default VisualStorySection

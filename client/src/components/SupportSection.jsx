import { motion } from 'framer-motion'

const items = [
  {
    title: 'About Sankalp',
    copy: 'A digital ecosystem connecting every stage of construction — from planning to completion — in one platform.',
  },
  {
    title: 'Get in Touch',
    copy: 'Have a question about the platform? Reach our support team through the login portal once your account is set up.',
  },
  {
    title: 'For Professionals',
    copy: 'Architects, contractors, supervisors and workers can all coordinate their work through Sankalp.',
  },
]

function SupportSection() {
  return (
    <section className="relative bg-navy-900 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7 }}
          className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl"
        >
          Support &amp; Information
        </motion.h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
              className="rounded-2xl border border-ink/10 bg-navy-800/50 p-6 shadow-none transition-[border-color,box-shadow] duration-300 hover:border-gold-500/40 hover:shadow-[0_18px_40px_-18px_rgba(234,180,36,0.35)]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
            >
              <h3 className="font-display text-lg font-semibold text-gold-400">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                {item.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SupportSection

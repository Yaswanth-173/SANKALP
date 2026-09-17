import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const title = 'SANKALP'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
}

const letter = {
  hidden: { y: 60, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
}

function Hero() {
  const ref = useRef(null)
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const midY = useTransform(scrollYProgress, [0, 1], ['0%', '55%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '80%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex h-[100svh] min-h-[640px] w-full items-center justify-center overflow-hidden bg-navy-950"
    >
      {/* Deep atmosphere gradient */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(32,42,74,0.9),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(234,180,36,0.08),_transparent_55%)]"
      />

      {/* Blueprint grid layer */}
      <motion.div
        style={{ y: midY }}
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
      >
        <div
          className="h-[140%] w-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(246,196,83,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(246,196,83,0.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </motion.div>

      {/* Architectural silhouette */}
      <motion.svg
        style={{ y: midY }}
        aria-hidden="true"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full text-navy-700/60"
      >
        <path
          fill="currentColor"
          d="M0 400V260l90-40 60 22 70-48 80 30 40-60 70 34 60-46 90 40 50-20 80 44 70-30 60 26 90-40 60 20 70-34 40 22V400Z"
        />
      </motion.svg>

      {/* Gold ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[110px]"
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-5 text-xs font-medium uppercase tracking-[0.45em] text-gold-400/90 sm:text-sm"
        >
          Build Smarter · Live Better
        </motion.span>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center justify-center font-display text-6xl font-bold tracking-tight text-ink sm:text-7xl md:text-8xl"
          aria-label={title}
        >
          {title.split('').map((char, i) => (
            <motion.span key={i} variants={letter} className="inline-block">
              {char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-display text-xl font-medium text-ink/90 sm:text-2xl"
        >
          Your Complete Digital Construction Ecosystem
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-xl text-balance text-sm text-ink/60 sm:text-base"
        >
          Planning, design, materials, professionals and construction
          management — brought together in one connected platform.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.55, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/signup')}
          className="group relative mt-9 overflow-hidden rounded-full bg-gold-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-charcoal shadow-[0_0_0_0_rgba(234,180,36,0.6)] transition-shadow duration-500 hover:shadow-[0_0_45px_5px_rgba(234,180,36,0.35)] sm:text-base"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[shine_1.1s_ease-in-out]"
          />
          <span className="relative">Get Started Free</span>
        </motion.button>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-ink/25 p-1.5">
          <motion.span
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="h-1.5 w-1.5 rounded-full bg-gold-400"
          />
        </div>
      </motion.div>
    </section>
  )
}

export default Hero

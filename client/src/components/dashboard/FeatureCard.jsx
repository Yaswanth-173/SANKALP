import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from './icons.jsx'

const MotionLink = motion(Link)
const TILT_RANGE = 9 // degrees

function FeatureCard({ icon, title, description, to, index = 0 }) {
  const cardRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 300, damping: 22, mass: 0.6 })
  const springY = useSpring(rotateY, { stiffness: 300, damping: 22, mass: 0.6 })

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * TILT_RANGE * 2)
    rotateX.set(-py * TILT_RANGE * 2)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 900 }}
    >
      <MotionLink
        ref={cardRef}
        to={to}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.03, y: -6 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-navy-900/50 p-5 shadow-lg transition-colors duration-300 hover:border-gold-500/40 hover:shadow-[0_20px_45px_-12px_rgba(234,180,36,0.4)] sm:p-6"
      >
        <div style={{ transform: 'translateZ(40px)' }}>
          <img
            src={icon}
            alt=""
            className="h-24 w-24 rounded-xl object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-28 sm:w-28"
            draggable={false}
          />
          <h3 className="mt-4 font-display text-base font-semibold text-ink sm:text-lg">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/50">{description}</p>
        </div>

        <span
          style={{ transform: 'translateZ(30px)' }}
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-charcoal transition-all duration-300 group-hover:translate-x-1 group-hover:bg-gold-400"
        >
          <ArrowRightIcon className="h-4.5 w-4.5" />
        </span>
      </MotionLink>
    </motion.div>
  )
}

export default FeatureCard

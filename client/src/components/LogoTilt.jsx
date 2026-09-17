import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import Logo from './Logo.jsx'

const TILT_RANGE = 10

/**
 * Sankalp logo wrapped in a mouse-tracked 3D tilt, a slow ambient glow
 * pulse, and a periodic light-sweep shimmer, so it reads as alive at
 * rest instead of a flat static image. Used on both the landing page
 * navbar and the dashboard sidebar.
 */
function LogoTilt({ className = 'h-11 w-auto sm:h-14', entrance = true }) {
  const ref = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 250, damping: 18, mass: 0.6 })
  const springY = useSpring(rotateY, { stiffness: 250, damping: 18, mass: 0.6 })
  const reduceMotion = useReducedMotion()

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
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
      initial={entrance ? { opacity: 0, scale: 0.6, rotateY: -50 } : false}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: entrance ? 0.35 : 0 }}
      style={{ perspective: 600 }}
      className="relative inline-block"
    >
      {!reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-white/15 blur-xl"
          animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{
          scale: 1.08,
          filter: 'drop-shadow(0 10px 22px rgba(255,255,255,0.45))',
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        className="relative cursor-pointer overflow-hidden rounded-lg"
      >
        <Logo className={className} />

        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            style={{ mixBlendMode: 'screen' }}
            className="pointer-events-none absolute inset-y-0 left-0 w-[12%] -skew-x-12 bg-gradient-to-r from-transparent via-white/90 to-transparent blur-[1px]"
            initial={{ x: '-400%' }}
            animate={{ x: '900%' }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3.2, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

export default LogoTilt

import { motion } from 'framer-motion'

function DashboardBackground() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1 }}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-navy-950"
    >
      {/* base atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(234,180,36,0.06),_transparent_50%)]" />

      {/* blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(96,165,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* crane / architectural line-art, upper right */}
      <svg
        viewBox="0 0 400 300"
        className="absolute -right-10 -top-6 h-72 w-72 text-blue-400/15 sm:h-96 sm:w-96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M60 280V60M60 60l120 20M60 90l150 15M180 80v40M60 60l-30 10" />
        <path d="M180 120v160M150 280h60M120 200h120" strokeDasharray="4 5" />
        <circle cx="60" cy="55" r="4" fill="currentColor" stroke="none" />
      </svg>

      {/* glowing wave curves, bottom */}
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-56 w-full sm:h-72"
      >
        <path
          d="M0 200 C 200 120, 400 260, 600 180 S 1000 100, 1200 190"
          fill="none"
          stroke="#3b82f6"
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <path
          d="M0 240 C 250 170, 450 280, 700 210 S 1050 150, 1200 230"
          fill="none"
          stroke="#eab424"
          strokeOpacity="0.12"
          strokeWidth="1.5"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-blue-500/10 blur-3xl" />
    </motion.div>
  )
}

export default DashboardBackground

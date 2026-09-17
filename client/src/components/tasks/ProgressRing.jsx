import { motion } from 'framer-motion'

function ProgressRing({ percent = 0, size = 88, stroke = 8, label, sublabel }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-ink/10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            className="text-gold-400"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-bold text-ink">{Math.round(percent)}%</span>
        </div>
      </div>
      {(label || sublabel) && (
        <div>
          {label && <p className="font-display text-sm font-semibold text-ink">{label}</p>}
          {sublabel && <p className="mt-0.5 text-xs text-ink/45">{sublabel}</p>}
        </div>
      )}
    </div>
  )
}

export default ProgressRing

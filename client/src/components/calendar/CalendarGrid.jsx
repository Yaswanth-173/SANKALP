import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getMonthMatrix, getWeekdayLabels, toDateKey } from '../../utils/date.js'
import { eventTypeConfig } from './eventTypes.js'
import { useTranslation } from '../../i18n/index.js'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.012 } },
}

const cell = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

function CalendarGrid({ year, month, eventsByDate, selectedDate, onSelectDate, today }) {
  const { language } = useTranslation()
  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language])
  const weeks = getMonthMatrix(year, month)
  const todayKey = toDateKey(today)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-medium uppercase tracking-wide text-ink/40">
        {weekdayLabels.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ perspective: 700 }}
        className="grid grid-cols-7 gap-1.5"
      >
        {weeks.flat().map(({ date, inMonth }) => {
          const key = toDateKey(date)
          const dayEvents = eventsByDate[key] || []
          const isToday = key === todayKey
          const isSelected = key === selectedDate

          return (
            <motion.button
              key={key}
              type="button"
              variants={cell}
              onClick={() => onSelectDate(key)}
              whileHover={{
                y: -5,
                scale: 1.08,
                rotateX: 12,
                zIndex: 1,
                boxShadow: '0px 16px 30px -10px rgba(234,180,36,0.4)',
              }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              style={{ transformStyle: 'preserve-3d' }}
              className={`flex h-16 flex-col items-center justify-start gap-1 rounded-lg border p-1.5 text-sm sm:h-20 ${
                isSelected
                  ? 'border-gold-500/60 bg-gold-500/10'
                  : isToday
                    ? 'border-ink/20 bg-ink/5'
                    : 'border-ink/5 bg-navy-900/40'
              } ${inMonth ? 'text-ink' : 'text-ink/25'}`}
            >
              <span className={isToday ? 'font-semibold text-gold-400' : ''}>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span key={ev.id} className={`h-1.5 w-1.5 rounded-full ${eventTypeConfig(ev.type).color}`} />
                  ))}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

export default CalendarGrid

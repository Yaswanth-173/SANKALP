import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../i18n/index.js'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import CalendarGrid from '../components/calendar/CalendarGrid.jsx'
import DayPanel from '../components/calendar/DayPanel.jsx'
import UpcomingEvents from '../components/calendar/UpcomingEvents.jsx'
import { getMonthNames, toDateKey } from '../utils/date.js'
import { apiFetch } from '../utils/api.js'

const today = new Date()

function CalendarPage() {
  const { t, language } = useTranslation()
  const monthNames = useMemo(() => getMonthNames(language), [language])
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(0)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const loadEvents = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/api/calendar/events?month=${month + 1}&year=${year}`)
      setEvents(data.events)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  const upcoming = useMemo(() => {
    const todayKey = toDateKey(today)
    return events.filter((e) => e.date >= todayKey).slice(0, 6)
  }, [events])

  const handleCreate = async ({ title, type, notes, date }) => {
    const data = await apiFetch('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({ title, type, notes, date }),
    })
    setEvents((prev) => [...prev, data.event])
  }

  const handleDelete = async (id) => {
    await apiFetch(`/api/calendar/events/${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const goToMonth = (delta) => {
    setDirection(delta)
    setCursor(new Date(year, month + delta, 1))
  }

  const goToToday = () => {
    setDirection(0)
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader
            onMenuClick={onMenuClick}
            title={t('calendar.title')}
            subtitle={t('calendar.subtitle')}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]"
          >
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-navy-900/40 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-lg font-semibold text-ink"
                  >
                    {monthNames[month]} {year}
                  </motion.h2>
                </AnimatePresence>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={goToToday}
                    className="rounded-lg border border-ink/10 px-2.5 py-1 text-xs text-ink/60 hover:bg-ink/5"
                  >
                    {t('calendar.today')}
                  </button>
                  <button
                    onClick={() => goToMonth(-1)}
                    aria-label="Previous month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => goToMonth(1)}
                    aria-label="Next month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${year}-${month}`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 36 }}
                  animate={{ opacity: loading ? 0.5 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 36 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <CalendarGrid
                    year={year}
                    month={month}
                    eventsByDate={eventsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    today={today}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <DayPanel
                dateKey={selectedDate}
                events={eventsByDate[selectedDate] || []}
                onCreate={handleCreate}
                onDelete={handleDelete}
              />
              <UpcomingEvents events={upcoming} onSelectDate={setSelectedDate} />
            </motion.div>
          </motion.div>
        </>
      )}
    </DashboardShell>
  )
}

export default CalendarPage

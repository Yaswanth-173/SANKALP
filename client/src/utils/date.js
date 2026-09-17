export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset)

  const weeks = []
  let cursor = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cursor),
        inMonth: cursor.getMonth() === month,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const LOCALE_MAP = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

export function getMonthNames(language = 'en') {
  const locale = LOCALE_MAP[language] || 'en-IN'
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2000, m, 1)))
}

export function getWeekdayLabels(language = 'en') {
  const locale = LOCALE_MAP[language] || 'en-IN'
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // 2023-01-01 was a Sunday — start there so index 0 = Sunday.
  return Array.from({ length: 7 }, (_, d) => fmt.format(new Date(2023, 0, 1 + d)))
}

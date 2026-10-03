export const EVENT_TYPES = [
  { value: 'site_visit', labelKey: 'eventTypes.siteVisit', color: 'bg-blue-400', text: 'text-blue-300', border: 'border-blue-400/30' },
  { value: 'delivery', labelKey: 'eventTypes.delivery', color: 'bg-teal-400', text: 'text-teal-300', border: 'border-teal-400/30' },
  { value: 'milestone', labelKey: 'eventTypes.milestone', color: 'bg-gold-400', text: 'text-gold-300', border: 'border-gold-400/30' },
  { value: 'other', labelKey: 'eventTypes.other', color: 'bg-ink/50', text: 'text-ink/70', border: 'border-ink/20' },
]

export const eventTypeConfig = (type) => EVENT_TYPES.find((e) => e.value === type) || EVENT_TYPES[3]

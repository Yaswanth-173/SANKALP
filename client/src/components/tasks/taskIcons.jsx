const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const MaterialsIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </svg>
)

export const WorkIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 0 0 5-5.4l-2.7 2.7-2.4-2.4 2.7-2.7Z" />
  </svg>
)

export const SiteVisitIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

export const PendingIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
)

export const InProgressIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)

export const CompletedIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 12.5 11 15.5 16.5 9" />
    <circle cx="12" cy="12" r="9" />
  </svg>
)

export const ArrowRightSmallIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const ChevronRightSmallIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const BuildingIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01M10 21v-4h4v4" />
  </svg>
)

export const InfoIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const FilterIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </svg>
)

export const TYPE_CONFIG = {
  materials: { label: 'Materials', icon: MaterialsIcon, bg: 'bg-orange-500/15', color: 'text-orange-300' },
  work: { label: 'Work', icon: WorkIcon, bg: 'bg-red-500/15', color: 'text-red-300' },
  site_visit: { label: 'Site Visit', icon: SiteVisitIcon, bg: 'bg-blue-500/15', color: 'text-blue-300' },
}

export const PRIORITY_CONFIG = {
  high: { label: 'High', border: 'border-red-400/40', bg: 'bg-red-500/10', color: 'text-red-400' },
  medium: { label: 'Medium', border: 'border-gold-500/40', bg: 'bg-gold-500/10', color: 'text-gold-300' },
  low: { label: 'Low', border: 'border-emerald-400/40', bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
}

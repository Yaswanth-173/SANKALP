let uid = 0
const nextId = (prefix) => `${prefix}-${uid++}`

export const CementIcon = (p) => {
  const g1 = nextId('cem-bag'), g2 = nextId('cem-fold')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2b878" />
          <stop offset="100%" stopColor="#b8894f" />
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3d4a0" />
          <stop offset="100%" stopColor="#d9ac6c" />
        </linearGradient>
      </defs>
      <path d="M10 12 8 40h32l-2-28Z" fill={`url(#${g1})`} />
      <path d="M12 12h24l1.2 4H10.8Z" fill={`url(#${g2})`} />
      <rect x="13" y="20" width="22" height="12" rx="1.5" fill="#fff" opacity="0.92" />
      <rect x="15" y="23" width="18" height="2.2" rx="1" fill="#c62828" />
      <rect x="15" y="26.5" width="12" height="2.2" rx="1" fill="#455a64" />
      <path d="M9.5 40h29" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export const SteelIcon = (p) => {
  const g1 = nextId('steel-bar')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cfd8dc" />
          <stop offset="50%" stopColor="#90a4ae" />
          <stop offset="100%" stopColor="#607d8b" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={6 + i * 1.6} y={8 + i * 1.6} width="30" height="4.4" rx="2.2" fill={`url(#${g1})`} transform={`translate(${i * 0.4} 0)`} />
      ))}
      <ellipse cx="8" cy="10.2" rx="2.2" ry="2.2" fill="#455a64" />
      <ellipse cx="39" cy="24" rx="2.2" ry="2.2" fill="#455a64" />
      <path d="M10 34h28" stroke="#eab424" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export const BrickIcon = (p) => {
  const brick = (x, y, w, colorA, colorB, id) => (
    <g key={id}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height="7.5" rx="1" fill={`url(#${id})`} stroke="#7a2e15" strokeWidth="0.6" />
    </g>
  )
  return (
    <svg viewBox="0 0 48 48" {...p}>
      {brick(4, 8, 18, '#e2734a', '#c14f2b', nextId('b1'))}
      {brick(24, 8, 20, '#e2734a', '#c14f2b', nextId('b2'))}
      {brick(13, 16.5, 20, '#d9663d', '#b34424', nextId('b3'))}
      {brick(4, 25, 8, '#e2734a', '#c14f2b', nextId('b4'))}
      {brick(14, 25, 18, '#d9663d', '#b34424', nextId('b5'))}
      {brick(34, 25, 10, '#e2734a', '#c14f2b', nextId('b6'))}
      {brick(4, 33.5, 18, '#d9663d', '#b34424', nextId('b7'))}
      {brick(24, 33.5, 20, '#e2734a', '#c14f2b', nextId('b8'))}
    </svg>
  )
}

export const SandIcon = (p) => {
  const g1 = nextId('sand-hill')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d896" />
          <stop offset="100%" stopColor="#dcb35c" />
        </linearGradient>
      </defs>
      <path d="M5 38c1-14 8-22 19-22s18 8 19 22Z" fill={`url(#${g1})`} />
      <path d="M14 38c1-9 5-14 10-14s9 5 10 14Z" fill="#eac073" />
      <rect x="30" y="6" width="3" height="16" rx="1.4" fill="#8d6e63" transform="rotate(18 31.5 14)" />
      <path d="M28 8 38 12 34 20 26 15Z" fill="#90a4ae" transform="rotate(18 32 14)" />
      <path d="M5 38h38" stroke="#b98a45" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export const PaintIcon = (p) => {
  const g1 = nextId('paint-can')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fc3f7" />
          <stop offset="100%" stopColor="#0288d1" />
        </linearGradient>
      </defs>
      <path d="M11 16h20l-1.5 22a2 2 0 0 1-2 1.8H14.5a2 2 0 0 1-2-1.8Z" fill={`url(#${g1})`} />
      <rect x="10" y="12" width="22" height="5" rx="1.2" fill="#01579b" />
      <rect x="14" y="22" width="14" height="7" rx="1" fill="#fff" opacity="0.9" />
      <path d="M17 9c0-1.6 1.3-2.6 3-2.6h4c1.7 0 3 1 3 2.6" stroke="#455a64" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M33 18 40 11" stroke="#8d6e63" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 14l6-5 2.5 2.5-5 6Z" fill="#eab424" />
    </svg>
  )
}

export const TileIcon = (p) => {
  const g1 = nextId('tile-a'), g2 = nextId('tile-b')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3f2fd" />
          <stop offset="100%" stopColor="#90caf9" />
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eceff1" />
          <stop offset="100%" stopColor="#b0bec5" />
        </linearGradient>
      </defs>
      <rect x="18" y="6" width="24" height="24" rx="1.5" fill={`url(#${g1})`} stroke="#64b5f6" strokeWidth="0.8" transform="skewX(-6)" />
      <rect x="10" y="16" width="24" height="24" rx="1.5" fill={`url(#${g2})`} stroke="#90a4ae" strokeWidth="0.8" transform="skewX(-6)" />
      <path d="M14 22h16M14 28h16M14 34h16" stroke="#78909c" strokeWidth="0.7" opacity="0.6" transform="skewX(-6)" />
    </svg>
  )
}

export const PipeIcon = (p) => {
  const g1 = nextId('pipe-a')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5d6a7" />
          <stop offset="100%" stopColor="#4c8c50" />
        </linearGradient>
      </defs>
      <rect x="6" y="18" width="30" height="9" rx="4.5" fill={`url(#${g1})`} />
      <ellipse cx="10.5" cy="22.5" rx="4.5" ry="4.5" fill="#e8f5e9" stroke="#4c8c50" strokeWidth="1.2" />
      <ellipse cx="10.5" cy="22.5" rx="2.4" ry="2.4" fill="#2e7d32" />
      <rect x="30" y="27" width="9" height="14" rx="4.5" fill={`url(#${g1})`} />
      <ellipse cx="34.5" cy="41" rx="4.5" ry="4.5" fill="#e8f5e9" stroke="#4c8c50" strokeWidth="1.2" />
      <ellipse cx="34.5" cy="41" rx="2.4" ry="2.4" fill="#2e7d32" />
    </svg>
  )
}

export const ElectricalIcon = (p) => {
  const g1 = nextId('elec-coil')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff59d" />
          <stop offset="100%" stopColor="#fbc02d" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill={`url(#${g1})`} />
      <circle cx="24" cy="24" r="16" fill="none" stroke="#f57f17" strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M27 13 17 26h6l-3 9 12-14h-7Z" fill="#e64a19" stroke="#bf360c" strokeWidth="0.8" />
    </svg>
  )
}

export const HardwareIcon = (p) => {
  const g1 = nextId('hw-head')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb74d" />
          <stop offset="100%" stopColor="#e65100" />
        </linearGradient>
      </defs>
      <rect x="20" y="18" width="6.4" height="24" rx="3.2" fill="#8d6e63" />
      <rect x="9" y="7" width="30" height="12" rx="3" fill={`url(#${g1})`} />
      <path d="M11 34c4-6 8-8 12-8s8 2 12 8" stroke="#607d8b" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export const SanitaryIcon = (p) => {
  const g1 = nextId('san-body')
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd8dc" />
        </linearGradient>
      </defs>
      <rect x="12" y="6" width="24" height="10" rx="4" fill={`url(#${g1})`} stroke="#90a4ae" strokeWidth="1" />
      <path d="M14 16v6a10 10 0 0 0 20 0v-6Z" fill={`url(#${g1})`} stroke="#90a4ae" strokeWidth="1" />
      <path d="M18 34c0 4 3 7 6 7s6-3 6-7Z" fill="#b0bec5" />
      <rect x="16" y="40" width="16" height="3" rx="1.5" fill="#78909c" />
    </svg>
  )
}

export const ShopIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 9.5 5 4h14l1 5.5" />
    <path d="M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    <path d="M5.5 9.8V20h13V9.8" />
  </svg>
)

export const CartIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
    <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
  </svg>
)

export const SearchIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const CheckCircleIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.3 2.3L16 10" />
  </svg>
)

export const LocationIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

export const StarIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.5 6.6-.8Z" />
  </svg>
)

export const TruckIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2.5 6.5h11v10h-11Z" />
    <path d="M13.5 10.5h4l3 3v3h-7Z" />
    <circle cx="6.5" cy="18" r="1.8" />
    <circle cx="16.5" cy="18" r="1.8" />
  </svg>
)

export const MATERIAL_ICON_MAP = {
  cement: CementIcon,
  steel: SteelIcon,
  brick: BrickIcon,
  sand: SandIcon,
  paint: PaintIcon,
  tile: TileIcon,
  pipe: PipeIcon,
  electrical: ElectricalIcon,
  hardware: HardwareIcon,
  sanitary: SanitaryIcon,
}

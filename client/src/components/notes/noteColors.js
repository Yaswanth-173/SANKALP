export const NOTE_COLORS = {
  gold: { bg: 'bg-gold-500/10', border: 'border-gold-500/30', accent: 'bg-gold-400', glow: 'rgba(234,180,36,0.35)' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-400/30', accent: 'bg-blue-400', glow: 'rgba(96,165,250,0.35)' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-400/30', accent: 'bg-teal-400', glow: 'rgba(45,212,191,0.35)' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-400/30', accent: 'bg-rose-400', glow: 'rgba(251,113,133,0.35)' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-400/30', accent: 'bg-violet-400', glow: 'rgba(167,139,250,0.35)' },
}

export const NOTE_COLOR_LIST = Object.keys(NOTE_COLORS)

export const noteColorConfig = (color) => NOTE_COLORS[color] || NOTE_COLORS.gold

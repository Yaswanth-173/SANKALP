import { memo } from 'react'

/*
 * Isometric mid-rise building with a tower crane, generated from simple
 * box geometry so every floor is its own <g data-floor> (animated floor by
 * floor later) and the same drawing renders as either a line-only
 * "blueprint" or a filled "solid" building.
 */

const COS = 0.866
const SIN = 0.5
const iso = (x, y, z) => [(x - y) * COS, (x + y) * SIN - z]
const pts = (list) => list.map((p) => iso(...p).map((n) => n.toFixed(1)).join(',')).join(' ')
const line = (a, b) => {
  const [x1, y1] = iso(...a)
  const [x2, y2] = iso(...b)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`
}

const W = 140 // footprint along x
const D = 90 // footprint along y
const GROUND_H = 34
const FLOOR_H = 26
const FLOORS = 6
const TOP = GROUND_H + FLOORS * FLOOR_H

// Which windows glow in the solid version — fixed so renders are stable.
const LIT = new Set(['1-1', '1-4', '2-2', '2-5', '3-0', '3-3', '4-1', '4-4', '5-2', '5-5', '6-0', '6-3', 'r2-1', 'r4-2', 'r5-0', 'r6-3', 'r1-2'])

function levelGeometry(index) {
  const z0 = index === 0 ? 0 : GROUND_H + (index - 1) * FLOOR_H
  const h = index === 0 ? GROUND_H : FLOOR_H
  const z1 = z0 + h
  const faces = {
    top: pts([[0, 0, z1], [W, 0, z1], [W, D, z1], [0, D, z1]]),
    left: pts([[0, D, z0], [W, D, z0], [W, D, z1], [0, D, z1]]),
    right: pts([[W, 0, z0], [W, D, z0], [W, D, z1], [W, 0, z1]]),
  }

  // Windows on the front-left face (y = D), running along x.
  const leftCols = 6
  const lw = index === 0 ? 16 : 13
  const lGap = (W - leftCols * lw) / (leftCols + 1)
  const winTop = z1 - (index === 0 ? 7 : 5)
  const winBottom = z0 + (index === 0 ? 6 : 7)
  const leftWindows = Array.from({ length: leftCols }, (_, c) => {
    const x = lGap + c * (lw + lGap)
    // Ground floor: the middle two bays become the entrance glazing.
    const isDoor = index === 0 && (c === 2 || c === 3)
    return {
      key: `${index}-${c}`,
      points: pts([[x, D, isDoor ? z0 : winBottom], [x + lw, D, isDoor ? z0 : winBottom], [x + lw, D, winTop], [x, D, winTop]]),
      lit: LIT.has(`${index}-${c}`) || isDoor,
    }
  })

  // Windows on the front-right face (x = W), running along y.
  const rightCols = 4
  const rw = 12
  const rGap = (D - rightCols * rw) / (rightCols + 1)
  const rightWindows = Array.from({ length: rightCols }, (_, c) => {
    const y = rGap + c * (rw + rGap)
    return {
      key: `r${index}-${c}`,
      points: pts([[W, y, winBottom], [W, y + rw, winBottom], [W, y + rw, winTop], [W, y, winTop]]),
      lit: LIT.has(`r${index}-${c}`),
    }
  })

  return { faces, windows: [...leftWindows, ...rightWindows], slab: line([0, D, z1], [W, D, z1]) + line([W, D, z1], [W, 0, z1]) }
}

const LEVELS = Array.from({ length: FLOORS + 1 }, (_, i) => levelGeometry(i))

const ROOF = {
  parapet: pts([[0, 0, TOP + 5], [W, 0, TOP + 5], [W, D, TOP + 5], [0, D, TOP + 5]]),
  parapetLeft: pts([[0, D, TOP], [W, D, TOP], [W, D, TOP + 5], [0, D, TOP + 5]]),
  parapetRight: pts([[W, 0, TOP], [W, D, TOP], [W, D, TOP + 5], [W, 0, TOP + 5]]),
  // Lift/stair core on the roof.
  coreTop: pts([[20, 18, TOP + 24], [56, 18, TOP + 24], [56, 44, TOP + 24], [20, 44, TOP + 24]]),
  coreLeft: pts([[20, 44, TOP], [56, 44, TOP], [56, 44, TOP + 24], [20, 44, TOP + 24]]),
  coreRight: pts([[56, 18, TOP], [56, 44, TOP], [56, 44, TOP + 24], [56, 18, TOP + 24]]),
}

const SITE = {
  top: pts([[-24, -24, 0], [W + 24, -24, 0], [W + 24, D + 24, 0], [-24, D + 24, 0]]),
  left: pts([[-24, D + 24, -5], [W + 24, D + 24, -5], [W + 24, D + 24, 0], [-24, D + 24, 0]]),
  right: pts([[W + 24, -24, -5], [W + 24, D + 24, -5], [W + 24, D + 24, 0], [W + 24, -24, 0]]),
}

// Tower crane standing at the back-right of the site.
const MX = W + 38
const MY = 18
const CRANE_TOP = TOP + 62
function craneGeometry() {
  const segments = []
  segments.push(line([MX, MY, 0], [MX, MY, CRANE_TOP]))
  segments.push(line([MX + 9, MY, 0], [MX + 9, MY, CRANE_TOP]))
  for (let z = 0, flip = false; z < CRANE_TOP - 12; z += 14, flip = !flip) {
    segments.push(line([flip ? MX + 9 : MX, MY, z], [flip ? MX : MX + 9, MY, z + 14]))
  }
  const jib = line([MX + 52, MY, CRANE_TOP], [MX - 178, MY, CRANE_TOP])
  const jibUnder = line([MX + 52, MY, CRANE_TOP - 7], [MX - 150, MY, CRANE_TOP - 7])
  const ties = line([MX + 4, MY, CRANE_TOP + 22], [MX - 178, MY, CRANE_TOP]) + line([MX + 4, MY, CRANE_TOP + 22], [MX + 52, MY, CRANE_TOP])
  const peak = line([MX, MY, CRANE_TOP], [MX + 4, MY, CRANE_TOP + 22]) + line([MX + 9, MY, CRANE_TOP], [MX + 4, MY, CRANE_TOP + 22])
  const hook = line([MX - 104, MY, CRANE_TOP - 7], [MX - 104, MY, TOP + 30])
  const block = pts([[MX - 110, MY, TOP + 30], [MX - 98, MY, TOP + 30], [MX - 98, MY, TOP + 22], [MX - 110, MY, TOP + 22]])
  const counterweight = pts([[MX + 36, MY, CRANE_TOP - 7], [MX + 52, MY, CRANE_TOP - 7], [MX + 52, MY, CRANE_TOP - 19], [MX + 36, MY, CRANE_TOP - 19]])
  return { lattice: segments.join(''), jib: jib + jibUnder + ties + peak, hook, block, counterweight }
}
const CRANE = craneGeometry()

// Blueprint-only dimension lines.
const DIMS = [
  line([0, D + 40, 0], [W, D + 40, 0]),
  line([0, D + 34, 0], [0, D + 46, 0]),
  line([W, D + 34, 0], [W, D + 46, 0]),
  line([W + 40, 0, 0], [W + 40, D, 0]),
  line([-30, D, 0], [-30, D, TOP]),
  line([-36, D, 0], [-24, D, 0]),
  line([-36, D, TOP], [-24, D, TOP]),
].join('')

// Fit the viewBox to every generated coordinate (plus padding) so nothing
// — the crane jib, the roof core — can ever be clipped by a stale guess.
function fitViewBox(pad = 8) {
  const all = [
    SITE.top, SITE.left, SITE.right, DIMS,
    ...LEVELS.flatMap((l) => [l.faces.top, l.faces.left, l.faces.right]),
    ...Object.values(ROOF),
    ...Object.values(CRANE),
  ].join(' ')
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [, x, y] of all.matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)) {
    minX = Math.min(minX, +x)
    maxX = Math.max(maxX, +x)
    minY = Math.min(minY, +y)
    maxY = Math.max(maxY, +y)
  }
  return [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2].map((n) => n.toFixed(1)).join(' ')
}
const VIEWBOX = fitViewBox()

function BuildingIllustration({ variant = 'solid', className = '', showCrane = true, title }) {
  const blueprint = variant === 'blueprint'
  const stroke = blueprint ? 'var(--color-blueprint)' : 'var(--c-b-edge)'
  const faceFill = (key) => (blueprint ? 'none' : `var(--c-b-${key})`)
  const sw = blueprint ? 0.9 : 0.6

  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      data-variant={variant}
    >
      {/* Site plate */}
      <g data-site stroke={stroke} strokeWidth={sw}>
        <polygon points={SITE.top} fill={blueprint ? 'color-mix(in oklab, var(--color-blueprint) 5%, transparent)' : 'var(--c-b-site)'} />
        <polygon points={SITE.left} fill={faceFill('left')} />
        <polygon points={SITE.right} fill={faceFill('right')} />
      </g>

      {blueprint && (
        <g data-dim stroke="var(--color-blueprint)" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.7">
          <path d={DIMS} />
        </g>
      )}


      {LEVELS.map((level, i) => (
        <g key={i} data-floor={i} stroke={stroke} strokeWidth={sw}>
          <polygon points={level.faces.left} fill={faceFill('left')} />
          <polygon points={level.faces.right} fill={faceFill('right')} />
          <polygon points={level.faces.top} fill={faceFill('top')} />
          {level.windows.map((w) => (
            <polygon
              key={w.key}
              points={w.points}
              strokeWidth={blueprint ? 0.6 : 0.4}
              fill={blueprint ? 'none' : w.lit ? 'var(--c-b-lit)' : 'var(--c-b-glass)'}
            />
          ))}
          {!blueprint && <path d={level.slab} stroke="var(--c-b-slab)" strokeWidth="1.2" />}
        </g>
      ))}

      <g data-floor={LEVELS.length} stroke={stroke} strokeWidth={sw}>
        <polygon points={ROOF.parapetLeft} fill={faceFill('left')} />
        <polygon points={ROOF.parapetRight} fill={faceFill('right')} />
        <polygon points={ROOF.parapet} fill={faceFill('top')} />
        <polygon points={ROOF.coreLeft} fill={faceFill('left')} />
        <polygon points={ROOF.coreRight} fill={faceFill('right')} />
        <polygon points={ROOF.coreTop} fill={faceFill('top')} />
      </g>

      {showCrane && (
        <g data-crane stroke={blueprint ? 'var(--color-blueprint)' : 'var(--color-gold-500)'} strokeWidth={blueprint ? 0.8 : 1}>
          <path d={CRANE.lattice} />
          <path d={CRANE.jib} />
          <path d={CRANE.hook} strokeWidth="0.6" />
          <polygon points={CRANE.block} fill={blueprint ? 'none' : 'var(--color-gold-500)'} />
          <polygon points={CRANE.counterweight} fill={blueprint ? 'none' : 'var(--c-b-left)'} />
        </g>
      )}
    </svg>
  )
}

export default memo(BuildingIllustration)

// src/components/home/RouteMapBackdrop.tsx

import type { CSSProperties } from 'react'

import type { HeroMapPin } from '@/lib/charging'
import { getCityCoordinates } from '@/lib/city-coordinates'
import { PATH_D, VIEW_BOX, project } from './PakistanMap'
import { PIN_BOLT_D, PIN_HEAD_Y } from './station-pin'

/**
 * The country as a night map, behind the route planner band.
 *
 * Decoration, not navigation: the outline, a faint graticule, the cities
 * with the roads between them, and the real station network, all placed
 * through the same `project()` the hero uses.
 *
 * ── At rest, and lit ──────────────────────────────────────────────────
 *
 * At rest every road is a faint trace. When the pointer comes onto the band
 * (or keyboard focus moves into it, or on a touch screen, when it scrolls
 * into view — RoutePlannerPromo sets `data-lit` for those), the network
 * lights: starting from Islamabad, each road draws itself in mint from the
 * city nearer the start to the one further out, one hop after another, so
 * the light spreads across the country. Then a pulse keeps running along
 * every road for as long as the band is lit. Leaving fades it all back.
 *
 * All of it is CSS on the `group/route` ancestor — transitions on
 * stroke-dashoffset against a pathLength of 1, and one keyframe for the pulse
 * — so no React state changes on hover and nothing re-renders. The delay is
 * per road, set as a custom property and only applied on the way in, so the
 * light spreads but goes out together. Under reduced motion it lights
 * without travel and the pulse does not run.
 *
 * ── The roads ─────────────────────────────────────────────────────────
 *
 * Straight lines between cities along the country's real corridors — M-9,
 * N-5 / M-5, M-3 / M-4, M-2, GT Road, M-1, the Karakoram Highway, the Indus
 * Highway, N-50, N-65, N-25 and the Makran coast — so the shape of the network
 * is true even though no line follows a road's actual curves.
 */

type Anchor = 'start' | 'end'

/** Cities named on the map. `major` ones are set a little brighter. */
const CITIES: ReadonlyArray<{ key: string; name: string; major?: boolean; anchor?: Anchor; dy?: number }> = [
  { key: 'islamabad', name: 'Islamabad', major: true },
  { key: 'lahore', name: 'Lahore', major: true },
  { key: 'karachi', name: 'Karachi', major: true, anchor: 'end' },
  { key: 'peshawar', name: 'Peshawar', major: true, anchor: 'end' },
  { key: 'quetta', name: 'Quetta', major: true, anchor: 'end' },
  { key: 'multan', name: 'Multan', major: true },
  { key: 'faisalabad', name: 'Faisalabad', major: true },
  { key: 'hyderabad', name: 'Hyderabad', major: true, anchor: 'end' },
  { key: 'sukkur', name: 'Sukkur', major: true },
  { key: 'gujranwala', name: 'Gujranwala', anchor: 'end' },
  { key: 'sialkot', name: 'Sialkot' },
  { key: 'sargodha', name: 'Sargodha', anchor: 'end' },
  { key: 'abbottabad', name: 'Abbottabad' },
  { key: 'gilgit', name: 'Gilgit', anchor: 'end' },
  { key: 'skardu', name: 'Skardu' },
  { key: 'dera ismail khan', name: 'D.I. Khan', anchor: 'end' },
  { key: 'dera ghazi khan', name: 'D.G. Khan', anchor: 'end' },
  { key: 'bahawalpur', name: 'Bahawalpur' },
  { key: 'rahim yar khan', name: 'Rahim Yar Khan' },
  { key: 'larkana', name: 'Larkana', anchor: 'end' },
  { key: 'nawabshah', name: 'Nawabshah' },
  { key: 'mirpur khas', name: 'Mirpur Khas' },
  { key: 'zhob', name: 'Zhob', anchor: 'end' },
  { key: 'sibi', name: 'Sibi' },
  { key: 'khuzdar', name: 'Khuzdar', anchor: 'end' },
  { key: 'gwadar', name: 'Gwadar', dy: 18 },
]

/** The roads, as pairs of city keys. */
const ROADS: ReadonlyArray<readonly [string, string]> = [
  // M-1, M-2 and the GT Road around the capital and Lahore
  ['islamabad', 'peshawar'],
  ['islamabad', 'sargodha'],
  ['sargodha', 'lahore'],
  ['islamabad', 'gujranwala'],
  ['gujranwala', 'lahore'],
  ['gujranwala', 'sialkot'],
  ['sialkot', 'lahore'],
  // M-4 and M-3
  ['sargodha', 'faisalabad'],
  ['lahore', 'faisalabad'],
  ['faisalabad', 'multan'],
  ['lahore', 'multan'],
  // The north: Karakoram Highway
  ['islamabad', 'abbottabad'],
  ['abbottabad', 'gilgit'],
  ['gilgit', 'skardu'],
  // Indus Highway and N-50
  ['peshawar', 'dera ismail khan'],
  ['dera ismail khan', 'dera ghazi khan'],
  ['dera ghazi khan', 'multan'],
  ['dera ismail khan', 'zhob'],
  ['zhob', 'quetta'],
  // N-5 / M-5 south
  ['multan', 'bahawalpur'],
  ['bahawalpur', 'rahim yar khan'],
  ['rahim yar khan', 'sukkur'],
  ['sukkur', 'larkana'],
  ['sukkur', 'nawabshah'],
  ['nawabshah', 'hyderabad'],
  ['hyderabad', 'mirpur khas'],
  ['hyderabad', 'karachi'],
  // N-65 and N-25 to Quetta, the Makran coast
  ['sukkur', 'sibi'],
  ['sibi', 'quetta'],
  ['quetta', 'khuzdar'],
  ['khuzdar', 'karachi'],
  ['karachi', 'gwadar'],
]

/** Where the light starts. */
const ORIGIN = 'islamabad'
/** Seconds between one hop of the spread and the next. */
const HOP = 0.2
/** Seconds each road takes to draw. */
const DRAW = 0.55

const AT = new Map(
  CITIES.map((c) => {
    const g = getCityCoordinates(c.key)
    return [c.key, g ? project(g.lng, g.lat) : null] as const
  }).filter((e): e is readonly [string, { x: number; y: number }] => e[1] !== null),
)

/** Hops from the origin, by breadth-first search over the roads. */
const DEPTH = (() => {
  const depth = new Map<string, number>([[ORIGIN, 0]])
  const queue = [ORIGIN]
  while (queue.length) {
    const here = queue.shift()!
    for (const [a, b] of ROADS) {
      const there = a === here ? b : b === here ? a : null
      if (there && !depth.has(there)) {
        depth.set(there, depth.get(here)! + 1)
        queue.push(there)
      }
    }
  }
  return depth
})()

/** Each road oriented to draw outward, with the delay its hop earns it. */
const EDGES = ROADS.flatMap(([a, b]) => {
  const da = DEPTH.get(a) ?? 0
  const db = DEPTH.get(b) ?? 0
  const [from, to] = da <= db ? [a, b] : [b, a]
  const p = AT.get(from)
  const q = AT.get(to)
  if (!p || !q) return []
  return [{ key: `${from}-${to}`, d: `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`, delay: Math.min(da, db) * HOP }]
})

/** Every two degrees, across the whole frame rather than clipped to land. */
const MERIDIANS = [60, 62, 64, 66, 68, 70, 72, 74, 76, 78].map((lon) => project(lon, 0).x)
const PARALLELS = [24, 26, 28, 30, 32, 34, 36, 38].map((lat) => project(0, lat).y)

/*
  The lit state. Each lit style is written out three times — pointer over the
  band, focus inside it, data-lit set on it — and in full, because Tailwind
  only generates classes it can read literally in the source.
*/
const LIT_DELAY =
  'group-hover/route:[transition-delay:var(--d)] group-focus-within/route:[transition-delay:var(--d)] group-data-[lit=true]/route:[transition-delay:var(--d)]'

const DRAW_IN =
  '[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[550ms] ease-out motion-reduce:transition-none ' +
  'group-hover/route:[stroke-dashoffset:0] group-focus-within/route:[stroke-dashoffset:0] group-data-[lit=true]/route:[stroke-dashoffset:0] ' +
  LIT_DELAY

const PULSE_ON =
  'group-hover/route:opacity-100 group-focus-within/route:opacity-100 group-data-[lit=true]/route:opacity-100'
const DOT_ON =
  'group-hover/route:fill-plug-cyan-300 group-focus-within/route:fill-plug-cyan-300 group-data-[lit=true]/route:fill-plug-cyan-300'
const MAJOR_ON =
  'group-hover/route:fill-white/90 group-focus-within/route:fill-white/90 group-data-[lit=true]/route:fill-white/90'
const MINOR_ON =
  'group-hover/route:fill-white/65 group-focus-within/route:fill-white/65 group-data-[lit=true]/route:fill-white/65'

export interface RouteMapBackdropProps {
  pins: readonly HeroMapPin[]
  className?: string
}

export function RouteMapBackdrop({ pins, className }: RouteMapBackdropProps) {
  const [vx, vy, vw, vh] = VIEW_BOX.split(' ').map(Number) as [number, number, number, number]
  const delayOf = (s: number) => ({ '--d': `${s}s` }) as CSSProperties
  const lastHop = Math.max(...EDGES.map((e) => e.delay)) + DRAW

  return (
    <svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="rmb-fade" cx="0.6" cy="0.45" r="0.6">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="rmb-mask">
          <rect x={vx} y={vy} width={vw} height={vh} fill="url(#rmb-fade)" />
        </mask>
        <filter id="rmb-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <g mask="url(#rmb-mask)">
        {/* Graticule */}
        <g className="stroke-white/[0.05]" strokeWidth={1}>
          {MERIDIANS.map((x) => (
            <line key={`m${x}`} x1={x} x2={x} y1={vy} y2={vy + vh} />
          ))}
          {PARALLELS.map((y) => (
            <line key={`p${y}`} x1={vx} x2={vx + vw} y1={y} y2={y} />
          ))}
        </g>

        {/* Land */}
        <path d={PATH_D} className="fill-white/[0.035] stroke-plug-sky-100/25" strokeWidth={1.4} strokeLinejoin="round" />

        {/* The roads at rest: faint traces. */}
        <g fill="none" strokeLinecap="round" className="stroke-white/[0.16]" strokeWidth={1.3}>
          {EDGES.map((e) => (
            <path key={e.key} d={e.d} strokeDasharray="3 5" />
          ))}
        </g>

        {/* The roads lit: a soft glow, then the line, both drawing outward. */}
        <g fill="none" strokeLinecap="round" filter="url(#rmb-glow)" className="stroke-plug-cyan-400" strokeWidth={7} opacity={0.55}>
          {EDGES.map((e) => (
            <path key={e.key} d={e.d} pathLength={1} className={DRAW_IN} style={delayOf(e.delay)} />
          ))}
        </g>
        <g fill="none" strokeLinecap="round" className="stroke-plug-cyan-300" strokeWidth={2.4}>
          {EDGES.map((e) => (
            <path key={e.key} d={e.d} pathLength={1} className={DRAW_IN} style={delayOf(e.delay)} />
          ))}
        </g>

        {/* The pulse: a short bright dash running along every road once the
            light has spread, for as long as the band stays lit. */}
        <g
          fill="none"
          strokeLinecap="round"
          className={
            `stroke-white opacity-0 transition-opacity duration-300 motion-reduce:hidden ${PULSE_ON} ${LIT_DELAY}`
          }
          strokeWidth={2.4}
          style={delayOf(lastHop)}
        >
          {EDGES.map((e, i) => (
            <path
              key={e.key}
              d={e.d}
              pathLength={1}
              strokeDasharray="0.12 0.88"
              className="route-pulse"
              style={{ animationDelay: `${-(i % 5) * 0.37}s` }}
            />
          ))}
        </g>

        {/* City names; each dot lights as the spread reaches it. */}
        {CITIES.map((c) => {
          const at = AT.get(c.key)
          if (!at) return null
          const anchor = c.anchor ?? 'start'
          const dx = anchor === 'end' ? -9 : 9
          const reach = (DEPTH.get(c.key) ?? 0) * HOP + (c.key === ORIGIN ? 0 : DRAW * 0.8)
          return (
            <g key={c.key}>
              <circle
                cx={at.x}
                cy={at.y}
                r={c.major ? 3.4 : 2.6}
                className={
                  `fill-white/40 transition-[fill] duration-300 ${DOT_ON} ${LIT_DELAY}`
                }
                style={delayOf(reach)}
              />
              <text
                x={at.x + dx}
                y={at.y + 4.5 + (c.dy ?? 0)}
                textAnchor={anchor}
                className={
                  (c.major
                    ? `fill-white/55 text-[15px] font-semibold ${MAJOR_ON}`
                    : `fill-white/35 text-[13px] font-medium ${MINOR_ON}`) + ` transition-[fill] duration-300 ${LIT_DELAY}`
                }
                style={delayOf(reach)}
              >
                {c.name}
              </text>
            </g>
          )
        })}

        {/* The network, from the database */}
        {pins.map((pin) => {
          const at = project(pin.lng, pin.lat)
          return (
            <g key={pin.slug} transform={`translate(${at.x} ${at.y})`}>
              <circle r={13} className="fill-plug-cyan-500" opacity={0.18} />
              <circle r={8.5} className="fill-plug-cyan-500 stroke-plug-navy-950" strokeWidth={1.5} />
              <path d={PIN_BOLT_D} transform={`translate(0 ${-PIN_HEAD_Y})`} className="fill-plug-navy-950" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

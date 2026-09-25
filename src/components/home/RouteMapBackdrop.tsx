// src/components/home/RouteMapBackdrop.tsx

import type { HeroMapPin } from '@/lib/charging'
import { getCityCoordinates } from '@/lib/city-coordinates'
import { HIGHWAY_D } from './highway'
import { PATH_D, VIEW_BOX, project } from './PakistanMap'
import { PIN_BOLT_D, PIN_HEAD_Y } from './station-pin'

/**
 * The country as a night map, behind the route planner band.
 *
 * Decoration, not navigation: the outline, a faint graticule, the N-5
 * corridor, a handful of city names and the real station network, all placed
 * through the same `project()` the hero uses. The Islamabad → Lahore leg is
 * lit because that is the trip the card in front of it plans.
 *
 * The pins are the database's, as on the hero — no dot here is a charger
 * that does not exist.
 */

/** Cities named on the backdrop. Faint, so they read as map, not content. */
const LABELS = [
  'Gilgit',
  'Skardu',
  'Peshawar',
  'Islamabad',
  'Lahore',
  'Faisalabad',
  'Multan',
  'Bahawalpur',
  'Quetta',
  'Sukkur',
  'Hyderabad',
  'Karachi',
] as const

/** The leg the promo card describes, north to south. */
const ROUTE = ['islamabad', 'jhelum', 'gujranwala', 'lahore'] as const

const ROUTE_PTS = ROUTE.map(getCityCoordinates)
  .filter((c): c is NonNullable<typeof c> => c !== null)
  .map((c) => project(c.lng, c.lat))

const ROUTE_D = ROUTE_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

/** Every two degrees, across the whole frame rather than clipped to land. */
const MERIDIANS = [60, 62, 64, 66, 68, 70, 72, 74, 76, 78].map((lon) => project(lon, 0).x)
const PARALLELS = [24, 26, 28, 30, 32, 34, 36, 38].map((lat) => project(0, lat).y)

export interface RouteMapBackdropProps {
  pins: readonly HeroMapPin[]
  className?: string
}

export function RouteMapBackdrop({ pins, className }: RouteMapBackdropProps) {
  const [vx, vy, vw, vh] = VIEW_BOX.split(' ').map(Number) as [number, number, number, number]
  const start = ROUTE_PTS[0]
  const end = ROUTE_PTS[ROUTE_PTS.length - 1]

  return (
    <svg
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id="rmb-fade" cx="0.6" cy="0.45" r="0.6">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="rmb-mask">
          <rect x={vx} y={vy} width={vw} height={vh} fill="url(#rmb-fade)" />
        </mask>
        <filter id="rmb-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
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
        <path
          d={PATH_D}
          className="fill-white/[0.035] stroke-plug-sky-100/25"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />

        {/* The N-5 corridor, as scenery */}
        <path
          d={HIGHWAY_D}
          fill="none"
          className="stroke-white/15"
          strokeWidth={2}
          strokeDasharray="6 7"
          strokeLinecap="round"
        />

        {/* City names */}
        {LABELS.map((name) => {
          const c = getCityCoordinates(name)
          if (!c) return null
          const at = project(c.lng, c.lat)
          return (
            <g key={name}>
              <circle cx={at.x} cy={at.y} r={2.4} className="fill-white/30" />
              <text x={at.x + 8} y={at.y + 4} className="fill-white/35 text-[14px] font-medium">
                {name}
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

        {/* The planned leg, lit */}
        <path
          d={ROUTE_D}
          fill="none"
          className="stroke-plug-cyan-400"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.45}
          filter="url(#rmb-glow)"
        />
        <path
          d={ROUTE_D}
          fill="none"
          className="stroke-plug-cyan-300"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {start && <circle cx={start.x} cy={start.y} r={5} className="fill-emerald-400" />}
        {end && <circle cx={end.x} cy={end.y} r={5} className="fill-white" />}
      </g>
    </svg>
  )
}

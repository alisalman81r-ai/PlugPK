// src/components/route/RouteMap.tsx
'use client'

import * as React from 'react'

import { PATH_D, project } from '@/components/home/PakistanMap'
import type { PlannedTrip } from '@/hooks/useRoutePlanner'
import { getCityCoordinates } from '@/lib/city-coordinates'
import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface RouteMapProps {
  trip: PlannedTrip
  /** Every listed charger, drawn faintly so the stops read against the network. */
  stations?: Station[]
  className?: string
}

type Pt = { x: number; y: number }

const BOLT = 'M13.5 2 4 14h7l-1.5 8L20 10h-7z'

/**
 * The journey on a map of Pakistan (landing-v2 .rmapc): the start, the
 * charging stops and the destination joined by straight lines, zoomed to the
 * trip, with the other listed chargers as faint dots.
 *
 * Straight lines, and labelled so: the planner's distances come from a table
 * of road distances between cities, but nothing here routes along a road. The
 * positions are real — city centres and the stations' own coordinates — and
 * every figure beside the map comes from the same plan as the timeline.
 */
export function RouteMap({ trip, stations = [], className }: RouteMapProps) {
  const { plan } = trip
  const unreachable = plan.status === 'unreachable'
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')

  const a = getCityCoordinates(trip.origin)
  const b = getCityCoordinates(trip.destination)

  const geo = React.useMemo(() => {
    if (!a || !b) return null
    const A = project(a.lng, a.lat)
    const B = project(b.lng, b.lat)
    const stops = plan.stops.map((s) => ({
      p: project(s.station.coordinates.lng, s.station.coordinates.lat),
      order: s.order,
    }))
    const all: Pt[] = [A, B, ...stops.map((s) => s.p)]
    const minX = Math.min(...all.map((p) => p.x))
    const maxX = Math.max(...all.map((p) => p.x))
    const minY = Math.min(...all.map((p) => p.y))
    const maxY = Math.max(...all.map((p) => p.y))
    const span = Math.max(maxX - minX, maxY - minY)
    const side = Math.max(240, span * 1.45 + 60)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const x0 = cx - side / 2
    const y0 = cy - side / 2
    return { A, B, stops, x0, y0, side, r: side / 520 }
  }, [a, b, plan.stops])

  return (
    <aside
      data-rt-in=""
      aria-label="Route map"
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-ink p-4 text-white sm:rounded-[32px] sm:p-[22px]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[length:44px_44px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-[200px] -z-[1] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)]"
      />

      <div className="flex items-center justify-between gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        <span>Straight-line map</span>
        <b className="font-semibold text-volt">{trip.totalDistanceKm.toLocaleString('en-PK')} km</b>
      </div>

      {geo ? (
        <svg
          viewBox={`${geo.x0.toFixed(1)} ${geo.y0.toFixed(1)} ${geo.side.toFixed(1)} ${geo.side.toFixed(1)}`}
          role="img"
          aria-label={`Straight-line map of ${trip.origin} to ${trip.destination}${
            plan.stops.length > 0
              ? ` with ${plan.stops.length} charging stop${plan.stops.length === 1 ? '' : 's'}`
              : ''
          }`}
          className="mt-2.5 block h-auto w-full overflow-hidden rounded-[18px]"
        >
          <defs>
            <pattern id={`dots-${uid}`} width={14 * geo.r} height={14 * geo.r} patternUnits="userSpaceOnUse">
              <circle cx={7 * geo.r} cy={7 * geo.r} r={1.4 * geo.r} fill="rgba(212,255,58,.22)" />
            </pattern>
          </defs>
          <rect x={geo.x0} y={geo.y0} width={geo.side} height={geo.side} fill="#0B0C0E" />
          <path
            d={PATH_D}
            fill="#121519"
            stroke="rgba(212,255,58,.4)"
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
          <path d={PATH_D} fill={`url(#dots-${uid})`} />

          {stations.map((station) => {
            const p = project(station.coordinates.lng, station.coordinates.lat)
            return <circle key={station.id} cx={p.x} cy={p.y} r={4 * geo.r} fill="rgba(212,255,58,.35)" />
          })}

          {/* As the crow flies, then the plan's own path through its stops. */}
          <line
            x1={geo.A.x}
            y1={geo.A.y}
            x2={geo.B.x}
            y2={geo.B.y}
            stroke="rgba(255,255,255,.22)"
            strokeWidth={2}
            strokeDasharray="4 8"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            data-rt-route=""
            points={[geo.A, ...geo.stops.map((s) => s.p), ...(unreachable ? [] : [geo.B])]
              .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke={unreachable ? '#FF5A1F' : '#D4FF3A'}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{
              filter: unreachable
                ? 'drop-shadow(0 0 6px rgba(255,90,31,.6))'
                : 'drop-shadow(0 0 6px rgba(212,255,58,.7))',
            }}
          />

          <circle cx={geo.A.x} cy={geo.A.y} r={11 * geo.r} fill="#35D07F" stroke="#0B0C0E" strokeWidth={4 * geo.r} />
          <circle cx={geo.B.x} cy={geo.B.y} r={11 * geo.r} fill="#FF5A1F" stroke="#0B0C0E" strokeWidth={4 * geo.r} />
          {unreachable ? (
            <g data-rt-x="" stroke="#0B0C0E" strokeWidth={3 * geo.r} strokeLinecap="round">
              <path
                d={`M${geo.B.x - 4.5 * geo.r} ${geo.B.y - 4.5 * geo.r}l${9 * geo.r} ${9 * geo.r}M${geo.B.x + 4.5 * geo.r} ${geo.B.y - 4.5 * geo.r}l${-9 * geo.r} ${9 * geo.r}`}
              />
            </g>
          ) : null}

          {geo.stops.map(({ p, order }) => (
            <g key={order} data-rt-stop="">
              <circle cx={p.x} cy={p.y} r={22 * geo.r} fill="rgba(212,255,58,.18)" />
              <circle cx={p.x} cy={p.y} r={14 * geo.r} fill="#0B0C0E" stroke="#D4FF3A" strokeWidth={4 * geo.r} />
              <path
                d={BOLT}
                fill="#D4FF3A"
                transform={`translate(${p.x - 8 * geo.r} ${p.y - 8 * geo.r}) scale(${(16 * geo.r) / 24})`}
              />
            </g>
          ))}

          <MapLabel p={geo.A} r={geo.r} x0={geo.x0} side={geo.side} other={geo.B}>
            {trip.origin}
          </MapLabel>
          <MapLabel p={geo.B} r={geo.r} x0={geo.x0} side={geo.side} other={geo.A}>
            {trip.destination}
          </MapLabel>
        </svg>
      ) : (
        <p className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60">
          We do not have map positions for these cities, so the map is left out. The plan beside it is unaffected.
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-white/60">
        <LegendDot className="bg-[#35D07F]">Start</LegendDot>
        <LegendDot className="bg-ember">Destination</LegendDot>
        <LegendDot className="bg-ink shadow-[0_0_0_2px_#D4FF3A]">Charging stop</LegendDot>
        <LegendDot className="bg-[rgba(212,255,58,.45)]">Listed charger</LegendDot>
      </div>
    </aside>
  )
}

function LegendDot({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[7px]">
      <i aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', className)} />
      {children}
    </span>
  )
}

/** A city name beside its marker, on the side away from the other end. */
function MapLabel({
  p,
  other,
  r,
  x0,
  side,
  children,
}: {
  p: Pt
  other: Pt
  r: number
  x0: number
  side: number
  children: React.ReactNode
}) {
  const fontSize = 17 * r
  // Left of the marker when the other end lies to the right, or near the edge.
  const left = other.x > p.x ? p.x - x0 > side * 0.3 : p.x - x0 > side * 0.7
  const dy = Math.abs(other.y - p.y) < 30 * r ? -20 * r : 0
  return (
    <text
      x={left ? p.x - 18 * r : p.x + 18 * r}
      y={p.y + fontSize * 0.35 + dy}
      textAnchor={left ? 'end' : 'start'}
      fontSize={fontSize}
      fontWeight={600}
      fill="#fff"
      stroke="#0B0C0E"
      strokeWidth={5 * r}
      strokeLinejoin="round"
      style={{ paintOrder: 'stroke' }}
    >
      {children}
    </text>
  )
}

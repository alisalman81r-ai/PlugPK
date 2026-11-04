// src/components/admin/LiveNetwork.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { PK_PATH } from '@/components/home/v2/pk-geo'
import type { NetworkHealth } from '@/lib/db/network-health'
import { gsap, prefersReduced } from '@/lib/gsap'
import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'
import { CountUp } from './admin-motion'
import { InfoHint } from './InfoHint'

/**
 * The dark hero of the dashboard (the design's `.card.ink.net`): the free-port
 * figure, a bar of every port, the stations by state, and a map of Pakistan
 * with a volt pin per city.
 *
 * The states are the product's — available, limited, offline, unknown — so
 * the four tiles always add up to the total. Port availability is the figure
 * that changes minute to minute, so it gets the big number and the bar.
 *
 * The bar draws one cell per port (volt = free, hatched = on a connector that
 * is not reporting), scaled down to 48 cells on a large network so it still
 * reads as a bar; its cells rise in with the design's springy stagger.
 */

export interface CityPin {
  city: string
  count: number
  /** Position in the 1000 x 811 map frame. */
  x: number
  y: number
}

const MAX_CELLS = 48

function cells(total: number, free: number, unknown: number) {
  if (total <= 0) return [] as ('on' | 'q' | '')[]
  const n = Math.min(total, MAX_CELLS)
  const scale = n / total
  const on = Math.round(free * scale)
  const q = Math.min(n - on, Math.round(unknown * scale))
  return Array.from({ length: n }, (_, i) => (i < on ? 'on' : i >= n - q ? 'q' : '')) as ('on' | 'q' | '')[]
}

export function LiveNetwork({
  health,
  cities = [],
  unknownPorts = 0,
  help,
  index = 2,
  className,
}: {
  health: NetworkHealth
  /** Published stations per city, placed on the map. */
  cities?: CityPin[]
  /** Ports on connectors whose state is unknown, drawn hatched. */
  unknownPorts?: number
  help?: React.ReactNode
  index?: number
  className?: string
}) {
  const { stations, ports, connectors } = health
  const pct = ports.availablePct
  const portsRef = React.useRef<HTMLDivElement>(null)
  const clip = React.useId().replace(/:/g, '')

  React.useEffect(() => {
    const box = portsRef.current
    if (!box || prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.from(box.children, { scaleY: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.025, delay: 0.4 })
    }, box)
    return () => ctx.revert()
  }, [ports.total, ports.available])

  const states = [
    { label: 'Online', value: stations.online, dot: 'dot--ok' },
    { label: 'Limited', value: stations.limited, dot: 'dot--blue' },
    { label: 'Offline', value: stations.offline, dot: 'dot--bad' },
    { label: 'Unconfirmed', value: stations.unknown, dot: '' },
  ]

  return (
    <section
      className={cn('card ink net', className)}
      data-in
      style={{ '--i': index } as React.CSSProperties}
      aria-labelledby="net-h"
    >
      <div className="net__left">
        <div className="chead" style={{ padding: 0 }}>
          <div>
            <h2 id="net-h">
              Live network
              {help ? <InfoHint label="Live network">{help}</InfoHint> : null}
            </h2>
            <p>Counted from published stations, right now.</p>
          </div>
          <Link className="link" href="/admin/stations" style={{ whiteSpace: 'nowrap' }}>
            All stations
            <AdmIcon name="arrow" />
          </Link>
        </div>

        <div className="net__big">
          <b>
            <CountUp value={ports.available} />
          </b>
          <span>/ {ports.total}</span>
        </div>
        <p className="net__cap">{pct === null ? 'No ports recorded yet' : `${pct.toFixed(1)}% of ports free right now`}</p>
        <div
          className="ports"
          ref={portsRef}
          role="img"
          aria-label={pct === null ? 'No ports recorded' : `${ports.available} of ${ports.total} ports available`}
        >
          {cells(ports.total, ports.available, unknownPorts).map((state, i) => (
            <i key={i} className={state || undefined} />
          ))}
        </div>

        <div className="states">
          {states.map((state) => (
            <Link key={state.label} className="state" href="/admin/stations">
              <span>
                <i className={cn('dot', state.dot)} aria-hidden="true" />
                {state.label}
              </span>
              <b>
                <CountUp value={state.value} />
              </b>
            </Link>
          ))}
        </div>
        <p className="net__foot mono">
          {stations.total} {stations.total === 1 ? 'station' : 'stations'} · {connectors.total}{' '}
          {connectors.total === 1 ? 'connector' : 'connectors'}
          {connectors.offline > 0 ? <span className="net__warn"> · {connectors.offline} offline</span> : null}
        </p>
      </div>

      <div
        className="net__map"
        role="img"
        aria-label={
          cities.length
            ? `Stations by city: ${cities.map((c) => `${c.city} ${c.count}`).join(', ')}`
            : 'Map of Pakistan: no published stations yet'
        }
      >
        <svg viewBox="200 0 800 811" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <clipPath id={`pkc${clip}`}>
              <path d={PK_PATH} />
            </clipPath>
            <pattern id={`pkd${clip}`} width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="6" r="1.3" fill="rgba(212,255,58,.22)" />
            </pattern>
          </defs>
          <path d={PK_PATH} fill="rgba(212,255,58,.03)" />
          <rect width="1000" height="811" fill={`url(#pkd${clip})`} clipPath={`url(#pkc${clip})`} />
          <path d={PK_PATH} fill="none" stroke="#D4FF3A" strokeOpacity=".7" strokeWidth="1.8" strokeLinejoin="round" />
          {cities.map((pin, k) => (
            <g key={pin.city} transform={`translate(${pin.x} ${pin.y})`}>
              <circle className="pin-pulse" r="26" fill="rgba(212,255,58,.35)" style={{ animationDelay: `${k * 0.6}s` }} />
              <circle r="22" fill="#D4FF3A" style={{ filter: 'drop-shadow(0 0 12px rgba(212,255,58,.8))' }} />
              <text className="pin-n" textAnchor="middle" dy="7">
                {pin.count}
              </text>
              <text className="pin-lab" x="34" dy="10">
                {pin.city}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}

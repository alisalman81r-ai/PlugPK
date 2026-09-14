// src/components/home/JourneyCards.tsx

import { MapPin, Route, Zap } from 'lucide-react'

import { FAST_CHARGER_KW, type HeroMapPin } from '@/lib/charging'
import { estimateDriveMinutes, getRoadDistanceKm } from '@/lib/route-distances'

/**
 * The cards floating around the silhouette.
 *
 * ── They say true things now ──────────────────────────────────────────
 *
 * These were three fixed captions — "Fast charging", "Route ready", "Live
 * network" — decorative furniture that annotated the map without describing
 * it. The design they are being brought toward puts real readings there: a
 * charger's power and free ports, a journey's length and time.
 *
 * So they read from the same station rows the dots are drawn from. The card
 * naming a station names one that exists, at a power it actually delivers,
 * with the ports that are actually free.
 *
 * What is NOT copied from that design is its arithmetic. It labels a route
 * "2 charging stops", and this route has none to offer — the planner finds no
 * charger in the corridor between those two cities, which is a fact about
 * coverage rather than a gap to paper over. The card states the distance and
 * the drive, both of which are real, and claims no stops it cannot place.
 *
 * ── Still decorative to a screen reader ───────────────────────────────
 *
 * aria-hidden, as before. Every figure here is available in a readable form on
 * /map and the station pages; repeating it over an already-decorative map
 * would make the hero announce the same numbers three times.
 *
 * No scroll binding, no ScrollTrigger, no progress. The drift is three CSS
 * keyframes at different periods so they never beat together, and it stops
 * entirely under prefers-reduced-motion.
 */

interface CardProps {
  icon: React.ReactNode
  title: string
  detail: string
  /** A third line, for a reading that deserves its own colour. */
  note?: string
  noteTone?: 'good' | 'muted'
  /** Overrides the icon tile's colour, for the green "standard" reading. */
  iconTone?: 'blue' | 'green'
  className?: string
}

function Card({ icon, title, detail, note, noteTone = 'muted', iconTone = 'blue', className }: CardProps) {
  return (
    <div
      aria-hidden="true"
      className={
        'pointer-events-none absolute flex items-center gap-2.5 rounded-xl border border-slate-200/90 ' +
        'bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.28)] backdrop-blur-[2px] ' +
        (className ?? '')
      }
    >
      <span
        className={
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' +
          (iconTone === 'green'
            ? 'bg-green-50 text-green-600'
            : 'bg-plug-blue-50 text-plug-blue-600')
        }
      >
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[12.5px] font-semibold text-plug-navy-900">{title}</span>
        <span className="text-[11px] font-medium text-slate-500">{detail}</span>
        {note ? (
          <span
            className={
              'mt-0.5 text-[11px] font-semibold ' +
              (noteTone === 'good' ? 'text-green-600' : 'text-slate-400')
            }
          >
            {note}
          </span>
        ) : null}
      </span>
    </div>
  )
}

export interface JourneyCardsProps {
  pins: readonly HeroMapPin[]
}

export function JourneyCards({ pins }: JourneyCardsProps) {
  // The fastest station carries the power card; the one with the most free
  // ports carries the station card. Two different rows wherever possible, so
  // the map is not annotated twice with the same place.
  const byPower = [...pins].sort((a, b) => b.maxPowerKw - a.maxPowerKw)
  const headline = byPower[0]
  const spotlight = byPower.find((p) => p.slug !== headline?.slug && p.availablePorts > 0) ?? byPower[1]

  const routeKm = getRoadDistanceKm('Karachi', 'Lahore')
  const routeMinutes = routeKm !== null ? estimateDriveMinutes(routeKm) : null

  return (
    <>
      {/*
        Card A — high on the left, over the northern coast.
        Hidden below `sm`: on a phone the map is small enough that three
        cards would cover more of the country than they annotate.
      */}
      {headline ? (
        <Card
          icon={<Zap size={14} aria-hidden="true" />}
          iconTone={headline.maxPowerKw >= FAST_CHARGER_KW ? 'green' : 'blue'}
          title={`${Math.round(headline.maxPowerKw)} kW`}
          detail={
            headline.maxPowerKw >= FAST_CHARGER_KW
              ? `Fast charger · ${headline.ports} ${headline.ports === 1 ? 'port' : 'ports'}`
              : `Standard · ${headline.ports} ${headline.ports === 1 ? 'port' : 'ports'}`
          }
          note={headline.availablePorts > 0 ? 'Available' : 'All in use'}
          noteTone={headline.availablePorts > 0 ? 'good' : 'muted'}
          className="journey-float-a left-[4%] top-[6%] hidden sm:flex lg:left-[1%] lg:top-[7%]"
        />
      ) : null}

      {/*
        Card B — low on the left, against Balochistan's coast. The one card
        shown at every width, because it is the furthest from the route.

        Inset from the edge rather than flush to it: at left-0 the panel is
        full-bleed below lg, so the card sat hard against the viewport and
        its icon was clipped at both 820 and 390.
      */}
      <Card
        icon={<Route size={14} aria-hidden="true" />}
        title="Karachi → Lahore"
        detail={
          routeKm !== null && routeMinutes !== null
            ? `${routeKm.toLocaleString('en-PK')} km · ~${Math.floor(routeMinutes / 60)}h ${routeMinutes % 60}m`
            : 'Plan charging stops'
        }
        className="journey-float-b bottom-[16%] left-[4%] lg:bottom-auto lg:left-auto lg:right-[1%] lg:top-[46%]"
      />

      {/*
        Card C — low right, clear of the route's southern leg. Dropped below
        `lg`: at 820 and under it collides with the road.
      */}
      {spotlight ? (
        <Card
          icon={<MapPin size={14} aria-hidden="true" />}
          title={spotlight.name}
          detail={`${spotlight.city} · ${Math.round(spotlight.maxPowerKw)} kW`}
          note={`${spotlight.availablePorts}/${spotlight.ports} available`}
          noteTone={spotlight.availablePorts > 0 ? 'good' : 'muted'}
          className="journey-float-c bottom-[6%] right-[1%] hidden lg:flex"
        />
      ) : null}
    </>
  )
}

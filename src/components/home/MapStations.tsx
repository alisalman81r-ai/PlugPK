// src/components/home/MapStations.tsx

import { FAST_CHARGER_KW, type HeroMapPin } from '@/lib/charging'
import { project } from './PakistanMap'
import { PIN_BOLT_D, PIN_D } from './station-pin'

/**
 * The real charging network, drawn on the silhouette.
 *
 * ── Every dot is a station somebody can drive to ──────────────────────
 *
 * The design this follows shows roughly forty dots scattered across the
 * country and labels Karachi with 48 chargers. Those are a mockup's dots.
 * Drawing them would put charging points on a map of Pakistan that do not
 * exist — which this project has a standing rule against, and which is the one
 * failure an EV charging product cannot afford: somebody plans a journey around
 * a pin and arrives at nothing.
 *
 * So the composition is the design's and the pins are the database's. Today
 * that is six stations in three cities. The map will fill as the data does,
 * and every dot on it will mean something.
 *
 * ── Placed through the same projection as everything else ─────────────
 *
 * `project()` is what drew the coastline and what places the highway, so a
 * station at a given lat/lng lands where that lat/lng actually is on this
 * silhouette. Nothing here carries its own coordinates.
 */

/** Blue is a charger you stop at, green one you wait at. Stated in the legend. */
function isFast(pin: HeroMapPin): boolean {
  return pin.maxPowerKw >= FAST_CHARGER_KW
}

export interface MapStationsProps {
  pins: readonly HeroMapPin[]
  /** Cities to label with a count, largest first. */
  cityCounts: Record<string, number>
}

/**
 * Where a city's label sits relative to its pin.
 *
 * Hand-placed rather than computed: three labels on a country this shape have
 * only a few positions where they do not collide with the route, the coast or
 * each other, and a layout algorithm for three known cases is more code and
 * less certainty than naming them.
 */
const LABEL_OFFSET: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  Islamabad: { dx: 26, dy: -18, anchor: 'start' },
  Lahore: { dx: 30, dy: 6, anchor: 'start' },
  Karachi: { dx: -30, dy: 26, anchor: 'end' },
}

export function MapStations({ pins, cityCounts }: MapStationsProps) {
  // One pin per city carries the label: the northern-most, so the marker sits
  // clear of the others in the same city rather than on top of them.
  const labelled = new Map<string, HeroMapPin>()
  for (const pin of pins) {
    const held = labelled.get(pin.city)
    if (!held || pin.lat > held.lat) labelled.set(pin.city, pin)
  }

  return (
    <g data-layer="stations-real">
      {/*
        The label cards' shadow. It used to be defined in the journey layer,
        which no longer exists — and a filter reference that resolves to
        nothing does not degrade to "no shadow", it stops the element being
        rendered at all. It belongs to the thing that uses it.
      */}
      <defs>
        <filter id="station-card-shadow" x="-30%" y="-40%" width="160%" height="190%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.13" />
        </filter>
      </defs>
      {/*
        The dots. Drawn over the highway, which is rendered before this in the
        SVG, so a station is never hidden under the road that runs past it.
      */}
      {pins.map((pin) => {
        const at = project(pin.lng, pin.lat)
        const fast = isFast(pin)
        return (
          <g key={pin.slug} className="[transform-box:fill-box] origin-center scale-[1.4] sm:scale-[1.2] lg:scale-100">
            {/* A soft halo, so a dot reads against both the pale surface and
                the darker side wall without needing a heavier fill. */}
            <circle
              cx={at.x}
              cy={at.y}
              r={11}
              className={fast ? 'fill-plug-blue-500' : 'fill-green-500'}
              opacity={0.16}
            />
            <circle cx={at.x} cy={at.y} r={5.6} className="fill-white" />
            <circle
              cx={at.x}
              cy={at.y}
              r={3.6}
              className={fast ? 'fill-plug-blue-600' : 'fill-green-600'}
            />
          </g>
        )
      })}

      {/*
        City markers: a teardrop with a bolt, and the count beside it.

        The count is the number of stations that city actually holds. A city
        with one says "1 charger" rather than being rounded up into a plural.
      */}
      {[...labelled.entries()].map(([city, pin]) => {
        const at = project(pin.lng, pin.lat)
        const offset = LABEL_OFFSET[city]
        if (!offset) return null
        const count = cityCounts[city] ?? 0

        return (
          <g
            key={city}
            className="[transform-box:fill-box] origin-center scale-[1.35] sm:scale-[1.15] lg:scale-100"
          >
            {/* The teardrop, drawn from the pin point upward. */}
            <g transform={`translate(${at.x} ${at.y})`}>
              <path d={PIN_D} className="fill-plug-blue-600" />
              {/* A bolt, small enough to read as a mark rather than an icon. */}
              <path d={PIN_BOLT_D} className="fill-white" />
            </g>

            {/* The label card. Drawn in SVG so it stays locked to the pin
                through every resize rather than being positioned in CSS. */}
            <g transform={`translate(${at.x + offset.dx} ${at.y + offset.dy})`}>
              <rect
                x={offset.anchor === 'end' ? -132 : 0}
                y={-21}
                width={132}
                height={46}
                rx={9}
                className="fill-white stroke-slate-200"
                strokeWidth={1.2}
                filter="url(#station-card-shadow)"
              />
              <text
                x={offset.anchor === 'end' ? -117 : 15}
                y={-5}
                className="fill-plug-navy-900 text-[14px] font-bold"
              >
                {city}
              </text>
              <text
                x={offset.anchor === 'end' ? -117 : 15}
                y={13}
                className="fill-slate-500 text-[12px] tabular-nums"
              >
                {count} {count === 1 ? 'charger' : 'chargers'}
              </text>
            </g>
          </g>
        )
      })}
    </g>
  )
}

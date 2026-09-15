// src/components/home/highway.ts

/**
 * The highway spine the hero map draws, as one smooth path.
 *
 * ── What this line is ─────────────────────────────────────────────────
 *
 * The N-5 corridor: Karachi up through Sindh and south Punjab to Lahore, then
 * north-west to Islamabad. It is drawn by joining the real centres of the
 * cities that corridor actually passes through, so the line lands on the
 * silhouette where those cities are rather than where a curve looked good.
 *
 * It is a *corridor*, not a route. It says "the country's main road runs
 * roughly here"; it does not say which lane, and nothing should read a
 * distance or a driving time off it. The legend calls it a major highway for
 * that reason — it is scenery, not navigation.
 *
 * ── Why it replaced the animated route ────────────────────────────────
 *
 * The map used to carry a scrubbed GSAP timeline: a car drove this line, an
 * invented charger lit up half way along, and a popup counted a battery up.
 * That is gone. What is left is the part that was true — that there is a road
 * between the three cities we have stations in — drawn once and held still.
 *
 * ── Placed through the same projection as everything else ─────────────
 *
 * `project()` drew the coastline and places every station dot, so a city at a
 * given lat/lng lands in one place on this map and one only. Nothing here
 * carries its own coordinates.
 */

import { getCityCoordinates } from '@/lib/city-coordinates'
import { project } from './PakistanMap'

/**
 * The corridor, south to north.
 *
 * Every name resolves through `getCityCoordinates`; one that does not is
 * dropped rather than guessed, which is why the path is built from whatever
 * survives the lookup instead of from a fixed-length tuple.
 */
const CORRIDOR = [
  'karachi',
  'hyderabad',
  'sukkur',
  'rahim yar khan',
  'multan',
  'lahore',
  'gujranwala',
  'jhelum',
  'islamabad',
] as const

interface Pt {
  x: number
  y: number
}

const POINTS: Pt[] = CORRIDOR.map(getCityCoordinates)
  .filter((c): c is NonNullable<typeof c> => c !== null)
  .map((c) => project(c.lng, c.lat))

/**
 * Catmull-Rom through the points, converted to cubic beziers.
 *
 * A polyline through nine city centres reads as a folded wire; the corridor it
 * stands for is a road. Tension is low on purpose — at 1 the curve bulges past
 * the cities it is supposed to run through, and near Sukkur that pushed the
 * line off the land and into the Thar.
 */
const TENSION = 0.5

function smooth(pts: readonly Pt[]): string {
  const first = pts[0]
  if (!first || pts.length < 2) return ''

  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p0 = pts[i - 1] ?? p1
    const p3 = pts[i + 2] ?? p2

    const c1x = p1.x + ((p2.x - p0.x) / 6) * TENSION
    const c1y = p1.y + ((p2.y - p0.y) / 6) * TENSION
    const c2x = p2.x - ((p3.x - p1.x) / 6) * TENSION
    const c2y = p2.y - ((p3.y - p1.y) / 6) * TENSION

    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/** The corridor as an SVG path. The only place this geometry is defined. */
export const HIGHWAY_D = smooth(POINTS)

/**
 * The junctions drawn along the road, excluding its two ends.
 *
 * The ends are Karachi and Islamabad, which already carry a labelled station
 * pin — a ring under a pin is just noise. These are road junctions and are
 * drawn in the road's own colour, never a station colour, so that no dot on
 * this map means "charger" unless it came from the database.
 */
export const HIGHWAY_JUNCTIONS: readonly Pt[] = POINTS.slice(1, -1)

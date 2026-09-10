// src/components/home/journey.ts

import { project } from './PakistanMap'

/**
 * The Faisalabad -> Islamabad journey: where it runs, and the one piece of
 * geometry everything else reads from.
 *
 * ── The problem this module exists to solve ───────────────────────────
 *
 * Measured on the real projection: Faisalabad (636.1, 342.0) and Islamabad
 * (631.6, 207.9) are 134 units apart on an 852-unit-tall map. That is 15.7% of
 * the height — a journey the eye reads as two dots near each other in Punjab,
 * and far too short for a car to be watched travelling it.
 *
 * The brief asks for 35-50%. Nothing about the drawing can fix that: the
 * distance is the distance. Either the map is cropped to Punjab, which was
 * ruled out, or the journey is composed larger than life on top of an
 * undistorted country.
 *
 * ── The transform, stated plainly ─────────────────────────────────────
 *
 * Both cities are pushed apart from their shared midpoint by EXPANSION. The
 * midpoint, the bearing between them and their order are all preserved:
 * Faisalabad stays south, Islamabad stays north and very slightly west, which
 * is the true relationship.
 *
 * What it costs, in plain terms: at 2.35x each city sits about 175km from
 * where it really is, along the line joining them. Islamabad is drawn up
 * toward Gilgit-Baltistan and Faisalabad down toward Bahawalpur. Both remain
 * inside Pakistan and on the correct side of each other, but this is an
 * illustration of a journey, not a map of one.
 *
 * Scaling about the MIDPOINT rather than anchoring one end is deliberate —
 * it splits that error in half between the two cities instead of leaving one
 * correct and moving the other twice as far.
 *
 * ── One source of truth ───────────────────────────────────────────────
 *
 * ROUTE_D is the only route geometry in the codebase. The charging stop and
 * the car are not placed with their own coordinates; they are read off that
 * curve by arc-length fraction through `pointAt()`, which is the same thing
 * `getPointAtLength` would return and gives the identical answer on the
 * server, where there is no DOM to measure.
 *
 * When the animation step arrives it drives the same fractions, so the car
 * cannot stop anywhere but exactly on the charger.
 */

export interface Place {
  readonly name: string
  readonly lon: number
  readonly lat: number
}

/** Real coordinates. These stay true and are what the transform starts from. */
export const GEO = {
  origin: { name: 'Faisalabad', lon: 73.135, lat: 31.4504 },
  destination: { name: 'Islamabad', lon: 73.0479, lat: 33.6844 },
} as const satisfies Record<string, Place>

/**
 * How much larger than life the journey is drawn.
 *
 * 2.8 puts the route at 44% of the map's height, in the upper half of the
 * 35-50% asked for. 2.35 was tried first and reached 37%: correct on paper,
 * but rendered it still read as a line on a map rather than as the subject of
 * the panel, which is the test the brief actually sets.
 *
 * The ceiling is the border, not taste. With the lateral shift below, every
 * value up to 3.0 keeps all 61 sampled points on the curve inside Pakistan;
 * past that the northern end leaves the country.
 *
 * The cost, stated plainly: each city is drawn roughly 230km from where it
 * is, along the line joining them. Faisalabad sits near Rahim Yar Khan and
 * Islamabad up in Gilgit-Baltistan. The silhouette underneath is untouched.
 */
export const EXPANSION = 2.8

/**
 * How far the curve bows off the straight line, in user units.
 *
 * The true bearing is 4.5 units of east-west against 134 of north-south —
 * essentially a vertical line. Drawn straight it reads as a ruler, not a road,
 * so the curve carries all of the visual interest. Two opposed bows make one
 * shallow S: out to the east leaving Faisalabad, back to the west arriving
 * into Islamabad.
 */
const BOW = 46

/**
 * How far west the whole journey is nudged, in user units.
 *
 * Not a taste decision. At 2.35x with no shift, Faisalabad is drawn at
 * 73.19E / 29.94N — and Pakistan's eastern border at that latitude is at
 * 73.05E, so the origin marker landed in India. Caught by point-in-polygon
 * against the same boundary the silhouette is drawn from, not by looking.
 *
 * -60 units is about 1.16 degrees, roughly 105km. It is the furthest west the
 * journey can go with all 41 sampled points on the curve still inside the
 * country — at -80 the upper half crosses into Afghanistan.
 *
 * It exists for composition as much as for the border. Measured in the
 * browser, the route's centre sat 132px right of the map's centre before this;
 * Punjab really is in eastern Pakistan, so the journey can never be centred,
 * but hard against the edge left no room for the Islamabad labels and read as
 * an afterthought pinned to the side.
 */
const LATERAL_SHIFT = -60

const geoOrigin = project(GEO.origin.lon, GEO.origin.lat)
const geoDestination = project(GEO.destination.lon, GEO.destination.lat)

/** The midpoint both cities are pushed away from. */
const MID = {
  x: (geoOrigin.x + geoDestination.x) / 2,
  y: (geoOrigin.y + geoDestination.y) / 2,
}

const expand = (p: { x: number; y: number }) => ({
  x: MID.x + (p.x - MID.x) * EXPANSION + LATERAL_SHIFT,
  y: MID.y + (p.y - MID.y) * EXPANSION,
})

/** Where the cities are actually drawn. */
export const ORIGIN = expand(geoOrigin)
export const DESTINATION = expand(geoDestination)

// ── The route ─────────────────────────────────────────────────────────

const axis = { x: DESTINATION.x - ORIGIN.x, y: DESTINATION.y - ORIGIN.y }
const axisLength = Math.hypot(axis.x, axis.y)
/** Unit normal to the journey, so the bow is always across it, never along. */
const normal = { x: -axis.y / axisLength, y: axis.x / axisLength }

const C1 = {
  x: ORIGIN.x + axis.x * 0.34 + normal.x * BOW,
  y: ORIGIN.y + axis.y * 0.34 + normal.y * BOW,
}
const C2 = {
  x: ORIGIN.x + axis.x * 0.66 - normal.x * BOW,
  y: ORIGIN.y + axis.y * 0.66 - normal.y * BOW,
}

/** The authoritative route. Nothing else may define route geometry. */
export const ROUTE_D =
  `M ${ORIGIN.x.toFixed(2)} ${ORIGIN.y.toFixed(2)} ` +
  `C ${C1.x.toFixed(2)} ${C1.y.toFixed(2)}, ` +
  `${C2.x.toFixed(2)} ${C2.y.toFixed(2)}, ` +
  `${DESTINATION.x.toFixed(2)} ${DESTINATION.y.toFixed(2)}`

/** Cubic Bézier evaluation. */
function bezier(t: number) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * ORIGIN.x + b * C1.x + c * C2.x + d * DESTINATION.x,
    y: a * ORIGIN.y + b * C1.y + c * C2.y + d * DESTINATION.y,
  }
}

/**
 * Arc-length lookup, built once.
 *
 * A cubic's parameter t is not proportional to distance along it — the curve
 * moves faster through the middle — so evaluating at t=0.5 does not land
 * halfway along the road. A charging stop placed that way would sit off the
 * point the car later stops at, which is precisely the bug the brief warns
 * about. 400 samples over ~330 units is finer than a unit per step.
 */
const SAMPLES = 400
const LUT: { t: number; len: number }[] = (() => {
  const table = [{ t: 0, len: 0 }]
  let prev = bezier(0)
  let total = 0
  for (let i = 1; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES
    const p = bezier(t)
    total += Math.hypot(p.x - prev.x, p.y - prev.y)
    table.push({ t, len: total })
    prev = p
  }
  return table
})()

/** Total route length in user units. */
export const ROUTE_LENGTH = LUT[LUT.length - 1]!.len

/**
 * The point and heading at `fraction` of the route's LENGTH, 0..1.
 *
 * Equivalent to `path.getPointAtLength(fraction * getTotalLength())`, but
 * computed from the same curve definition so it works during server render
 * and cannot drift from what the browser measures.
 */
export function pointAt(fraction: number): { x: number; y: number; angle: number } {
  const clamped = Math.min(Math.max(fraction, 0), 1)
  const target = clamped * ROUTE_LENGTH

  let i = 1
  while (i < LUT.length && LUT[i]!.len < target) i += 1
  const lo = LUT[i - 1]!
  const hi = LUT[i] ?? lo
  const span = hi.len - lo.len
  const t = span > 0 ? lo.t + ((target - lo.len) / span) * (hi.t - lo.t) : lo.t

  const here = bezier(t)
  // Heading from a short span rather than the derivative: a cubic's derivative
  // is zero at an endpoint whose control point coincides with it, and
  // atan2(0, 0) is 0 — the car would snap flat at the two most visible moments.
  const back = bezier(Math.max(t - 0.01, 0))
  const fwd = bezier(Math.min(t + 0.01, 1))

  return {
    x: here.x,
    y: here.y,
    angle: (Math.atan2(fwd.y - back.y, fwd.x - back.x) * 180) / Math.PI,
  }
}

/**
 * Where things sit along the route, as fractions of its length.
 *
 * The charger is at the halfway point so the two drives are equal — the brief
 * asks for 45-55%, and dead centre is the value that makes "drive, charge,
 * drive" read as balanced rather than as a long leg and a short one.
 *
 * The car is parked at 24% for this static composition: far enough from
 * Faisalabad to have visibly set off, far enough from the charger not to
 * crowd it.
 */
export const CHARGER_AT = 0.5
export const CAR_AT = 0.24

export const CHARGER = pointAt(CHARGER_AT)
export const CAR = pointAt(CAR_AT)

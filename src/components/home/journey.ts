// src/components/home/journey.ts

import { project } from './PakistanMap'

/**
 * The EV journey across Pakistan: where it runs, and the one piece of geometry
 * everything else reads from.
 *
 * ── Anonymous by design ───────────────────────────────────────────────
 *
 * This was Faisalabad -> Islamabad, with the two cities pushed 2.8x apart to
 * make a watchable route. That bought length at the cost of drawing two named
 * cities roughly 230km from where they actually are — and the labels then
 * announced the error to the reader.
 *
 * The waypoints below name nothing. They are art direction: a journey from the
 * lower-central interior to the northern interior, chosen for composition and
 * checked against the border. Nothing on the map claims to be a particular
 * place, so nothing on the map can be wrong about one. The headline already
 * establishes the country.
 *
 * They are still expressed in lon/lat and pushed through the same `project()`
 * the silhouette uses. That is what makes them verifiable: every waypoint, and
 * every sampled point on the curve between them, can be tested against the
 * same boundary polygon the country is drawn from.
 *
 * ── One source of truth ───────────────────────────────────────────────
 *
 * ROUTE_D is the only route geometry in the codebase. The car, the charging
 * point and both end markers are not placed with their own coordinates — they
 * are read off that curve by arc-length fraction through `pointAt()`.
 *
 * `pointAt()` returns what `getPointAtLength` would, computed from the same
 * spline, so it gives the identical answer during server render where there is
 * no DOM to measure. The animation step drives the same fractions, so the car
 * cannot stop anywhere but exactly on the charger.
 */

/**
 * The journey, as lon/lat.
 *
 * Seven points rather than two, because the brief asks for three or four
 * gentle changes of direction and a spline needs interior points to bend
 * around. They alternate north-east and north, which gives the road its
 * stepped, travelled look instead of a ruled diagonal.
 *
 * Measured: 510 units of vertical travel against 800 units of land — 64% of
 * Pakistan's useful height, inside the 60-70% asked for — and 253 units of
 * eastward travel, so it reads as a diagonal rather than a vertical line.
 */
const WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [68.48, 26.4], // lower-central interior — the start
  [69.93, 27.65],
  [70.31, 29.32],
  [71.76, 30.48],
  [71.95, 32.15],
  [73.21, 33.4],
  [73.36, 34.9], // northern interior — the end
]

const PTS = WAYPOINTS.map(([lon, lat]) => project(lon, lat))

/**
 * Catmull-Rom through the waypoints, converted to cubic Béziers.
 *
 * Catmull-Rom because it passes THROUGH its control points — a plain Bézier
 * chain is only pulled toward them, so the road would miss the places it was
 * composed to visit. The ends are duplicated so the first and last segments
 * curve like the middle ones rather than running straight out of the
 * endpoints.
 */
const TENSION = 0.5

interface Seg {
  p0: { x: number; y: number }
  c1: { x: number; y: number }
  c2: { x: number; y: number }
  p1: { x: number; y: number }
}

const SEGMENTS: Seg[] = (() => {
  const segs: Seg[] = []
  for (let i = 0; i < PTS.length - 1; i += 1) {
    const prev = PTS[i - 1] ?? PTS[i]!
    const a = PTS[i]!
    const b = PTS[i + 1]!
    const next = PTS[i + 2] ?? b
    segs.push({
      p0: a,
      c1: {
        x: a.x + ((b.x - prev.x) / 6) * TENSION * 2,
        y: a.y + ((b.y - prev.y) / 6) * TENSION * 2,
      },
      c2: {
        x: b.x - ((next.x - a.x) / 6) * TENSION * 2,
        y: b.y - ((next.y - a.y) / 6) * TENSION * 2,
      },
      p1: b,
    })
  }
  return segs
})()

/** The authoritative route. Nothing else may define route geometry. */
export const ROUTE_D =
  `M ${PTS[0]!.x.toFixed(2)} ${PTS[0]!.y.toFixed(2)} ` +
  SEGMENTS.map(
    (s) =>
      `C ${s.c1.x.toFixed(2)} ${s.c1.y.toFixed(2)}, ` +
      `${s.c2.x.toFixed(2)} ${s.c2.y.toFixed(2)}, ` +
      `${s.p1.x.toFixed(2)} ${s.p1.y.toFixed(2)}`,
  ).join(' ')

/** A point on one segment, by that segment's own parameter. */
function onSegment(seg: Seg, t: number) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * seg.p0.x + b * seg.c1.x + c * seg.c2.x + d * seg.p1.x,
    y: a * seg.p0.y + b * seg.c1.y + c * seg.c2.y + d * seg.p1.y,
  }
}

/** A point on the whole route, by a parameter spread evenly across segments. */
function onRoute(u: number) {
  const scaled = Math.min(Math.max(u, 0), 1) * SEGMENTS.length
  const index = Math.min(Math.floor(scaled), SEGMENTS.length - 1)
  return onSegment(SEGMENTS[index]!, scaled - index)
}

/**
 * Arc-length lookup, built once.
 *
 * A cubic's parameter is not proportional to distance along it — the curve
 * moves faster through the middle of each segment — so the parameter midpoint
 * is not the halfway point of the road. A charger placed by parameter would
 * sit off the point the car later stops at, which is exactly the failure the
 * brief warns about.
 */
const SAMPLES = 600
const LUT: { u: number; len: number }[] = (() => {
  const table = [{ u: 0, len: 0 }]
  let prev = onRoute(0)
  let total = 0
  for (let i = 1; i <= SAMPLES; i += 1) {
    const u = i / SAMPLES
    const p = onRoute(u)
    total += Math.hypot(p.x - prev.x, p.y - prev.y)
    table.push({ u, len: total })
    prev = p
  }
  return table
})()

/** Total route length, in SVG user units. */
export const ROUTE_LENGTH = LUT[LUT.length - 1]!.len

/**
 * The point and heading at `fraction` of the route's LENGTH, 0..1.
 *
 * The arc-length equivalent of `path.getPointAtLength(fraction * total)`.
 */
export function pointAt(fraction: number): { x: number; y: number; angle: number } {
  const clamped = Math.min(Math.max(fraction, 0), 1)
  const target = clamped * ROUTE_LENGTH

  let i = 1
  while (i < LUT.length && LUT[i]!.len < target) i += 1
  const lo = LUT[i - 1]!
  const hi = LUT[i] ?? lo
  const span = hi.len - lo.len
  const u = span > 0 ? lo.u + ((target - lo.len) / span) * (hi.u - lo.u) : lo.u

  const here = onRoute(u)
  // Heading from a short span rather than the derivative: a cubic's derivative
  // is zero at an endpoint whose control point coincides with it, and
  // atan2(0, 0) is 0 — the car would snap flat at the most visible moments.
  const back = onRoute(Math.max(u - 0.006, 0))
  const fwd = onRoute(Math.min(u + 0.006, 1))

  return {
    x: here.x,
    y: here.y,
    angle: (Math.atan2(fwd.y - back.y, fwd.x - back.x) * 180) / Math.PI,
  }
}

/**
 * Where things sit along the route, as fractions of its LENGTH.
 *
 * CHARGE_PROGRESS is the single value the next step needs: the car stops
 * here, the charging marker sits here, and the popup is anchored here.
 * Changing this one number moves all three together, because all three read
 * it rather than carrying their own copy.
 */
export const CHARGE_PROGRESS = 0.5

/** Where the car is parked for the static composition — just under way. */
export const CAR_PROGRESS = 0.12

export const START = pointAt(0)
export const END = pointAt(1)
export const CHARGER = pointAt(CHARGE_PROGRESS)
export const CAR = pointAt(CAR_PROGRESS)

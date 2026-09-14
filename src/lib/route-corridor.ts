// src/lib/route-corridor.ts

/**
 * Which charging stations lie on the way from here to there.
 *
 * ── The problem this solves ───────────────────────────────────────────
 *
 * The planner used to shuffle every station it knew and take the first few.
 * Faisalabad to Murree could be sent to charge in Lahore, which is 120 km east
 * of that line and behind the driver. The stop list was never wrong in a way
 * arithmetic could fix, because no arithmetic was involved.
 *
 * A stop belongs on a journey when two things are true of it, and this file
 * computes both:
 *
 *   across   how far it sits to the side of the line between origin and
 *            destination. A charger 5 km off the road is on the way; one
 *            120 km off it is a different trip.
 *   along    how far through the journey it comes, as a fraction. This is
 *            what orders the stops, and what stops the planner offering one
 *            that is behind the start or past the destination.
 *
 * ── Straight lines, not roads ─────────────────────────────────────────
 *
 * This measures against the great-circle line between two cities, not the
 * road. Pakistan's motorways run reasonably directly between the cities this
 * covers, so the two rarely disagree by much — but they do disagree, and the
 * corridor is kept generous for exactly that reason.
 *
 * The cost is honest and worth stating: a station close by road but far in a
 * straight line can be missed, and one near the line but with no road to it
 * can be offered. Fixing that properly needs a routing API returning a real
 * road polyline; this is the best answer available without one, and it is a
 * large improvement on choosing at random.
 */

import type { Coordinates } from '@/lib/types'

const EARTH_RADIUS_KM = 6371

/**
 * How far to either side of the line a station may sit and still count.
 *
 * ── Sized from where Pakistan's roads actually run ────────────────────
 *
 * This is the tolerance for the gap between a straight line and a road, so it
 * was set by measuring that gap on journeys whose route is not in doubt. Every
 * figure below is the distance from the city to the straight line between the
 * two endpoints:
 *
 *   Lahore → Peshawar     Islamabad 78 km, Jhelum 66 km
 *                         Both are on the GT road. The line cuts the corner
 *                         that the road goes round.
 *   Lahore → Karachi      Multan 93 km, Sukkur 90 km
 *                         Both are on the N-5. The line crosses the Cholistan
 *                         desert, which has no road at all.
 *   Faisalabad → Murree   Islamabad 30 km, Lahore 113 km
 *                         Islamabad is on the way. Lahore is the wrong
 *                         direction, and is the case this whole file exists
 *                         to stop being offered.
 *
 * So the corridor has to reach past 93 km on a long run and stay under 113 km
 * on a 274 km one. A quarter of the journey, held between 50 and 110 km, does
 * both: 68 km for Faisalabad-Murree, 96 km for Lahore-Peshawar, 110 km for
 * Lahore-Karachi.
 *
 * A first attempt at a flat 40 km was checked and rejected — it threw away
 * Islamabad on the Peshawar run and Multan on the Karachi one, which is the
 * opposite failure to the one being fixed and just as wrong.
 */
export const MIN_CORRIDOR_KM = 50
export const MAX_CORRIDOR_KM = 110

export function corridorWidthFor(distanceKm: number): number {
  return Math.min(Math.max(distanceKm * 0.25, MIN_CORRIDOR_KM), MAX_CORRIDOR_KM)
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export interface CorridorPosition {
  /** 0 at the origin, 1 at the destination. Outside that range is off the journey. */
  along: number
  /** Kilometres to the side of the line. */
  acrossKm: number
}

/**
 * Where a point sits relative to the journey.
 *
 * Worked on an equirectangular projection with longitude scaled by the cosine
 * of the mid-latitude, which at the scale of one country is accurate to well
 * inside the tolerance the corridor is judged on — and keeps this to
 * arithmetic that runs on every station without being felt.
 */
export function positionOnRoute(
  origin: Coordinates,
  destination: Coordinates,
  point: Coordinates,
): CorridorPosition {
  const midLat = toRad((origin.lat + destination.lat) / 2)
  const kx = Math.cos(midLat) * ((Math.PI * EARTH_RADIUS_KM) / 180)
  const ky = (Math.PI * EARTH_RADIUS_KM) / 180

  const ax = origin.lng * kx
  const ay = origin.lat * ky
  const bx = destination.lng * kx
  const by = destination.lat * ky
  const px = point.lng * kx
  const py = point.lat * ky

  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy

  // Origin and destination are the same place: everything is "at" it.
  if (lengthSquared === 0) {
    return { along: 0, acrossKm: Math.hypot(px - ax, py - ay) }
  }

  const along = ((px - ax) * dx + (py - ay) * dy) / lengthSquared
  const projX = ax + along * dx
  const projY = ay + along * dy

  return { along, acrossKm: Math.hypot(px - projX, py - projY) }
}

export interface CorridorCandidate<T> {
  item: T
  along: number
  acrossKm: number
}

/**
 * Everything within the corridor, ordered from origin to destination.
 *
 * Endpoints are trimmed by `edgeMargin`: a station in the city you are leaving
 * is not a stop on the way, and neither is one in the city you are arriving
 * at — you would be there.
 */
export function stationsAlongRoute<T>(
  origin: Coordinates,
  destination: Coordinates,
  items: readonly T[],
  getCoordinates: (item: T) => Coordinates | null | undefined,
  corridorKm?: number,
  edgeMargin = 0.08,
): CorridorCandidate<T>[] {
  const width = corridorKm ?? corridorWidthFor(haversineKm(origin, destination))
  const found: CorridorCandidate<T>[] = []

  for (const item of items) {
    const at = getCoordinates(item)
    if (!at || typeof at.lat !== 'number' || typeof at.lng !== 'number') continue

    const { along, acrossKm } = positionOnRoute(origin, destination, at)
    if (along < edgeMargin || along > 1 - edgeMargin) continue
    if (acrossKm > width) continue

    found.push({ item, along, acrossKm })
  }

  return found.sort((a, b) => a.along - b.along)
}

/**
 * Spread `count` stops across the candidates, as evenly as the real ones allow.
 *
 * A car that needs two stops wants them near a third and two thirds of the
 * way, not the first two chargers after leaving. For each ideal fraction the
 * nearest unused candidate is taken; where two are equally close the one
 * nearer the line wins, because that is the shorter detour.
 *
 * Returns fewer than asked for when the corridor holds fewer — which is a real
 * answer about charging coverage, and the interface should say so rather than
 * pad the list out.
 */
export function spreadStopsAlongRoute<T>(
  candidates: readonly CorridorCandidate<T>[],
  count: number,
): CorridorCandidate<T>[] {
  if (count <= 0 || candidates.length === 0) return []
  if (candidates.length <= count) return [...candidates]

  const chosen: CorridorCandidate<T>[] = []
  const used = new Set<number>()

  for (let i = 1; i <= count; i += 1) {
    const ideal = i / (count + 1)

    let bestIndex = -1
    let bestScore = Infinity
    for (let j = 0; j < candidates.length; j += 1) {
      if (used.has(j)) continue
      const candidate = candidates[j]!
      const score = Math.abs(candidate.along - ideal) + candidate.acrossKm / 10000
      if (score < bestScore) {
        bestScore = score
        bestIndex = j
      }
    }

    if (bestIndex === -1) break
    used.add(bestIndex)
    chosen.push(candidates[bestIndex]!)
  }

  return chosen.sort((a, b) => a.along - b.along)
}

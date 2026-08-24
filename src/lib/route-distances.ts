// src/lib/route-distances.ts

/**
 * Road distances between the city pairs people actually plan.
 *
 * The planner used to invent a distance — `250 + Math.random() * 200` — for
 * every journey, which meant Islamabad to Murree and Lahore to Karachi came
 * back the same length, and a route card promising 375 km produced a 431 km
 * result the moment it was clicked. Anything the interface states twice has to
 * agree with itself, so both the popular-route cards and the planner read their
 * distances from here.
 *
 * These are approximate driving distances by the usual motorway or national
 * highway route, rounded to the nearest 5 km. They are not a routing engine's
 * answer — that arrives when there is a real routing API behind this — so
 * everything built on them is labelled as an estimate in the interface.
 */

interface RoadDistance {
  from: string
  to: string
  km: number
}

const ROAD_DISTANCES: RoadDistance[] = [
  { from: 'Islamabad', to: 'Lahore', km: 375 },
  { from: 'Lahore', to: 'Karachi', km: 1215 },
  { from: 'Karachi', to: 'Hyderabad', km: 165 },
  { from: 'Islamabad', to: 'Peshawar', km: 180 },
  { from: 'Lahore', to: 'Faisalabad', km: 140 },
  { from: 'Islamabad', to: 'Murree', km: 65 },
  { from: 'Lahore', to: 'Multan', km: 340 },
  { from: 'Lahore', to: 'Sialkot', km: 130 },
  { from: 'Karachi', to: 'Sukkur', km: 470 },
  { from: 'Islamabad', to: 'Abbottabad', km: 120 },
  { from: 'Islamabad', to: 'Multan', km: 545 },
  { from: 'Karachi', to: 'Multan', km: 890 },
  { from: 'Islamabad', to: 'Karachi', km: 1420 },
  { from: 'Lahore', to: 'Rawalpindi', km: 365 },
  { from: 'Islamabad', to: 'Gilgit', km: 590 },
  { from: 'Islamabad', to: 'Muzaffarabad', km: 140 },
  { from: 'Lahore', to: 'Gujranwala', km: 80 },
  { from: 'Karachi', to: 'Quetta', km: 690 },
]

/** Direction-free key, so one entry answers both ways round. */
function pairKey(a: string, b: string): string {
  return [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join('→')
}

const BY_PAIR = new Map(ROAD_DISTANCES.map((entry) => [pairKey(entry.from, entry.to), entry.km]))

/** The distance for a known pair in either direction, or null if it is not one. */
export function getRoadDistanceKm(from: string, to: string): number | null {
  if (!from.trim() || !to.trim()) return null
  return BY_PAIR.get(pairKey(from, to)) ?? null
}

/**
 * The average speed every time estimate on the site is built on.
 *
 * Motorway cruising minus the reality of towns at either end. It lives here
 * rather than inside the planner because the route cards quote drive times too,
 * and two different assumptions would put two different numbers on one journey.
 */
export const AVERAGE_SPEED_KMH = 80

export function estimateDriveMinutes(distanceKm: number): number {
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60)
}

export interface PopularRoute {
  from: string
  to: string
  distanceKm: number
  /** What makes this corridor worth naming, in a few words. */
  note: string
}

/**
 * The shortcuts offered above the planner, longest-serving corridors first.
 *
 * Every distance here is looked up from the table above at module load, so a
 * correction to a distance can only ever be made in one place.
 */
export const POPULAR_ROUTES: PopularRoute[] = (
  [
    { from: 'Islamabad', to: 'Lahore', note: 'M-2 motorway' },
    { from: 'Lahore', to: 'Karachi', note: 'The long haul' },
    { from: 'Islamabad', to: 'Peshawar', note: 'M-1 motorway' },
    { from: 'Lahore', to: 'Faisalabad', note: 'M-3 motorway' },
    { from: 'Karachi', to: 'Hyderabad', note: 'M-9 motorway' },
    { from: 'Islamabad', to: 'Murree', note: 'Weekend hill run' },
  ] as const
).map((route) => ({
  ...route,
  // Non-null assertion would hide a typo here; a missing pair is a bug worth
  // failing loudly on at import time rather than rendering "NaN km".
  distanceKm: (() => {
    const km = getRoadDistanceKm(route.from, route.to)
    if (km === null) {
      throw new Error(`No road distance for ${route.from} → ${route.to}`)
    }
    return km
  })(),
}))

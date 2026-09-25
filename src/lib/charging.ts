// src/lib/charging.ts

/**
 * Shapes and thresholds the hero's map needs on both sides of the boundary.
 *
 * These lived in lib/db/queries, which is `server-only`. That is correct for
 * the queries — they hold a Prisma client and must never reach a browser — but
 * the map's markers are drawn in a client component, and colouring a dot means
 * knowing the threshold. Importing the constant from there pulled the whole
 * server module into the client bundle and the build refused it, which is the
 * guard doing exactly its job.
 *
 * So the parts that describe the data live here, where both can read them, and
 * the parts that fetch it stay behind the server boundary.
 */

/**
 * Where the map's legend divides one colour of marker from the other.
 *
 * 60kW is the industry line between a charger you wait at and one you stop at.
 * The legend prints this number rather than implying it, and the markers are
 * coloured by the same constant, so the key cannot drift from the dots.
 */
export const FAST_CHARGER_KW = 60

/** One station, reduced to what the hero map draws. */
export interface HeroMapPin {
  slug: string
  name: string
  city: string
  lat: number
  lng: number
  /** The fastest connector fitted. Decides blue (fast) against green. */
  maxPowerKw: number
  ports: number
  availablePorts: number
}

export interface HeroStats {
  /** Stations plus approved, placed businesses — the same count the band uses. */
  locations: number
  /** Distinct connector standards actually fitted at those locations. */
  connectorTypes: number
  reviews: number
  /** Mean of every review, or null when there are none to average. */
  rating: number | null
  /** Charging points per city, keyed by city name, for the quick-pick chips. */
  byCity: Record<string, number>
  /** Every station with a real pin, for the dots on the hero map. */
  pins: HeroMapPin[]
}

/**
 * The station the "how it works" carousel shows on its phones: the one drivers
 * have reviewed most, with its real average, its star breakdown and two of its
 * verified reviews. Step 3 navigates to it and step 4 reviews it, so the two
 * slides tell one story.
 */
export interface ShowcaseStation {
  slug: string
  name: string
  city: string
  rating: number
  reviewCount: number
  /** Count of reviews at 5, 4, 3, 2 and 1 stars, in that order. */
  breakdown: [number, number, number, number, number]
  reviews: { userName: string; userVehicle: string; rating: number; comment: string; date: string; verified: boolean }[]
}

// src/components/range/types.ts
import type { RangeStandard } from '@/lib/range-standards'

/**
 * One EV, trimmed to what the range converter needs.
 *
 * Every figure is the catalogue's own. A standard the catalogue does not state
 * is null — the converter then asks rather than assuming WLTP — and an owner
 * figure that nobody has reported is null too.
 */
export interface RangeCar {
  slug: string
  name: string
  brand: string
  /** The quoted range, km. The low end when versions differ. */
  rangeKm: number
  /** The top of the quoted span across versions, when there is one. */
  rangeMaxKm: number | null
  standard: RangeStandard | null
  /** What owners report, as a span, when the catalogue has it. */
  ownerLowKm: number | null
  ownerHighKm: number | null
}

/** How many EVs in the catalogue quote each standard, for the listings section. */
export type StandardCounts = Record<RangeStandard | 'unstated', number>

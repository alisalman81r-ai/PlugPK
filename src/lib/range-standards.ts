// src/lib/range-standards.ts

/**
 * What an EV range figure means under each test standard, and what it might
 * mean on the road.
 *
 * Pure functions and data, no React and no database. The range converter page
 * renders what these return; nothing else decides a number.
 *
 * ── Why every answer is a band ────────────────────────────────────────
 *
 * EPA, WLTP, NEDC and CLTC are not units. They are different drives — different
 * speeds, stops, temperatures and corrections — and a car's result on one
 * depends on how that particular car copes with the other's conditions. A car
 * with good aerodynamics loses less on a fast cycle; a heavy one loses more on
 * a stop-start one. So there is no universal conversion factor, and this file
 * never pretends there is. Each standard is described by how it TYPICALLY
 * reads against WLTP, with the spread that published comparisons show, and
 * every result carries that spread.
 *
 * WLTP is the hub: every figure is taken to its WLTP equivalent and from there
 * to the others. It is the standard with the most published pairings against
 * the other three, which makes it the least uncertain place to meet.
 *
 * ── Where the ratios come from ────────────────────────────────────────
 *
 * See SOURCES below; each ratio names the ones it rests on. In short:
 *
 *   EPA   A 19-car comparison of the same cars on EPA and WLTP found observed
 *         range averaged 91% of EPA and 79% of WLTP, which puts EPA at about
 *         0.87 of WLTP. Individual cars ran from about 0.78 (Tesla Model 3)
 *         to about 0.98 (a test car measured on all four cycles).
 *   NEDC  The four-cycle test car read 1.22 × its WLTP figure on NEDC. NEDC is
 *         commonly described as 20–25% more generous than WLTP; the band
 *         allows for the older, smaller EVs where the gap was wider.
 *   CLTC  The four-cycle test car read 1.28 × WLTP; the BYD Atto 3 is
 *         published at 510 km CLTC and 420 km WLTP (1.21), its 74.8 kWh
 *         successor at 650 and 510 (1.27).
 *
 * These are the figures of a handful of cars, not a statistical model, and the
 * page says so.
 */

export type RangeStandard = 'EPA' | 'WLTP' | 'NEDC' | 'CLTC'

export const STANDARD_ORDER: RangeStandard[] = ['WLTP', 'EPA', 'NEDC', 'CLTC']

export interface StandardInfo {
  id: RangeStandard
  name: string
  /** Where a Pakistani buyer is likely to have met it. */
  region: string
  /** One line: what kind of drive the test is. */
  gist: string
  /** How this standard's figure typically reads, as a multiple of WLTP. */
  vsWltp: { typical: number; low: number; high: number }
}

export const STANDARDS: Record<RangeStandard, StandardInfo> = {
  WLTP: {
    id: 'WLTP',
    name: 'Worldwide Harmonised Light Vehicles Test Procedure',
    region: 'Europe, UK and many exports',
    gist: 'A 30-minute lab drive from city crawl to 131 km/h, at 23°C.',
    vsWltp: { typical: 1, low: 1, high: 1 },
  },
  EPA: {
    id: 'EPA',
    name: 'US Environmental Protection Agency rating',
    region: 'United States',
    gist: 'Several cycles, including fast and cold ones, then corrected down.',
    vsWltp: { typical: 0.87, low: 0.78, high: 0.98 },
  },
  NEDC: {
    id: 'NEDC',
    name: 'New European Driving Cycle',
    region: 'Older EU; some Chinese brochures',
    gist: 'A gentle, largely steady lab drive that WLTP replaced in 2017–18.',
    vsWltp: { typical: 1.22, low: 1.14, high: 1.33 },
  },
  CLTC: {
    id: 'CLTC',
    name: 'China Light-duty Vehicle Test Cycle',
    region: 'China and its exports',
    gist: 'A slow, stop-start city drive — average 29 km/h, a fifth of it idling.',
    vsWltp: { typical: 1.25, low: 1.18, high: 1.33 },
  },
}

/**
 * The shortest range the converter will restate.
 *
 * Below this the answer is noise: rounding to the nearest 5 km turned an
 * input of 1 km into "0–0 km" on every other standard, which reads as the
 * calculator saying the car goes nowhere. No production EV is rated at under
 * 50 km, and the cycle ratios are fitted against real cars, so the converter
 * asks for a figure in that territory rather than extrapolating to one.
 */
export const MIN_RANGE_KM = 20

/** A figure people can read, rounded to what the method can support. */
export function roundKm(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 0
  const step = km < 50 ? 1 : km < 200 ? 5 : 10
  // Never rounds a real distance down to nothing.
  return Math.max(1, Math.round(km / step) * step)
}

export interface Band {
  typical: number
  low: number
  high: number
}

export interface Equivalent extends Band {
  standard: RangeStandard
  /** True for the standard the figure was quoted in: that one is exact. */
  quoted: boolean
}

/**
 * The quoted figure, restated on all four standards.
 *
 * Going through WLTP means two uncertain steps for a pair like CLTC → EPA, so
 * the band takes the pessimistic end of one and the optimistic end of the
 * other. That makes it wide — which is the truth about comparing those two
 * cycles, not a flaw in the arithmetic.
 */
export function convertRange(km: number, from: RangeStandard): Equivalent[] | null {
  if (!Number.isFinite(km) || km < MIN_RANGE_KM) return null
  const src = STANDARDS[from].vsWltp

  return STANDARD_ORDER.map((to) => {
    if (to === from) return { standard: to, quoted: true, typical: km, low: km, high: km }
    const dst = STANDARDS[to].vsWltp
    return {
      standard: to,
      quoted: false,
      typical: roundKm((km * dst.typical) / src.typical),
      low: roundKm((km * dst.low) / src.high),
      high: roundKm((km * dst.high) / src.low),
    }
  })
}

/** The WLTP equivalent, unrounded, for the road estimates to start from. */
function wltpBand(km: number, from: RangeStandard): Band {
  const src = STANDARDS[from].vsWltp
  return { typical: km / src.typical, low: km / src.high, high: km / src.low }
}

export type ScenarioId = 'mixed' | 'summer' | 'motorway'

export interface Scenario {
  id: ScenarioId
  title: string
  /** The conditions, stated plainly. */
  conditions: string
  /** Share of the WLTP figure. */
  share: Band
  /** Where the share comes from, in one line the page prints. */
  basis: string
}

/**
 * Three situations, each resting on a published measurement rather than on a
 * feel for it:
 *
 *   mixed     Observed range across 15 cars in mixed-conditions driving:
 *             79% of WLTP on average, 73–86% across the cars. The source does
 *             not state temperatures.
 *   summer    The same, with AAA's measured 17% loss at 35°C with the AC on
 *             (against a 24°C baseline) applied on top. If the observed
 *             figures already include some warm days, this counts part of the
 *             heat twice — so it leans pessimistic, the safer way for a range
 *             estimate to be wrong. Pakistani summers often pass 35°C, where
 *             the loss grows.
 *   motorway  57 cars at a steady 130 km/h: most reached 60–75% of WLTP,
 *             the best about 81%. Pakistan's motorway limit is 120 km/h, so
 *             the top of the band is taken as 80%.
 *
 * Not combined further. A hot motorway run with a full car will do worse than
 * the motorway band, but there is no measurement to put a number on how much,
 * so the page says it in words.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'mixed',
    title: 'Everyday mixed driving',
    conditions: 'City and open road, moderate weather',
    share: { typical: 0.79, low: 0.73, high: 0.86 },
    basis: 'Observed range of 15 EVs in mixed driving',
  },
  {
    id: 'summer',
    title: 'A Pakistani summer, AC running',
    conditions: 'Same driving at 35°C and above, cabin cooled',
    share: { typical: 0.79 * 0.83, low: 0.73 * 0.83, high: 0.86 * 0.83 },
    basis: 'The above, less the 17% AAA measured at 35°C with AC',
  },
  {
    id: 'motorway',
    title: 'Motorway at 120 km/h',
    conditions: 'Sustained high speed, e.g. Lahore–Islamabad on the M-2',
    share: { typical: 0.7, low: 0.6, high: 0.8 },
    basis: '57 EVs range-tested at a steady 130 km/h',
  },
]

export interface RoadEstimate extends Band {
  scenario: Scenario
}

export function roadEstimates(km: number, from: RangeStandard): RoadEstimate[] | null {
  if (!Number.isFinite(km) || km < MIN_RANGE_KM) return null
  const w = wltpBand(km, from)
  return SCENARIOS.map((scenario) => ({
    scenario,
    typical: roundKm(w.typical * scenario.share.typical),
    low: roundKm(w.low * scenario.share.low),
    high: roundKm(w.high * scenario.share.high),
  }))
}

/** Normalises a catalogue value ("WLTP", "wltp ", "unspecified") to a standard, or null. */
export function parseStandard(value: string | null | undefined): RangeStandard | null {
  const v = value?.trim().toUpperCase()
  return v === 'EPA' || v === 'WLTP' || v === 'NEDC' || v === 'CLTC' ? v : null
}

export const SOURCES = [
  {
    label: 'China Light-Duty Vehicle Test Cycle — cycle data, and one car measured on CLTC, NEDC, WLTP and EPA',
    href: 'https://en.wikipedia.org/wiki/China_Light-Duty_Vehicle_Test_Cycle',
  },
  {
    label: 'EV Model Compare — EPA vs WLTP, and observed range, across 19 cars',
    href: 'https://evmodelcompare.com/epa-vs-wltp-range/',
  },
  {
    label: 'AAA — electric vehicle range testing in extreme heat and cold',
    href: 'https://www.aaa.com/AAA/common/AAR/files/AAA-Electric-Vehicle-Range-Testing-Report.pdf',
  },
  {
    label: 'ArenaEV — 57 electric cars range-tested at 130 km/h',
    href: 'https://www.arenaev.com/57_electric_cars_range_tested_at_highway_speeds__who_wins_part_2-news-1905.php',
  },
  {
    label: 'BYD Atto 3 — 510 km CLTC and 420 km WLTP for the 60.48 kWh car',
    href: 'https://en.wikipedia.org/wiki/BYD_Atto_3',
  },
] as const

// ── Two listings ───────────────────────────────────────────────────────

export interface ListingComparison {
  a: Band
  b: Band
  /**
   *   overlap    the two likely spreads overlap on WLTP: they may be closer
   *              than the listings look, or level
   *   a-further  even A's low end is above B's high end
   *   b-further  the reverse
   *   level      same standard, same figure
   */
  relation: 'overlap' | 'a-further' | 'b-further' | 'level'
  /** How far apart, when they do not overlap: the smallest and largest likely gap. */
  gap: { low: number; high: number } | null
  /** The gap between the figures as listed, before putting them on one test. */
  listedGap: number
  /**
   * Both quoted on one standard already. Then nothing is converted and the
   * comparison is exact: routing two EPA figures through WLTP would widen
   * both with the same uncertainty and blur a difference that is plain.
   */
  sameStandard: boolean
}

/** Both listings restated on WLTP, and how they relate once they are on the same test. */
export function compareListings(
  a: { km: number; standard: RangeStandard },
  b: { km: number; standard: RangeStandard },
): ListingComparison | null {
  if (!Number.isFinite(a.km) || a.km <= 0 || !Number.isFinite(b.km) || b.km <= 0) return null
  const listedGap = Math.abs(a.km - b.km)

  if (a.standard === b.standard) {
    const exact = (km: number) => ({ typical: km, low: km, high: km })
    const relation = a.km === b.km ? 'level' : a.km > b.km ? 'a-further' : 'b-further'
    return {
      a: exact(a.km),
      b: exact(b.km),
      relation,
      gap: relation === 'level' ? null : { low: listedGap, high: listedGap },
      listedGap,
      sameStandard: true,
    }
  }

  const toWltp = (km: number, s: RangeStandard) => convertRange(km, s)?.find((r) => r.standard === 'WLTP') ?? null
  const wa = toWltp(a.km, a.standard)
  const wb = toWltp(b.km, b.standard)
  if (!wa || !wb) return null

  const bandA = { typical: wa.typical, low: wa.low, high: wa.high }
  const bandB = { typical: wb.typical, low: wb.low, high: wb.high }
  const base = { a: bandA, b: bandB, listedGap, sameStandard: false }

  if (bandA.low > bandB.high) {
    return { ...base, relation: 'a-further', gap: { low: bandA.low - bandB.high, high: bandA.high - bandB.low } }
  }
  if (bandB.low > bandA.high) {
    return { ...base, relation: 'b-further', gap: { low: bandB.low - bandA.high, high: bandB.high - bandA.low } }
  }
  return { ...base, relation: 'overlap', gap: null }
}

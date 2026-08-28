// crawler/range-standard.ts

/**
 * Range test cycles, and when two range figures may be compared.
 *
 * ── Why a range without its cycle is not a number ─────────────────────
 *
 * The same car measures very differently depending on who tested it and how.
 * CLTC is the most generous and EPA the most conservative; for one vehicle the
 * spread between them is routinely 30–40%. So "425 km" and "650 km" are not
 * necessarily a disagreement, an improvement or a correction — they may be the
 * same car measured two ways.
 *
 * That is exactly what went wrong on `byd-seal`. A 650 km figure, almost
 * certainly CLTC, was replaced by 425 km whose cycle the source does not state.
 * The comparison layer saw two numbers 34.6% apart and reported a large change,
 * which is arithmetically true and materially meaningless: nobody had established
 * that the two figures were measuring the same thing.
 *
 * This module refuses to let that comparison happen silently. It does not convert
 * between cycles — there is no honest conversion factor, only rules of thumb, and
 * a rule of thumb applied to a published specification becomes a fabricated
 * specification.
 */

export const RANGE_STANDARDS = ['wltp', 'epa', 'cltc', 'nedc', 'jc08', 'unspecified'] as const

export type RangeStandard = (typeof RANGE_STANDARDS)[number]

export interface StandardInfo {
  label: string
  /**
   * Roughly how optimistic this cycle is, for a reviewer's context only.
   *
   * Never used in arithmetic. It exists so the review screen can say "CLTC reads
   * high" beside a figure, not so anything can divide by it.
   */
  optimism: 'conservative' | 'moderate' | 'optimistic' | 'unknown'
  note: string
}

export const STANDARD_INFO: Record<RangeStandard, StandardInfo> = {
  wltp: {
    label: 'WLTP',
    optimism: 'moderate',
    note: 'European lab cycle. The usual reference for cars sold outside China and the US.',
  },
  epa: {
    label: 'EPA',
    optimism: 'conservative',
    note: 'US cycle, and the closest of these to real-world driving.',
  },
  cltc: {
    label: 'CLTC',
    optimism: 'optimistic',
    note: 'Chinese cycle. Reads roughly a third higher than WLTP for the same car, so a CLTC figure is not comparable to a WLTP one.',
  },
  nedc: {
    label: 'NEDC',
    optimism: 'optimistic',
    note: 'Superseded by WLTP in Europe, still quoted in some markets. Reads high.',
  },
  jc08: {
    label: 'JC08',
    optimism: 'optimistic',
    note: 'Older Japanese cycle. Reads high, and largely historical.',
  },
  unspecified: {
    label: 'unspecified',
    optimism: 'unknown',
    note: 'The publisher did not state a cycle. The figure cannot be compared to a figure from a known cycle without a person deciding it is fair to do so.',
  },
}

export function isRangeStandard(value: string): value is RangeStandard {
  return (RANGE_STANDARDS as readonly string[]).includes(value)
}

/**
 * A stored or published string to a standard.
 *
 * ── Falls back to `unspecified`, never to a guess ─────────────────────
 *
 * An unrecognised label means we do not know the cycle, and `unspecified` is the
 * honest name for that. Defaulting to WLTP because most figures are WLTP would
 * make an unknown figure *look* comparable to a known one, which is the single
 * thing this module exists to prevent.
 */
export function toRangeStandard(value: string | null | undefined): RangeStandard {
  if (!value) return 'unspecified'

  const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (key.length === 0) return 'unspecified'

  if (isRangeStandard(key)) return key

  /*
    A small table of spellings actually seen in published data, not a fuzzy
    match. "WLTP (combined)" and "EPA est." are the same cycle written two ways;
    anything not listed stays unspecified rather than being reasoned about.
  */
  if (key.startsWith('wltp')) return 'wltp'
  if (key.startsWith('epa')) return 'epa'
  if (key.startsWith('cltc')) return 'cltc'
  if (key.startsWith('nedc')) return 'nedc'
  if (key.startsWith('jc08') || key === 'jc') return 'jc08'

  return 'unspecified'
}

export interface Comparability {
  /** True only when the two figures measure the same thing. */
  comparable: boolean
  /** Why, in a sentence a reviewer can act on. */
  reason: string
  /**
   * True when a person must decide before the proposed figure may be applied.
   *
   * Distinct from `comparable`: two figures can be incomparable and still worth
   * proposing — a WLTP figure for a car that currently has a CLTC one is
   * genuinely better data, it simply must not be swapped in as though the two
   * were interchangeable. The reviewer is the one who decides that.
   */
  requiresReview: boolean
}

/**
 * Whether a proposed range may be compared with the current one.
 *
 * Four cases, and only the first permits an automatic comparison:
 *
 *   same known cycle          comparable
 *   different known cycles    not comparable — different measurements
 *   either side unspecified   not comparable — one side's cycle is unknown
 *   both unspecified          not comparable, and quietly the worst case
 *
 * That last one deserves its own note. Two figures of unknown provenance may
 * agree, disagree, or be measuring different things, and there is no way to tell
 * which. It is tempting to treat it as comparable because neither side claims a
 * cycle — but "neither of us knows" is not agreement.
 */
export function compareStandards(
  current: RangeStandard,
  proposed: RangeStandard,
): Comparability {
  if (current === 'unspecified' && proposed === 'unspecified') {
    return {
      comparable: false,
      reason:
        'neither figure states a test cycle, so it cannot be established that they measure the same thing',
      requiresReview: true,
    }
  }

  if (current === 'unspecified') {
    return {
      comparable: false,
      reason: `the catalogue figure states no test cycle, so it cannot be compared to a ${STANDARD_INFO[proposed].label} one`,
      requiresReview: true,
    }
  }

  if (proposed === 'unspecified') {
    return {
      comparable: false,
      reason: `the source states no test cycle, so its figure cannot replace a ${STANDARD_INFO[current].label} one`,
      requiresReview: true,
    }
  }

  if (current === proposed) {
    return {
      comparable: true,
      reason: `both figures are ${STANDARD_INFO[current].label}`,
      requiresReview: false,
    }
  }

  return {
    comparable: false,
    reason:
      `${STANDARD_INFO[current].label} and ${STANDARD_INFO[proposed].label} are different measurements, not different values — ` +
      `${STANDARD_INFO[proposed].label} ${STANDARD_INFO[proposed].optimism === 'optimistic' ? 'reads high' : STANDARD_INFO[proposed].optimism === 'conservative' ? 'reads low' : 'differs'} by comparison`,
    requiresReview: true,
  }
}

/** Fields whose value is a range, and therefore carries a test cycle. */
export const RANGE_FIELDS = new Set(['range', 'rangeMax', 'electricRange', 'electricRangeMax'])

export function isRangeField(field: string): boolean {
  return RANGE_FIELDS.has(field)
}

/**
 * Which column holds the cycle for a given range column.
 *
 * `rangeMax` shares `rangeStandard` with `range`: a span measured two different
 * ways would not be a span.
 */
export function standardColumnFor(field: string): string | null {
  if (field === 'range' || field === 'rangeMax') return 'rangeStandard'
  if (field === 'electricRange' || field === 'electricRangeMax') return 'electricRangeStandard'
  return null
}

/** One line for a review screen, e.g. "425 km (unspecified)". */
export function describe(value: unknown, standard: RangeStandard): string {
  const figure = value === null || value === undefined ? '—' : String(value)
  return `${figure} km (${STANDARD_INFO[standard].label})`
}

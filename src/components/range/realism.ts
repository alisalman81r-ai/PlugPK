// src/components/range/realism.ts
import type { RangeStandard } from '@/lib/range-standards'

/** Strictest first: reading down is reading from the figure to trust most to the one to trust least. */
export const REALISM_ORDER: RangeStandard[] = ['EPA', 'WLTP', 'NEDC', 'CLTC']

/**
 * How far each standard's figure tends to sit from the road. The converter
 * card and the standards table both read this, so the two never disagree.
 */
export const REALISM: Record<RangeStandard, { badge: string; tone: string; note: string; usedIn: string }> = {
  EPA: {
    badge: 'Most realistic',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    note: 'The US rating. It adds fast and cold driving, then adjusts down, so it lands nearest to what you will see.',
    usedIn: 'United States',
  },
  WLTP: {
    badge: 'Realistic',
    tone: 'bg-plug-cyan-50 text-plug-cyan-800 ring-plug-cyan-600/20',
    note: 'Europe’s current test and the baseline here. A fair guide to everyday mixed driving.',
    usedIn: 'Europe and the UK',
  },
  NEDC: {
    badge: 'Optimistic',
    tone: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    note: 'Europe’s old, gentle test, retired in 2018. Expect noticeably less on the road.',
    usedIn: 'Europe (retired), some Chinese brochures',
  },
  CLTC: {
    badge: 'Least realistic',
    tone: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    note: 'China’s slow, stop-start city test. Most Chinese imports quote it, and real range is well below.',
    usedIn: 'China and its exports',
  },
}

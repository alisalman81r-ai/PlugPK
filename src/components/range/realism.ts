import type { RangeStandard } from '@/lib/range-standards'

/** Strictest first: reading down is reading from the figure to trust most to the one to trust least. */
export const REALISM_ORDER: RangeStandard[] = ['EPA', 'WLTP', 'NEDC', 'CLTC']

/**
 * How far each standard's figure tends to sit from the road. The converter
 * card and the standards table both read this, so the two never disagree.
 *
 * Tones are landing-v2's .tone pills: green, volt, amber and ember, in a
 * light form for paper and a dark form for the ink instrument, plus the
 * colour of each standard's band on the converter's shared km lane.
 */
export const REALISM: Record<
  RangeStandard,
  { badge: string; tone: string; toneDark: string; band: string; note: string; usedIn: string }
> = {
  EPA: {
    badge: 'Most realistic',
    tone: 'border-[#BFEBD1] bg-[#E9F8EF] text-[#157A45]',
    toneDark: 'border-[#35D07F]/40 bg-[#35D07F]/[0.08] text-[#35D07F]',
    band: 'bg-[#35D07F]/50',
    note: 'The US rating. It adds fast and cold driving, then adjusts down, so it lands nearest to what you will see.',
    usedIn: 'United States',
  },
  WLTP: {
    badge: 'Realistic',
    tone: 'border-[#DDF58C] bg-[#F1FFD0] text-volt-ink',
    toneDark: 'border-volt/40 bg-volt/[0.08] text-volt',
    band: 'bg-volt/45',
    note: 'Europe’s current test and the baseline here. A fair guide to everyday mixed driving.',
    usedIn: 'Europe and the UK',
  },
  NEDC: {
    badge: 'Optimistic',
    tone: 'border-[#FFE0A3] bg-[#FFF6E3] text-[#8A5300]',
    toneDark: 'border-[#FFB020]/40 bg-[#FFB020]/[0.08] text-[#FFB020]',
    band: 'bg-[#FFB020]/45',
    note: 'Europe’s old, gentle test, retired in 2018. Expect noticeably less on the road.',
    usedIn: 'Europe (retired), some Chinese brochures',
  },
  CLTC: {
    badge: 'Least realistic',
    tone: 'border-[#FFCDBC] bg-[#FFECE6] text-[#B42E05]',
    toneDark: 'border-[#FF5A1F]/45 bg-[#FF5A1F]/[0.08] text-[#FF7A47]',
    band: 'bg-[#FF5A1F]/50',
    note: 'China’s slow, stop-start city test. Most Chinese imports quote it, and real range is well below.',
    usedIn: 'China and its exports',
  },
}

/** The pill itself (.tone): mono caps with a dot in the current colour. */
export const TONE_PILL =
  'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em] before:size-1.5 before:rounded-full before:bg-current before:content-[""]'

/** "Nice" axis ticks over [a, b], about n of them (the design's ticks()). */
export function axisTicks(a: number, b: number, n = 5): number[] {
  const raw = (b - a) / n
  if (!(raw > 0)) return [a]
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(Math.round(v))
  return out
}

// src/components/range/EquivalentChart.tsx
import type { Equivalent } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

/**
 * The quoted figure on all four standards, on one km axis.
 *
 * A bar per standard from zero to its typical figure — length is the thing
 * being compared, so every bar starts at the same baseline — and over it a
 * thin whisker for the likely spread. The quoted standard is the only solid
 * dark bar and the only one without a whisker: it is the figure the driver
 * actually has, and it is exact.
 *
 * Every value is written beside its bar in text ink, so the chart never needs
 * a tooltip or a legend to be read, and the rows are a table in their own
 * right for a screen reader (see the sr-only list).
 */

export interface EquivalentChartProps {
  rows: Equivalent[]
}

/** The axis end: a round hundred just past the largest likely figure. */
function axisMax(rows: Equivalent[]): number {
  const top = Math.max(...rows.map((r) => r.high))
  return Math.max(100, Math.ceil((top * 1.04) / 100) * 100)
}

export function EquivalentChart({ rows }: EquivalentChartProps) {
  const max = axisMax(rows)
  const pct = (km: number) => `${Math.min(100, (km / max) * 100)}%`
  const ticks = [0, max / 2, max]

  return (
    <figure>
      <ul className="space-y-4" aria-hidden="true">
        {rows.map((row) => (
          <li
            key={row.standard}
            className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-3 sm:grid-cols-[3.75rem_minmax(0,1fr)_7.5rem] sm:gap-x-4"
          >
            <span
              className={cn(
                'text-ui-sm font-bold tracking-wide',
                row.quoted ? 'text-slate-900' : 'text-slate-500',
              )}
            >
              {row.standard}
            </span>

            <span className="relative block h-7">
              {/* Track: the axis's full length, so a short bar reads as short. */}
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-r-[4px] transition-[width] duration-300 ease-out motion-reduce:transition-none',
                  row.quoted ? 'bg-plug-blue-600' : 'bg-plug-cyan-500/70',
                )}
                style={{ width: pct(row.typical) }}
              />
              {row.quoted ? null : (
                /* The likely spread: a line with end caps, drawn above the bar. */
                <span
                  className="absolute top-1/2 h-4 -translate-y-1/2 border-x-2 border-slate-700/70 transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
                  style={{ left: pct(row.low), width: `calc(${pct(row.high)} - ${pct(row.low)})` }}
                >
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-700/70" />
                </span>
              )}
            </span>

            <span className="text-right leading-tight">
              <span className="block text-ui font-bold tabular-nums text-slate-900">
                {row.quoted ? '' : '~'}
                {row.typical.toLocaleString('en-PK')} km
              </span>
              <span className="block text-ui-sm tabular-nums text-slate-500">
                {row.quoted ? 'as quoted' : row.low === row.high ? ' ' : `${row.low}–${row.high}`}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* The axis, aligned to the track column only. */}
      <div
        aria-hidden="true"
        className="mt-3 grid grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-x-3 sm:grid-cols-[3.75rem_minmax(0,1fr)_7.5rem] sm:gap-x-4"
      >
        <span />
        <span className="relative block h-5 text-ui-sm tabular-nums text-slate-400">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={cn('absolute top-0', i === 0 ? 'left-0' : i === ticks.length - 1 ? 'right-0' : 'hidden -translate-x-1/2 sm:block')}
              style={i === 1 ? { left: '50%' } : undefined}
            >
              {t} km
            </span>
          ))}
        </span>
        <span className="invisible text-ui-sm">0</span>
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-ui-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-5 rounded-r-[3px] bg-plug-blue-600" />
          Your figure
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-5 rounded-r-[3px] bg-plug-cyan-500/70" />
          Typical equivalent
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="relative h-3 w-5 border-x-2 border-slate-700/70">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-700/70" />
          </span>
          Likely spread
        </span>
      </figcaption>

      {/* The same figures as a list, for anyone not reading the bars. */}
      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.standard}>
            {row.quoted
              ? `${row.standard}: ${row.typical} km, as quoted.`
              : row.low === row.high
                ? `${row.standard}: about ${row.typical} km.`
                : `${row.standard}: about ${row.typical} km, likely between ${row.low} and ${row.high} km.`}
          </li>
        ))}
      </ul>
    </figure>
  )
}

// src/components/calculator/ChargerComparison.tsx
'use client'

import { estimateCharge, formatDuration, formatKw, formatRupees, type ChargeMode } from '@/lib/charging-time'
import { cn } from '@/lib/utils'

import type { CalculatorCar } from './types'

/**
 * The same charge on every common charger, side by side.
 *
 * The question behind most visits is not "how long on this charger" but
 * "which charger should I use" — is a wall box worth it, is it worth driving
 * to a fast charger. One answer at a time cannot show that; six rows can.
 *
 * Each row runs the same estimate as the main card, with the car's own limits
 * applied, so a car that caps at 6.6 kW shows the 7.4, 11 and 22 kW boxes
 * taking the same time — which is itself the most useful thing on the page for
 * someone about to buy the bigger one. Tapping a row selects that charger
 * above; the chosen one is the ink row with the volt bar (landing-v2 .crow).
 *
 * Bars are proportional to time against the slowest row, so a two-hour gap
 * looks like one. The fastest DC rows get a sliver rather than nothing.
 */

const OPTIONS: { mode: ChargeMode; kw: number; label: string }[] = [
  { mode: 'ac', kw: 3.7, label: 'Home socket' },
  { mode: 'ac', kw: 7.4, label: 'Wall box' },
  { mode: 'ac', kw: 11, label: 'Three-phase box' },
  { mode: 'ac', kw: 22, label: 'Three-phase box' },
  { mode: 'dc', kw: 60, label: 'DC fast charger' },
  { mode: 'dc', kw: 120, label: 'DC rapid charger' },
]

export interface ChargerComparisonProps {
  batteryKwh: number | null
  from: number
  to: number
  car: CalculatorCar | null
  ratePerKwh: number | null
  /** The charger chosen above, if it is one of the presets. */
  selectedMode: ChargeMode | null
  selectedKw: number | null
  onChoose: (mode: ChargeMode, kw: number) => void
}

export function ChargerComparison({
  batteryKwh,
  from,
  to,
  car,
  ratePerKwh,
  selectedMode,
  selectedKw,
  onChoose,
}: ChargerComparisonProps) {
  const rows = OPTIONS.map((o) => ({
    ...o,
    result: estimateCharge({
      batteryKwh,
      fromPct: from,
      toPct: to,
      mode: o.mode,
      chargerKw: o.kw,
      carLimitKw: car ? (o.mode === 'ac' ? car.acKw : car.dcKw) : null,
      ratePerKwh,
    }),
  }))

  const slowest = Math.max(...rows.map((r) => (r.result.ok ? r.result.minutes : 0)))
  const ready = slowest > 0

  return (
    <section aria-labelledby="compare-heading" className="min-w-0">
      <div className="mb-[18px] grid gap-1">
        <h2 id="compare-heading" className="m-0 font-display text-2xl leading-[1.1] text-ink">
          Same charge, every charger
        </h2>
        <p className="text-sm text-muted">
          {ready ? `${from}% → ${to}%${car ? ` on ${car.name}` : ''}. Tap one to use it above.` : 'Appears once you add your battery.'}
        </p>
      </div>

      {ready ? (
        <ul className="grid gap-1.5">
          {rows.map((row) => {
            if (!row.result.ok) return null
            const r = row.result
            const on = selectedMode === row.mode && selectedKw === row.kw
            const capped = r.limitedBy === 'car'
            const share = Math.max(3, (r.minutes / slowest) * 100)

            return (
              <li key={`${row.mode}-${row.kw}`}>
                <button
                  type="button"
                  onClick={() => onChoose(row.mode, row.kw)}
                  aria-pressed={on}
                  className={cn(
                    'grid min-h-[56px] w-full grid-cols-[minmax(0,104px)_minmax(0,1fr)_86px] items-center gap-2.5 rounded-[14px] px-2.5 py-2 text-left transition-colors duration-300 sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)_120px] sm:gap-3.5 sm:px-3.5',
                    'focus-visible:shadow-focus focus-visible:outline-none',
                    on ? 'bg-ink text-white' : 'text-ink hover:bg-chalk',
                  )}
                >
                  <span className="grid min-w-0 leading-[1.25]">
                    <b className="font-mono text-[13.5px] font-semibold sm:text-[15px]">
                      {formatKw(row.kw)}
                    </b>
                    <span className={cn('text-[12px] leading-[1.3] sm:truncate sm:text-[12.5px]', on ? 'text-fog' : 'text-muted')}>
                      {row.label}
                      {/* No DC cost: at the home rate it would read as the
                          cheaper option, and public DC usually bills more. */}
                      {r.cost != null && row.mode === 'ac' ? ` · ${formatRupees(r.cost)}` : ''}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn('relative h-3 overflow-hidden rounded-full', on ? 'bg-white/[0.12]' : 'bg-stone')}
                  >
                    <span
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
                        on ? 'bg-volt shadow-[0_0_10px_rgba(212,255,58,.6)]' : 'bg-ink',
                      )}
                      style={{ width: `${share}%` }}
                    />
                  </span>

                  <span className="min-w-0 text-right">
                    <span
                      className={cn(
                        'block whitespace-nowrap font-mono text-[13.5px] font-semibold tabular-nums sm:text-[15px]',
                        on && 'text-volt',
                      )}
                    >
                      {row.mode === 'dc' ? '~' : ''}
                      {formatDuration(r.minutes)}
                    </span>
                    <span className={cn('block font-mono text-[11px] font-medium leading-[1.3] sm:whitespace-nowrap', on ? 'text-fog' : 'text-muted')}>
                      {capped
                        ? `car max ${formatKw(r.powerKw)}`
                        : row.mode === 'dc'
                          ? 'slows as it fills'
                          : `at ${formatKw(r.powerKw)}`}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

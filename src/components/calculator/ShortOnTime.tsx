// src/components/calculator/ShortOnTime.tsx
'use client'

import * as React from 'react'

import { chipClass } from '@/components/v2/ui'
import { Clock } from '@/components/ui/icons'
import {
  chargeWithin,
  formatKw,
  formatKwh,
  formatPct,
  formatPctAdded,
  rangeAddedKm,
  type ChargeMode,
} from '@/lib/charging-time'
import { cn } from '@/lib/utils'

/**
 * The question asked at the charger rather than at home: "I have half an
 * hour — how much will I get?"
 *
 * Runs the calculator's own model backwards (lib/charging-time chargeWithin),
 * from the current level, on the charger chosen above and with the car's
 * limits, so it can never disagree with the main figure: the time the main
 * card gives for 20→77% is the time this gives 77% for.
 */

const TIMES = [15, 30, 45, 60, 90] as const

export interface ShortOnTimeProps {
  batteryKwh: number | null
  fromPct: number
  mode: ChargeMode
  chargerKw: number | null
  carLimitKw: number | null
  rangeKm: number | null
}

export function ShortOnTime({ batteryKwh, fromPct, mode, chargerKw, carLimitKw, rangeKm }: ShortOnTimeProps) {
  const [minutes, setMinutes] = React.useState<number>(30)
  const got = chargeWithin({ batteryKwh, fromPct, mode, chargerKw, carLimitKw, minutes })
  const powerKw = chargerKw && carLimitKw ? Math.min(chargerKw, carLimitKw) : chargerKw
  const km = got && got.toPct > fromPct ? rangeAddedKm(rangeKm, fromPct, got.toPct) : null
  const dc = mode === 'dc'

  return (
    <section aria-labelledby="short-heading" className="min-w-0">
      <div className="mb-[18px] grid gap-1">
        <h2 id="short-heading" className="m-0 flex items-center gap-2.5 font-display text-2xl leading-[1.1] text-ink">
          <Clock size={22} className="shrink-0 text-volt-ink" aria-hidden="true" />
          Short on time?
        </h2>
        <p className="text-sm text-muted">How far a set time gets you, from {fromPct}% on the charger above.</p>
      </div>

      <div className="grid gap-[18px] rounded-[22px] border border-ink/10 bg-chalk bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] p-4 sm:p-[18px]">
        <div role="radiogroup" aria-label="Time on the charger" className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={minutes === t}
              onClick={() => setMinutes(t)}
              className={chipClass(minutes === t, 'h-11 font-mono font-semibold tabular-nums focus-visible:shadow-focus focus-visible:outline-none')}
            >
              {t < 60 ? `${t} min` : t === 60 ? '1 h' : '1½ h'}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="grid min-h-[120px] content-center">
          {got && powerKw ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <b className="font-mono text-[44px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink sm:text-[48px]">
                  <span className="text-[0.45em] font-medium tracking-normal text-muted">{fromPct}% → </span>
                  {dc && !got.full ? <span className="text-fog">~</span> : null}
                  {formatPct(got.toPct)}
                </b>
                <span className="font-mono text-[15px] font-semibold text-volt-ink">
                  {got.full ? 'Full before time is up' : `+${formatPctAdded(got.toPct - fromPct)}`}
                </span>
              </div>
              <div aria-hidden="true" className="relative mb-2.5 mt-3.5 h-3.5 overflow-hidden rounded-full border border-ink/10 bg-white">
                <i className="absolute inset-y-0 left-0 rounded-full bg-ink-3" style={{ width: `${fromPct}%` }} />
                <i
                  className="absolute inset-y-0 rounded-full bg-volt transition-[width] duration-500 ease-out"
                  style={{ left: `${fromPct}%`, width: `${Math.max(0, got.toPct - fromPct)}%` }}
                />
              </div>
              <p className="font-mono text-[13px] font-medium leading-[1.5] text-muted">
                +{formatKwh(got.energyKwh)} ({formatPctAdded(got.toPct - fromPct)})
                {km != null ? ` · about +${km} km of rated range` : ''} · {dc ? 'DC' : 'AC'} at {formatKw(powerKw)}
                {dc ? ', slowing as it fills' : ''}
              </p>
            </>
          ) : (
            <p className={cn('text-sm text-muted')}>Add your battery size and a charger above to see this.</p>
          )}
        </div>
      </div>
    </section>
  )
}

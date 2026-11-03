// src/components/calculator/ShortOnTime.tsx
'use client'

import * as React from 'react'

import { useIsoLayoutEffect } from '@/components/tools/motion'
import { chipClass } from '@/components/v2/ui'
import { gsap, prefersReduced } from '@/lib/gsap'
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
  const ready = Boolean(got && powerKw)
  const addedPct = got ? Math.max(0, got.toPct - fromPct) : 0

  /* landing-v2 renderSot: the answer rises in the first time it appears */
  const outRef = React.useRef<HTMLDivElement>(null)
  const wasOn = React.useRef(false)
  useIsoLayoutEffect(() => {
    if (ready && !wasOn.current && outRef.current && !prefersReduced()) {
      gsap.from(outRef.current.children, { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'expo.out' })
    }
    wasOn.current = ready
  }, [ready])

  /* …and the added charge slides to its place (0.7s expo.out) */
  const addRef = React.useRef<HTMLElement>(null)
  useIsoLayoutEffect(() => {
    const a = addRef.current
    if (!a) return
    const vars = { left: `${fromPct}%`, width: `${addedPct}%` }
    if (prefersReduced()) gsap.set(a, vars)
    else gsap.to(a, { ...vars, duration: 0.7, ease: 'expo.out' })
  }, [ready, fromPct, addedPct])

  /* a time chip rolls the figure a little slower than any other change */
  const bump = React.useRef(false)

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
              onClick={() => {
                bump.current = true
                setMinutes(t)
              }}
              className={chipClass(minutes === t, 'h-11 font-mono font-semibold tabular-nums focus-visible:shadow-focus focus-visible:outline-none')}
            >
              {t < 60 ? `${t} min` : t === 60 ? '1 h' : '1½ h'}
            </button>
          ))}
        </div>

        <div ref={outRef} aria-live="polite" className="grid min-h-[120px] content-center">
          {got && powerKw ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {/* The figure rolls, so it is read out from the hidden copy beside it. */}
                <span className="sr-only">
                  {fromPct}% to {dc && !got.full ? 'about ' : ''}
                  {formatPct(got.toPct)}
                </span>
                <b
                  aria-hidden="true"
                  className="font-mono text-[44px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink sm:text-[48px]"
                >
                  <span className="text-[0.45em] font-medium tracking-normal text-muted">{fromPct}% → </span>
                  {dc && !got.full ? <span className="text-fog">~</span> : null}
                  <RollingPct value={got.toPct} start={fromPct} bump={bump} />
                </b>
                <span className="font-mono text-[15px] font-semibold text-volt-ink">
                  {got.full ? 'Full before time is up' : `+${formatPctAdded(got.toPct - fromPct)}`}
                </span>
              </div>
              <div aria-hidden="true" className="relative mb-2.5 mt-3.5 h-3.5 overflow-hidden rounded-full border border-ink/10 bg-white">
                <i className="absolute inset-y-0 left-0 rounded-full bg-ink-3" style={{ width: `${fromPct}%` }} />
                <i ref={addRef} className="absolute inset-y-0 left-0 w-0 rounded-full bg-volt" />
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

/**
 * The charge reached, rolling from the starting level when it first appears
 * and from the last figure after (power3.out, 0.5s; 0.8s after a time chip).
 * Whole percents while it rolls, the exact figure when it lands.
 */
function RollingPct({ value, start, bump }: { value: number; start: number; bump: React.MutableRefObject<boolean> }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const initial = React.useRef(formatPct(start))
  const o = React.useRef({ v: start })

  useIsoLayoutEffect(() => {
    const el = ref.current
    const slow = bump.current
    bump.current = false
    if (!el) return
    if (prefersReduced()) {
      o.current.v = value
      el.textContent = formatPct(value)
      return
    }
    gsap.to(o.current, {
      v: value,
      duration: slow ? 0.8 : 0.5,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        el.textContent = `${Math.round(o.current.v)}%`
      },
      onComplete: () => {
        el.textContent = formatPct(value)
      },
    })
  }, [value, bump])

  React.useEffect(() => {
    const tw = o.current
    return () => void gsap.killTweensOf(tw)
  }, [])

  return (
    <span ref={ref} suppressHydrationWarning>
      {initial.current}
    </span>
  )
}

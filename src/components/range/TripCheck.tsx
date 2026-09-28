// src/components/range/TripCheck.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { ArrowRight, CheckCircle2, AlertTriangle, PlugZap } from '@/components/ui/icons'
import type { IconType } from '@/components/ui/icons'
import { checkTrip, TRIP_RESERVE, type RoadEstimate, type TripVerdict } from '@/lib/range-standards'
import { POPULAR_ROUTES } from '@/lib/route-distances'
import { cn } from '@/lib/utils'

/**
 * "Will it make my trip?" — the question behind most range questions.
 *
 * The corridors and their distances are the ones the route planner uses
 * (lib/route-distances), so a trip quoted here and there is the same length.
 * A driver can also type any distance. The verdict per situation comes from
 * lib/range-standards and keeps a reserve in hand, because the estimates are
 * bands and nobody should plan to arrive on empty.
 *
 * It answers in three plain words per situation, never a single "yes": the
 * same trip can be comfortable in March and need a stop in June.
 */

const START_OPTIONS = [100, 90, 80] as const

const VERDICT: Record<TripVerdict, { label: string; detail: string; icon: IconType; tone: string }> = {
  likely: {
    label: 'Should make it',
    detail: 'even the low end covers it, with charge to spare',
    icon: CheckCircle2,
    tone: 'text-plug-cyan-700',
  },
  tight: {
    label: 'Tight',
    detail: 'only if conditions are kind, so plan a top-up',
    icon: AlertTriangle,
    tone: 'text-amber-700',
  },
  stop: {
    label: 'Plan a charging stop',
    detail: 'beyond what this range is likely to give',
    icon: PlugZap,
    tone: 'text-slate-700',
  },
}

export interface TripCheckProps {
  estimates: RoadEstimate[]
}

export function TripCheck({ estimates }: TripCheckProps) {
  // The first corridor, M-2, is the trip most range questions are about.
  const first = POPULAR_ROUTES[0]
  const [routeKey, setRouteKey] = React.useState(first ? `${first.from}-${first.to}` : 'custom')
  const [customText, setCustomText] = React.useState('')
  const [start, setStart] = React.useState<number>(100)

  const route = POPULAR_ROUTES.find((r) => `${r.from}-${r.to}` === routeKey) ?? null
  const custom = Number(customText)
  const distance = routeKey === 'custom' ? (customText.trim() !== '' && Number.isFinite(custom) ? custom : null) : route?.distanceKm ?? null
  const results = distance != null ? checkTrip(estimates, distance, start) : null

  return (
    <section aria-labelledby="trip-heading" className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <div>
          <h2 id="trip-heading" className="text-xl font-bold tracking-tight text-slate-900">
            Will it make the trip?
          </h2>
          <p className="mt-1.5 text-ui-sm leading-relaxed text-slate-500">
            Pick a corridor or type a distance. We check it against each situation above, keeping{' '}
            {Math.round(TRIP_RESERVE * 100)}% of the range in hand so you don&rsquo;t arrive on empty.
          </p>

          <div role="radiogroup" aria-label="Trip" className="mt-5 flex flex-wrap gap-2">
            {POPULAR_ROUTES.map((r) => {
              const key = `${r.from}-${r.to}`
              const on = routeKey === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRouteKey(key)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-ui-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                    on
                      ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {r.from}–{r.to}
                  <span className={cn('tabular-nums', on ? 'text-white/70' : 'text-slate-400')}>{r.distanceKm} km</span>
                </button>
              )
            })}
            <button
              type="button"
              role="radio"
              aria-checked={routeKey === 'custom'}
              onClick={() => setRouteKey('custom')}
              className={cn(
                'inline-flex min-h-10 items-center rounded-full border px-3.5 text-ui-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                routeKey === 'custom'
                  ? 'border-plug-blue-600 bg-plug-blue-600 text-white'
                  : 'border-dashed border-slate-300 bg-white text-slate-700 hover:border-slate-400',
              )}
            >
              Other distance
            </button>
          </div>

          {routeKey === 'custom' ? (
            <div className="mt-3 flex max-w-[14rem] items-center rounded-xl border-[1.5px] border-slate-200 bg-white px-4 focus-within:border-plug-blue-500 focus-within:shadow-focus">
              <label htmlFor="trip-km" className="sr-only">
                Trip distance in km
              </label>
              <input
                id="trip-km"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="e.g. 250"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                autoFocus
                className="h-12 w-full min-w-0 bg-transparent text-ui font-semibold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-ui-sm font-medium text-slate-400">km</span>
            </div>
          ) : null}

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Starting charge</p>
            <div role="radiogroup" aria-label="Starting charge" className="inline-flex rounded-full bg-slate-100 p-1">
              {START_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  role="radio"
                  aria-checked={start === pct}
                  onClick={() => setStart(pct)}
                  className={cn(
                    'min-h-9 rounded-full px-4 text-ui-sm font-semibold tabular-nums transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500',
                    start === pct ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div aria-live="polite">
          {results && distance != null ? (
            <>
              <p className="text-ui-sm text-slate-500">
                {route && routeKey !== 'custom' ? `${route.from} to ${route.to}, about ` : 'A trip of '}
                <span className="font-semibold text-slate-900">{distance.toLocaleString('en-PK')} km</span>, starting at{' '}
                {start}%
              </p>
              <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {results.map((r) => {
                  const v = VERDICT[r.verdict]
                  const Icon = v.icon
                  return (
                    <li key={r.scenario.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                      <Icon size={20} className={cn('mt-0.5 shrink-0', v.tone)} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-ui font-semibold text-slate-900">{r.scenario.title}</span>
                          <span className="text-ui-sm tabular-nums text-slate-500">
                            {r.low}–{r.high} km available
                          </span>
                        </p>
                        <p className="mt-0.5 text-ui-sm">
                          <span className={cn('font-semibold', v.tone)}>{v.label}</span>
                          <span className="text-slate-500"> — {v.detail}</span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-ui-sm leading-relaxed text-slate-500">
                Intercity corridors are mostly motorway, so read that row first. A car that needs a stop is not a
                worse car — it just needs a charger on the way.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-600 hover:text-plug-cyan-700"
                >
                  Find chargers on the way
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/routes"
                  className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-600 hover:text-plug-cyan-700"
                >
                  Plan the route
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-[10rem] place-items-center rounded-2xl border border-dashed border-slate-200 px-6 text-center">
              <p className="text-ui-sm text-slate-500">Type the trip&rsquo;s distance in km to check it.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

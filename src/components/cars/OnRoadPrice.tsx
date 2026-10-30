// src/components/cars/OnRoadPrice.tsx
'use client'

import { ChevronDown } from '@/components/ui/icons'
import * as React from 'react'

import type { OnRoadEstimate, Province, TaxStatus } from '@/lib/onroad'
import { cn } from '@/lib/utils'

/**
 * "Price in Pakistan": the ex-factory price plus what registering the car
 * costs, for a province and a tax status.
 *
 * Every estimate is worked out on the server from src/data/onroad-rates.ts and
 * handed down whole, so this component holds no tax logic — it only chooses
 * which of the precomputed answers to show. A province with no sourced rates
 * is simply not offered.
 */

export interface OnRoadPriceProps {
  title: string
  provinces: Array<{ key: Province; name: string }>
  estimates: Partial<Record<Province, Record<TaxStatus, OnRoadEstimate>>>
  /** FY label and the date the rates were last checked, for the subtitle. */
  fiscalYear: string
  checked: string
}

const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString('en-US')}`

export function OnRoadPrice({ title, provinces, estimates, fiscalYear, checked }: OnRoadPriceProps) {
  const [province, setProvince] = React.useState<Province>(provinces[0]?.key ?? 'punjab')
  const [status, setStatus] = React.useState<TaxStatus>('filer')
  const estimate = estimates[province]?.[status]
  if (!estimate) return null

  return (
    <section id="price" className="mt-14 scroll-mt-24 lg:mt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-[clamp(1.625rem,3vw,2.125rem)] font-black leading-tight tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-ui text-slate-600">
            Ex-factory and estimated on-road price for FY {fiscalYear}. Rates checked {checked}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Province of registration</span>
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value as Province)}
              className="h-12 appearance-none rounded-full border border-slate-200 bg-white pl-5 pr-10 text-ui font-semibold text-slate-900 outline-none transition-colors hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            >
              {provinces.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </label>

          <div role="radiogroup" aria-label="Tax status" className="flex rounded-full border border-slate-200 bg-white p-1">
            {(['filer', 'nonFiler'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={status === option}
                onClick={() => setStatus(option)}
                className={cn(
                  'h-10 rounded-full px-5 text-ui font-bold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                  status === option ? 'bg-dark-base text-white' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {option === 'filer' ? 'Filer' : 'Non-filer'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
          <p className="text-ui-lg font-bold text-slate-900">On-road price estimate</p>
          <div className="text-right">
            {estimate.totalNote ? (
              <p className="text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-500">{estimate.totalNote}</p>
            ) : null}
            <p aria-live="polite" className="mt-1 font-display text-[1.75rem] font-black tabular-nums tracking-[-0.02em] text-dark-base">
              {rupees(estimate.total)}
            </p>
          </div>
        </div>

        {estimate.sections.map((section) => (
          <div key={section.title} className="mt-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-ui font-bold text-slate-900">{section.title}</p>
              <p className="text-ui font-bold tabular-nums text-slate-900">{rupees(section.total)}</p>
            </div>
            <dl className="mt-3 flex flex-col gap-3 rounded-2xl bg-slate-100 px-4 py-4 sm:px-5">
              {section.lines.map((line) => (
                <div key={line.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ui text-slate-700">{line.label}</dt>
                    <dd className="text-ui tabular-nums text-slate-900">
                      {line.amount === 0 && line.free ? 'Free' : rupees(line.amount)}
                    </dd>
                  </div>
                  {line.note ? <p className="mt-0.5 text-ui-xs text-slate-500">{line.note}</p> : null}
                </div>
              ))}
            </dl>
          </div>
        ))}

        <p className="mt-5 text-ui-xs leading-relaxed text-slate-500">
          {estimate.caveat}{' '}
          Sources:{' '}
          {estimate.sources.map((source, index) => (
            <React.Fragment key={source.url}>
              {index > 0 ? ', ' : null}
              <a href={source.url} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-slate-700">
                {source.label}
              </a>
            </React.Fragment>
          ))}
          .
        </p>
      </div>
    </section>
  )
}

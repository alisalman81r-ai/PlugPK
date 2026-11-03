// src/components/cars/OnRoadPrice.tsx
'use client'

import { ChevronDown } from '@/components/ui/icons'
import * as React from 'react'

import type { OnRoadEstimate, Province, TaxStatus } from '@/lib/onroad'
import { CARD, Eyebrow, SEG, segButtonClass } from '@/components/v2/ui'
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
    <section id="price" className="scroll-mt-[calc(var(--nav-h)+16px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>On-road price</Eyebrow>
          <h2 data-split="" className="font-display text-[clamp(30px,3.4vw,48px)] leading-[1.04] text-ink text-balance">
            {title}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-muted">
            Ex-factory and estimated on-road price for FY {fiscalYear}. Rates checked {checked}.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
          <label className="relative">
            <span className="sr-only">Province of registration</span>
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value as Province)}
              className="h-12 cursor-pointer appearance-none rounded-full border-[1.5px] border-ink/10 bg-white pl-5 pr-10 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] hover:border-ink/30 focus-visible:border-ink focus-visible:shadow-focus"
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
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            />
          </label>

          <div role="radiogroup" aria-label="Tax status" className={cn(SEG, 'rounded-full')}>
            {(['filer', 'nonFiler'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={status === option}
                onClick={() => setStatus(option)}
                className={segButtonClass(status === option, 'h-10 rounded-full px-5 py-0 content-center')}
              >
                {option === 'filer' ? 'Filer' : 'Non-filer'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div data-reveal="" className={cn(CARD, 'mt-7 p-5 sm:p-7')}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 pb-5">
          <p className="font-display text-[22px] leading-tight text-ink">On-road price estimate</p>
          <div className="text-right">
            {estimate.totalNote ? (
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{estimate.totalNote}</p>
            ) : null}
            <p aria-live="polite" className="mt-1.5 font-mono text-[clamp(26px,2.6vw,34px)] font-semibold leading-none tabular-nums tracking-[-0.03em] text-ink">
              {rupees(estimate.total)}
            </p>
          </div>
        </div>

        {estimate.sections.map((section) => (
          <div key={section.title} className="mt-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[15px] font-semibold text-ink">{section.title}</p>
              <p className="whitespace-nowrap font-mono text-[15px] font-semibold tabular-nums text-ink">{rupees(section.total)}</p>
            </div>
            <dl className="mt-3 flex flex-col gap-3 rounded-2xl bg-chalk px-4 py-4 sm:px-5">
              {section.lines.map((line) => (
                <div key={line.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[14.5px] text-ink/80">{line.label}</dt>
                    <dd className="whitespace-nowrap font-mono text-[14px] tabular-nums text-ink">
                      {line.amount === 0 && line.free ? 'Free' : rupees(line.amount)}
                    </dd>
                  </div>
                  {line.note ? <p className="mt-0.5 text-xs text-muted">{line.note}</p> : null}
                </div>
              ))}
            </dl>
          </div>
        ))}

        <p className="mt-5 text-xs leading-relaxed text-muted">
          {estimate.caveat}{' '}
          Sources:{' '}
          {estimate.sources.map((source, index) => (
            <React.Fragment key={source.url}>
              {index > 0 ? ', ' : null}
              <a href={source.url} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-ink">
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

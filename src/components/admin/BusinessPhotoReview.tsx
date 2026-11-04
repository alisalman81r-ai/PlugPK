'use client'

import { Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import { reviewBusinessPhoto } from '@/lib/db/business-actions'
import type { BusinessPhotoReportRow } from '@/lib/db/queries'

import { CARD, Ico, btnClass, rise } from './network-kit'

export function BusinessPhotoReview({ reports }: { reports: BusinessPhotoReportRow[] }) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  if (reports.length === 0) return null

  const review = (report: BusinessPhotoReportRow, status: 'approved' | 'needs-better-photo') => {
    setError(null)
    startTransition(async () => {
      const result = await reviewBusinessPhoto(report.businessId, report.photoUrl, status)
      if (!result.ok) setError(result.message ?? 'Could not review the photo.')
    })
  }

  return (
    <section {...rise()} aria-labelledby="photo-reports" className={`${CARD} mb-[18px] overflow-hidden`}>
      <header className="flex items-center justify-between gap-3 border-b border-l-4 border-b-ink/[.09] border-l-[#FFB020] bg-paper px-6 py-[18px] max-[640px]:px-4">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Needs review</span>
          <h2 id="photo-reports" className="m-0 mt-1 font-display text-2xl font-normal leading-[1.1] text-ink">
            Photo reports
          </h2>
        </div>
        <span className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-ink/[.09] bg-white px-3 font-mono text-[13px] text-muted">
          {reports.length} report{reports.length === 1 ? '' : 's'}
        </span>
      </header>
      <ul className="m-0 list-none p-0">
        {reports.map((report) => (
          <li
            key={report.id}
            className="flex flex-wrap items-center gap-4 border-t border-ink/[.09] px-6 py-3.5 transition-colors duration-200 first:border-t-0 hover:bg-paper max-[640px]:px-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.photoUrl} alt="Reported charger" className="h-[60px] w-[88px] shrink-0 rounded-[10px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="m-0 font-display text-lg leading-[1.2] text-ink">{report.businessName}</p>
              <p className="mb-0 mt-1 text-sm text-muted">{report.reason}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={pending} onClick={() => review(report, 'approved')} className={btnClass('ink', 'sm')}>
                {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="okc" />}
                Keep photo
              </button>
              <button type="button" disabled={pending} onClick={() => review(report, 'needs-better-photo')} className={btnClass('line', 'sm')}>
                <Ico name="img" />
                Request replacement
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="m-0 border-t border-ink/[.09] px-6 py-3 text-sm text-[#c2410c]">
          {error}
        </p>
      ) : null}
    </section>
  )
}

'use client'

import { Check, ImageOff, Loader2 } from 'lucide-react'
import * as React from 'react'

import { reviewBusinessPhoto } from '@/lib/db/business-actions'
import type { BusinessPhotoReportRow } from '@/lib/db/queries'

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
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <ImageOff size={18} className="text-amber-700" aria-hidden="true" />
        <h2 className="font-bold text-slate-900">Photo reports needing review</h2>
      </div>
      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <article key={report.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.photoUrl} alt="Reported charger" className="h-20 w-28 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{report.businessName}</p>
              <p className="mt-1 text-ui-sm text-slate-500">{report.reason}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={pending} onClick={() => review(report, 'approved')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-ui-sm font-semibold text-white disabled:opacity-60">
                {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Keep photo
              </button>
              <button type="button" disabled={pending} onClick={() => review(report, 'needs-better-photo')} className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-ui-sm font-semibold text-slate-700 disabled:opacity-60">
                Request replacement
              </button>
            </div>
          </article>
        ))}
      </div>
      {error ? <p role="alert" className="mt-3 text-ui-sm text-red-700">{error}</p> : null}
    </section>
  )
}
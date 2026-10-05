// src/app/admin/(protected)/businesses/[id]/page.tsx
import { notFound } from 'next/navigation'

import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessForm } from '@/components/admin/BusinessForm'
import { ReviewStatusBadge } from '@/components/admin/ReviewStatusBadge'
import { getAdminBusiness } from '@/lib/db/admin-queries'
import { saveBusiness } from '@/lib/db/business-actions'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EditBusinessPage({ params }: { params: { id: string } }) {
  const business = await getAdminBusiness(params.id)
  if (!business) notFound()

  async function update(form: FormData) {
    'use server'
    return saveBusiness(form)
  }

  return (
    <>
      <AdminHeader
        title={business.businessName}
        backHref="/admin/businesses"
        description={`Submitted by ${business.ownerName} · ${business.email}`}
      />

      <div className="max-w-3xl px-4 pt-6 sm:px-8 sm:pt-8">
        <p className="flex flex-wrap items-center gap-2 text-ui-sm text-slate-600">
          Status <ReviewStatusBadge status={business.status} />
          {business.reviewedAt ? (
            <span className="text-ui-xs text-slate-400">decided {formatRelativeTime(business.reviewedAt)}</span>
          ) : null}
        </p>
        {/* Shown back so the reason for a rejection travels with the record. */}
        {business.reviewNote ? (
          <p className="mt-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-ui-sm text-red-900">
            <span className="font-semibold">Review note:</span> {business.reviewNote}
          </p>
        ) : null}
      </div>

      <BusinessForm business={business} action={update} />

      <div className="max-w-3xl px-4 pb-8 sm:px-8">
        <ActivityPanel targetType="business" targetId={business.id} />
      </div>
    </>
  )
}

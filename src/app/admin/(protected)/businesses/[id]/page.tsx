// src/app/admin/(protected)/businesses/[id]/page.tsx
import { notFound } from 'next/navigation'

import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessForm } from '@/components/admin/BusinessForm'
import { ListingApplicationPanel } from '@/components/admin/ListingApplicationPanel'
import { FORM_COL, FormCard, Note, ReviewPill } from '@/components/admin/network-kit'
import { getAdminBusiness } from '@/lib/db/admin-queries'
import { saveBusiness } from '@/lib/db/business-actions'
import { getApplication } from '@/lib/db/listing-application-queries'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EditBusinessPage({ params }: { params: { id: string } }) {
  const business = await getAdminBusiness(params.id)
  if (!business) notFound()
  const application = await getApplication(business.id)

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

      <div className="grid gap-3.5">
        <div className={FORM_COL}>
          <FormCard
            title="Review"
            sub={
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                <ReviewPill status={business.status} />
                {business.reviewedAt ? <span className="text-sm text-fog">decided {formatRelativeTime(business.reviewedAt)}</span> : null}
              </span>
            }
          >
            {/* Shown back so the reason for a rejection travels with the record. */}
            {business.reviewNote ? (
              <Note>
                <b className="font-semibold">Review note:</b> {business.reviewNote}
              </Note>
            ) : null}
            {application ? (
              <ListingApplicationPanel application={application} businessType={business.businessType} listingStatus={business.status} />
            ) : null}
          </FormCard>
        </div>

        <BusinessForm business={business} action={update} />

        <div className={FORM_COL}>
          <ActivityPanel targetType="business" targetId={business.id} />
        </div>
      </div>
    </>
  )
}

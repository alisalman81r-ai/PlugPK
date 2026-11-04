// src/app/admin/(protected)/services/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { FORM_COL, FormCard, Note, ReviewPill } from '@/components/admin/network-kit'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { ServiceReviewControl } from '@/components/admin/ServiceReviewControl'
import { saveService } from '@/lib/db/actions'
import { getServiceReviewState } from '@/lib/db/admin-queries'
import { getServiceById } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const [service, review] = await Promise.all([getServiceById(params.id), getServiceReviewState(params.id)])
  if (!service) notFound()

  async function update(form: FormData) {
    'use server'
    return saveService(params.id, form)
  }

  return (
    <>
      <AdminHeader
        title={service.name}
        description={review?.status === 'pending' ? 'An application awaiting review.' : 'Editing a listing.'}
        backHref="/admin/services"
      />

      <div className="grid gap-3.5">
        {review?.submittedAt || review?.reviewNote ? (
          <div className={FORM_COL}>
            <FormCard
              title="Application"
              sub={review.status ? <ReviewPill status={review.status} /> : undefined}
              className="border-l-4 border-l-[#FFB020]"
            >
              {review.submittedAt ? (
                <p className="mb-0 mt-3.5 text-[15px] leading-relaxed text-ink">
                  Sent{' '}
                  {new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(review.submittedAt))}
                  {review.user ? (
                    <>
                      {' '}by{' '}
                      <Link href={`/admin/members/${review.user.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">
                        {review.user.name}
                      </Link>{' '}
                      <span className="text-muted">({review.user.email})</span>
                    </>
                  ) : (
                    ' without signing in'
                  )}
                  {service.contactName ? (
                    <>
                      {' '}· contact person <span className="font-semibold">{service.contactName}</span>
                      {service.contactRole ? ` (${service.contactRole})` : ''}
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
              {review.status === 'pending' ? (
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-ink/[.09] pt-4">
                  <p className="m-0 text-sm text-muted">Check the details below. Nothing is public until it is approved.</p>
                  <ServiceReviewControl id={service.id} name={service.name} lat={service.coordinates.lat} lng={service.coordinates.lng} />
                </div>
              ) : null}
              {review.reviewNote ? (
                <Note>
                  <b className="font-semibold">Review note:</b> {review.reviewNote}
                </Note>
              ) : null}
            </FormCard>
          </div>
        ) : null}

        <ServiceForm service={service} status={review?.status} action={update} />

        <div className={FORM_COL}>
          <ActivityPanel targetType="service" targetId={params.id} />
        </div>
      </div>
    </>
  )
}

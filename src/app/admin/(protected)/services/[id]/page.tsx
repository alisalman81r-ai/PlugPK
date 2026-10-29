// src/app/admin/(protected)/services/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { ServiceReviewControl } from '@/components/admin/ServiceReviewControl'
import { ActivityPanel } from '@/components/admin/ActivityPanel'
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
      {review?.submittedAt ? (
        <div className="mx-4 mt-6 max-w-3xl rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-ui-sm text-amber-950 sm:mx-8">
          <p>
            <span className="font-semibold">Application</span> sent{' '}
            {new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(review.submittedAt))}
            {review.user ? (
              <>
                {' '}by{' '}
                <Link href={`/admin/members/${review.user.id}`} className="font-semibold text-plug-blue-700 hover:underline">
                  {review.user.name}
                </Link>{' '}
                <span className="text-amber-800/70">({review.user.email})</span>
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
          {review.status === 'pending' ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-3">
              <p className="text-amber-900/80">
                Check the details below. Nothing is public until it is approved.
              </p>
              <ServiceReviewControl
                id={service.id}
                name={service.name}
                lat={service.coordinates.lat}
                lng={service.coordinates.lng}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {review?.reviewNote ? (
        <p className="mx-4 mt-6 max-w-3xl rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-ui-sm text-red-900 sm:mx-8">
          <span className="font-semibold">Review note:</span> {review.reviewNote}
        </p>
      ) : null}
      <ServiceForm service={service} status={review?.status} action={update} />
      <div className="max-w-3xl px-4 pb-8 sm:px-8">
        <ActivityPanel targetType="service" targetId={params.id} />
      </div>
    </>
  )
}

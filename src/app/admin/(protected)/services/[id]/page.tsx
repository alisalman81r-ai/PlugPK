// src/app/admin/(protected)/services/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ServiceForm } from '@/components/admin/ServiceForm'
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

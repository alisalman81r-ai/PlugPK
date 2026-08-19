// src/app/business/reviews/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessReviews } from '@/components/business/BusinessReviews'
import { getBusinessesForUser, getReviewsForBusiness } from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/db/session-actions'

export const dynamic = 'force-dynamic'

export default async function BusinessReviewsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/business/reviews')

  const businesses = await getBusinessesForUser(user.id)
  const primary = businesses[0]
  const reviews = primary ? await getReviewsForBusiness(primary.id) : []
  const isLive = primary?.status === 'approved'

  return (
    <BusinessDashboardLayout
      title="Reviews"
      subtitle="What drivers said about your listing"
      listing={
        primary
          ? {
              id: primary.id,
              name: primary.businessName,
              type: primary.businessType,
              city: primary.city,
              status: primary.status,
            }
          : undefined
      }
    >
      {primary ? (
        <BusinessReviews
          reviews={reviews}
          isLive={isLive}
          listingHref={isLive ? `/station/${primary.id}` : null}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-ui-lg font-semibold text-slate-900">No listing yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            Reviews belong to a listing. Submit one first.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            List your business
          </Link>
        </div>
      )}
    </BusinessDashboardLayout>
  )
}

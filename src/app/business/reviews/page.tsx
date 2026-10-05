// src/app/business/reviews/page.tsx
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessReviews } from '@/components/business/BusinessReviews'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getReviewsForBusiness } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Reviews' }

export default async function BusinessReviewsPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/reviews', searchParams.listing)
  const { listing } = portal
  const reviews = await getReviewsForBusiness(listing.id)
  const isLive = listing.status === 'approved'

  return (
    <BusinessDashboardLayout
      title="Reviews"
      subtitle="What drivers said about your listing"
      {...portalListings(portal)}
    >
      <BusinessReviews
        reviews={reviews}
        isLive={isLive}
        listingHref={isLive ? `/station/${listing.id}` : null}
      />
    </BusinessDashboardLayout>
  )
}

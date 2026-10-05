// src/app/business/analytics/page.tsx
import type { Metadata } from 'next'

import { BusinessAnalytics } from '@/components/business/BusinessAnalytics'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getBusinessAnalytics } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Analytics' }

export default async function BusinessAnalyticsPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  // Signed out goes to sign-in; an account with no listing is sent to list one.
  const portal = await requireOwnerPortal('/business/analytics', searchParams.listing)
  const { listing } = portal
  const analytics = await getBusinessAnalytics(listing.id)

  return (
    <BusinessDashboardLayout
      title="Analytics"
      subtitle="How your listing is doing"
      {...portalListings(portal)}
    >
      <BusinessAnalytics analytics={analytics} isLive={listing.status === 'approved'} />
    </BusinessDashboardLayout>
  )
}

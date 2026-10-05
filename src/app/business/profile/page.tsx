// src/app/business/profile/page.tsx
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessProfileEditor } from '@/components/business/BusinessProfileEditor'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'

/**
 * Editing the owner's real listing.
 *
 * Gated on the server like the rest of the portal, and reading the row that
 * belongs to the signed-in account rather than a fixture.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Business profile' }

export default async function BusinessProfilePage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/profile', searchParams.listing)

  return (
    <BusinessDashboardLayout
      title="Business profile"
      subtitle="What drivers see on your listing"
      {...portalListings(portal)}
    >
      <BusinessProfileEditor key={portal.listing.id} business={portal.listing} />
    </BusinessDashboardLayout>
  )
}

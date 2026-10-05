// src/app/business/chargers/page.tsx
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ChargerManager } from '@/components/business/ChargerManager'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'

/**
 * The chargers on the owner's listing — the real ones, read from the row that
 * the map also reads.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Chargers' }

export default async function BusinessChargersPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/chargers', searchParams.listing)
  const { listing } = portal

  return (
    <BusinessDashboardLayout
      title="Chargers"
      subtitle="What is installed at your location"
      {...portalListings(portal)}
    >
      {/* Keyed by listing so switching listings starts from that listing's
          rows rather than carrying the previous one's unsaved edits across. */}
      <ChargerManager
        key={listing.id}
        businessId={listing.id}
        chargers={listing.chargers}
        isLive={listing.status === 'approved'}
      />
    </BusinessDashboardLayout>
  )
}

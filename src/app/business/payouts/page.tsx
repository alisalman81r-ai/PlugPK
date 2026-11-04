// src/app/business/payouts/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdmIcon } from '@/components/admin/admin-icons'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { PayoutAccountsManager } from '@/components/business/host/PayoutAccountsManager'
import { listingHref } from '@/components/business/listing-state'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getHostSettings, getPayoutAccounts } from '@/lib/db/host-queries'

/**
 * Where a host is paid: the bank or wallet accounts drivers send their
 * booking advance to. Its own page rather than a section of Profile — Profile
 * is what drivers see of the listing; this is money, and only ever shown to a
 * driver in the middle of booking.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Payout accounts' }

export default async function BusinessPayoutsPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/payouts', searchParams.listing)
  const { listing, listings } = portal
  const [accounts, settings] = await Promise.all([getPayoutAccounts(listing.id), getHostSettings(listing.id)])

  return (
    <BusinessDashboardLayout
      title="Payout accounts"
      subtitle="Where drivers send the advance when they book"
      {...portalListings(portal)}
    >
      <section aria-labelledby="payouts" className="card narrow">
        <div className="chead">
          <div className="min-w-0">
            <h2 id="payouts">Your accounts</h2>
            <p>
              Bank, JazzCash or Easypaisa — up to three. A driver sees them only while booking a slot, and pays the
              advance straight to you.
            </p>
          </div>
          <span className="pill pill--unk">
            <AdmIcon name="shield" />
            Private until booking
          </span>
        </div>
        <div className="cbody">
          <PayoutAccountsManager key={listing.id} businessId={listing.id} accounts={accounts} />
        </div>
      </section>

      {/* Accounts on their own take no bookings: say what turns them on. */}
      {!settings.bookingEnabled ? (
        <div className="note note--act narrow">
          <AdmIcon name="calok" />
          <span className="biz-grow">
            <b>Bookings are off for this listing</b>
            Set your price and turn bookings on once an account is added.
          </span>
          <Link href={listingHref('/business/bookings', listing.id, listings.length)} className="btn btn--volt btn--sm">
            Open bookings
            <AdmIcon name="arrow" />
          </Link>
        </div>
      ) : null}
    </BusinessDashboardLayout>
  )
}

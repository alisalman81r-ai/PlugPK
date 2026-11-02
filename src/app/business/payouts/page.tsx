// src/app/business/payouts/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

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
      <div className="max-w-3xl">
        <section aria-labelledby="payouts" className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 id="payouts" className="text-lg font-bold text-slate-900">
            Your accounts
          </h2>
          <p className="mb-5 mt-1 text-ui-sm text-slate-500">
            Bank, JazzCash or Easypaisa — up to three. A driver sees them only while booking a slot, and pays the advance
            straight to you.
          </p>
          <PayoutAccountsManager key={listing.id} businessId={listing.id} accounts={accounts} />
        </section>

        {/* Accounts on their own take no bookings: say what turns them on. */}
        {!settings.bookingEnabled ? (
          <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-ui-sm text-slate-600">
            Bookings are off for this listing.{' '}
            <Link
              href={listingHref('/business/bookings', listing.id, listings.length)}
              className="font-semibold text-plug-blue-600 hover:underline"
            >
              Set your price and turn bookings on
            </Link>{' '}
            once an account is added.
          </p>
        ) : null}
      </div>
    </BusinessDashboardLayout>
  )
}

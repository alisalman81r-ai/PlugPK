// src/app/business/bookings/page.tsx
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { HostBookingList } from '@/components/business/host/HostBookingList'
import { HostSettingsForm } from '@/components/business/host/HostSettingsForm'
import { karachiNow } from '@/lib/charger-host'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getHostBookings, getHostSettings, getPayoutAccounts } from '@/lib/db/host-queries'

/**
 * The host's bookings: the price and slot rules drivers book against, and the
 * slots booked from today onwards, with the ones awaiting a decision first in
 * mind. Bookings only reach a listing once it is live.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Bookings' }

export default async function BusinessBookingsPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/bookings', searchParams.listing)
  const { listing } = portal
  const [settings, accounts, bookings] = await Promise.all([
    getHostSettings(listing.id),
    getPayoutAccounts(listing.id),
    getHostBookings(listing.id, karachiNow().date),
  ])
  const pending = bookings.filter((booking) => booking.status === 'pending').length

  return (
    <BusinessDashboardLayout
      title="Bookings"
      subtitle={pending > 0 ? `${pending} waiting for you to confirm` : 'Slots drivers have booked'}
      {...portalListings(portal)}
    >
      <div className="grid max-w-5xl gap-8 xl:grid-cols-[1fr_380px]">
        <section aria-labelledby="upcoming" className="order-2 xl:order-1">
          <h2 id="upcoming" className="mb-1 text-lg font-bold text-slate-900">
            Upcoming bookings
          </h2>
          <p className="mb-4 text-ui-sm text-slate-500">
            Check the advance has reached your account, then confirm. Declining frees the slot for someone else.
          </p>
          {listing.status !== 'approved' ? (
            <p className="mb-4 rounded-xl bg-slate-100 px-4 py-3 text-ui-sm text-slate-600">
              Drivers can book once your listing is live on the map.
            </p>
          ) : null}
          <HostBookingList bookings={bookings} />
        </section>

        <section aria-labelledby="pricing" className="order-1 h-fit rounded-2xl border border-slate-200 bg-white p-6 xl:order-2">
          <h2 id="pricing" className="mb-5 text-lg font-bold text-slate-900">
            Pricing and booking
          </h2>
          <HostSettingsForm
            key={listing.id}
            businessId={listing.id}
            initial={settings}
            hasPayoutAccount={accounts.length > 0}
          />
        </section>
      </div>
    </BusinessDashboardLayout>
  )
}

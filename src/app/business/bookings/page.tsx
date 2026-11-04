// src/app/business/bookings/page.tsx
import type { Metadata } from 'next'

import { FormCard } from '@/components/admin/network-kit'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BizMotion, BizStat, BizStrip, Notice } from '@/components/business/host/biz-kit'
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
  const today = karachiNow().date
  const [settings, accounts, bookings] = await Promise.all([
    getHostSettings(listing.id),
    getPayoutAccounts(listing.id),
    getHostBookings(listing.id, today),
  ])
  const pending = bookings.filter((booking) => booking.status === 'pending').length
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed')
  const todays = bookings.filter((booking) => booking.date === today && booking.status !== 'declined' && booking.status !== 'cancelled').length
  const advances = confirmed.reduce((sum, booking) => sum + (booking.fee || 0), 0)

  return (
    <BusinessDashboardLayout
      title="Bookings"
      subtitle={pending > 0 ? `${pending} waiting for you to confirm` : 'Slots drivers have booked'}
      {...portalListings(portal)}
    >
      <BizMotion className="max-w-[1240px]">
        <BizStrip label="Bookings at a glance" cells={5}>
          <BizStat
            label="To confirm"
            dot={pending > 0 ? 'warn' : 'none'}
            value={pending}
            sub={pending > 0 ? 'Check the advance, then confirm' : 'Nothing waiting on you'}
            lit={pending > 0}
          />
          <BizStat label="Confirmed" dot="ok" value={confirmed.length} sub="From today onwards" />
          <BizStat label="Today" dot="blue" value={todays} sub="Booked for today" />
          <BizStat label="Upcoming" value={bookings.length} sub="Every booking from today" />
          <BizStat label="Advances confirmed" value={advances} unit="PKR" sub="Already in your account" />
        </BizStrip>

        {listing.status !== 'approved' ? (
          <Notice title="Bookings open once you are live.">Drivers can book once your listing is live on the map.</Notice>
        ) : !settings.bookingEnabled ? (
          <Notice title="Bookings are switched off." tone="info">
            Drivers see your price but cannot reserve a slot. Turn on Take bookings to start.
          </Notice>
        ) : null}

        <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <section aria-labelledby="upcoming" className="order-2 min-w-0 xl:order-1">
            <div data-biz-in="" className="mb-3.5 px-1">
              <h2 id="upcoming" className="m-0 font-display text-[26px] font-normal leading-[1.1] text-ink">
                Upcoming bookings
              </h2>
              <p className="mb-0 mt-2 text-[15px] text-muted">
                Check the advance has reached your account, then confirm. Declining frees the slot for someone else.
              </p>
            </div>
            <HostBookingList bookings={bookings} />
          </section>

          <FormCard
            aria-labelledby="pricing"
            className="order-1 xl:sticky xl:top-24 xl:order-2"
            title={<span id="pricing">Pricing and booking</span>}
            sub="What drivers pay, and when they can book."
          >
            <div className="mt-[22px]">
              <HostSettingsForm
                key={listing.id}
                businessId={listing.id}
                initial={settings}
                hasPayoutAccount={accounts.length > 0}
              />
            </div>
          </FormCard>
        </div>
      </BizMotion>
    </BusinessDashboardLayout>
  )
}

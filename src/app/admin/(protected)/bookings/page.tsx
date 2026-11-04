// src/app/admin/(protected)/bookings/page.tsx
import { HostBookingList } from '@/components/business/host/HostBookingList'
import { EmptyCard, Ico, Page, PageHead, k, rise } from '@/components/admin/people/kit'
import { karachiNow } from '@/lib/charger-host'
import { getStationBookings } from '@/lib/db/host-queries'
import { getPaymentAccounts } from '@/lib/db/listing-fee'

export const dynamic = 'force-dynamic'

/**
 * Bookings at the team's own stations, from today onwards.
 *
 * The team hosts these, so this is where each one is confirmed once the
 * advance shows in plugpk's account, or declined with a reason the driver
 * reads. A partner's bookings are decided by the partner and are not here.
 */
export default async function AdminBookingsPage() {
  const bookings = await getStationBookings(karachiNow().date)
  const pending = bookings.filter((booking) => booking.status === 'pending').length
  const notice = rise(1)

  return (
    <Page>
      <PageHead
        title="Station bookings"
        help={
          <>
            <b>Bookings at plugpk&apos;s own stations.</b> Turn bookings on for a station from its edit page. Check each
            advance has reached the plugpk account before confirming; declining frees the time for someone else.
          </>
        }
        description={pending > 0 ? `${pending} waiting for you to confirm.` : 'Upcoming bookings at your stations.'}
      />

      {getPaymentAccounts().length === 0 ? (
        <div className={k('notice', notice.className)} style={notice.style}>
          <Ico n="alert" />
          <div>
            <b>Bookings are switched off.</b>
            <span>No plugpk payment account is set (PAYMENT_* in the environment), so no station can take bookings yet.</span>
          </div>
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <EmptyCard icon="calok" title="No upcoming bookings yet." text="They appear here as soon as a driver books a slot." />
      ) : (
        <div style={{ maxWidth: 1080 }}>
          <HostBookingList bookings={bookings} />
        </div>
      )}
    </Page>
  )
}

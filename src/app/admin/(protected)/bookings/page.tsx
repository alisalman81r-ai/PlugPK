// src/app/admin/(protected)/bookings/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { HostBookingList } from '@/components/business/host/HostBookingList'
import { karachiNow } from '@/lib/charger-host'
import { getStationBookings } from '@/lib/db/host-queries'
import { getPaymentAccounts } from '@/lib/db/listing-fee'

export const dynamic = 'force-dynamic'

/**
 * Bookings at the team's own stations, from today onwards.
 *
 * The team hosts these, so this is where each one is confirmed once the
 * advance shows in Plug.pk's account, or declined with a reason the driver
 * reads. A partner's bookings are decided by the partner and are not here.
 */
export default async function AdminBookingsPage() {
  const bookings = await getStationBookings(karachiNow().date)
  const pending = bookings.filter((booking) => booking.status === 'pending').length

  return (
    <>
      <AdminHeader
        title="Station bookings"
        help={
          <>
            <b>Bookings at Plug.pk&apos;s own stations.</b> Turn bookings on for a station from its edit page. Check
            each advance has reached the Plug.pk account before confirming; declining frees the time for someone else.
          </>
        }
        description={pending > 0 ? `${pending} waiting for you to confirm.` : 'Upcoming bookings at your stations.'}
      />
      <div className="max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
        {getPaymentAccounts().length === 0 ? (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-ui-sm text-amber-900">
            No Plug.pk payment account is set (PAYMENT_* in the environment), so no station can take bookings yet.
          </p>
        ) : null}
        <HostBookingList bookings={bookings} />
      </div>
    </>
  )
}

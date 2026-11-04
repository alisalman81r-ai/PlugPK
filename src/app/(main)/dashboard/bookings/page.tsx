// src/app/(main)/dashboard/bookings/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ICal, IPin } from '@/components/dashboard/acct-icons'
import { EmptyPanel, GROUP_LABEL, PANEL } from '@/components/dashboard/dash-ui'
import { MyBookingCancel } from '@/components/dashboard/MyBookingCancel'
import { Tag, type TagTone } from '@/components/v2/ui'
import { BOOKING_STATUS_LABEL, formatClock, formatDateLabel, karachiNow, slotHasStarted } from '@/lib/charger-host'
import { getMyBookings } from '@/lib/db/host-queries'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { formatPkr } from '@/lib/listing-application'

/**
 * The slots this account has booked on partner chargers, and where each one
 * stands: waiting for the host, confirmed, declined with the host's reason,
 * or cancelled. Upcoming first, then the rest.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Bookings' }

const TONE: Record<string, TagTone> = {
  pending: 'amber',
  confirmed: 'green',
  declined: 'red',
  cancelled: 'plain',
}

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/bookings')

  const [shell, bookings] = await Promise.all([getDashboardShell(profile), getMyBookings(profile.id)])
  const today = karachiNow().date
  const upcoming = bookings
    .filter((booking) => booking.date >= today && !slotHasStarted(booking.date, booking.endTime))
    .reverse()
  const earlier = bookings.filter((booking) => !upcoming.includes(booking))

  const card = (booking: (typeof bookings)[number], active: boolean) => (
    <li key={booking.id} className={PANEL}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={booking.listingHref} className="font-display text-[26px] leading-[1.1] text-ink decoration-volt decoration-2 underline-offset-4 hover:underline">
            {booking.listingName}
          </Link>
          <p className="mt-1 flex items-center gap-[5px] text-[13px] text-muted">
            <IPin size={14} /> {booking.listingCity}
          </p>
        </div>
        <Tag tone={TONE[booking.status] ?? 'plain'} mono>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Tag>
      </div>
      <p className="mt-4 font-mono text-[15px] font-semibold tabular-nums text-ink">
        {formatDateLabel(booking.date)} · {formatClock(booking.startTime)} – {formatClock(booking.endTime)}
      </p>
      <p className="mt-1 text-sm text-muted">{booking.chargerLabel}</p>
      {booking.fromPct !== null && booking.toPct !== null ? (
        <p className="text-sm text-muted">
          {booking.vehicle ? `${booking.vehicle} · ` : ''}
          {booking.fromPct}% → {booking.toPct}%{booking.energyKwh ? ` · ~${booking.energyKwh} kWh` : ''}
        </p>
      ) : null}
      <p className="mt-3 border-t border-ink/10 pt-3 text-[13px] text-muted">
        Advance {formatPkr(booking.fee)} · ref <span className="font-mono">{booking.reference}</span>
        {booking.pricePerKwh ? ` · ${formatPkr(booking.pricePerKwh)}/unit, advance deducted from the bill` : ''}
      </p>
      {booking.status === 'declined' && booking.hostNote ? (
        <p className="mt-3 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">
          <span className="font-semibold">Host:</span> {booking.hostNote}
        </p>
      ) : null}
      {booking.status === 'pending' && active ? (
        <p className="mt-3 text-sm text-muted">The slot is held while the host checks your advance.</p>
      ) : null}
      {active && (booking.status === 'pending' || booking.status === 'confirmed') ? (
        <div className="mt-4">
          <MyBookingCancel bookingId={booking.id} />
        </div>
      ) : null}
    </li>
  )

  return (
    <DashboardLayout
      title="My bookings."
      subtitle={upcoming.length > 0 ? `${upcoming.length} upcoming` : 'Charging slots you have booked'}
      user={shell.user}
      stats={shell.stats}
    >
      {bookings.length === 0 ? (
        <EmptyPanel
          icon={<ICal />}
          title="No bookings yet."
          body="Partner chargers that take bookings show a “Book a slot” section on their page."
          href="/map"
          cta="Find a charger"
        />
      ) : (
        <div className="flex flex-col gap-[18px]">
          {upcoming.length > 0 ? (
            <section>
              <h2 className={`${GROUP_LABEL} mb-3 mt-2.5`}>Upcoming</h2>
              <ul className="m-0 grid list-none gap-[18px] p-0 min-[1101px]:grid-cols-2">{upcoming.map((booking) => card(booking, true))}</ul>
            </section>
          ) : null}
          {earlier.length > 0 ? (
            <section>
              <h2 className={`${GROUP_LABEL} mb-3 mt-2.5`}>Earlier</h2>
              <ul className="m-0 grid list-none gap-[18px] p-0 min-[1101px]:grid-cols-2">{earlier.map((booking) => card(booking, false))}</ul>
            </section>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  )
}

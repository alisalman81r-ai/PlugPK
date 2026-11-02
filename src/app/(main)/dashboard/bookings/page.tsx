// src/app/(main)/dashboard/bookings/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MyBookingCancel } from '@/components/dashboard/MyBookingCancel'
import { CalendarCheck, MapPin } from '@/components/ui/icons'
import { BOOKING_STATUS_LABEL, formatClock, formatDateLabel, karachiNow, slotHasStarted } from '@/lib/charger-host'
import { getMyBookings } from '@/lib/db/host-queries'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { formatPkr } from '@/lib/listing-application'
import { cn } from '@/lib/utils'

/**
 * The slots this account has booked on partner chargers, and where each one
 * stands: waiting for the host, confirmed, declined with the host's reason,
 * or cancelled. Upcoming first, then the rest.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Bookings' }

const TONE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
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
    <li key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={booking.listingHref} className="font-semibold text-slate-900 hover:underline">
            {booking.listingName}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-ui-sm text-slate-500">
            <MapPin size={13} aria-hidden="true" /> {booking.listingCity}
          </p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-ui-xs font-semibold', TONE[booking.status])}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </span>
      </div>
      <p className="mt-3 font-mono text-ui font-bold text-slate-900">
        {formatDateLabel(booking.date)} · {formatClock(booking.startTime)} – {formatClock(booking.endTime)}
      </p>
      <p className="text-ui-sm text-slate-600">{booking.chargerLabel}</p>
      {booking.fromPct !== null && booking.toPct !== null ? (
        <p className="text-ui-sm text-slate-600">
          {booking.vehicle ? `${booking.vehicle} · ` : ''}
          {booking.fromPct}% → {booking.toPct}%{booking.energyKwh ? ` · ~${booking.energyKwh} kWh` : ''}
        </p>
      ) : null}
      <p className="mt-2 text-ui-sm text-slate-500">
        Advance {formatPkr(booking.fee)} · ref <span className="font-mono">{booking.reference}</span>
        {booking.pricePerKwh ? ` · ${formatPkr(booking.pricePerKwh)}/unit, advance deducted from the bill` : ''}
      </p>
      {booking.status === 'declined' && booking.hostNote ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-ui-sm text-red-800">
          <span className="font-semibold">Host:</span> {booking.hostNote}
        </p>
      ) : null}
      {booking.status === 'pending' && active ? (
        <p className="mt-3 text-ui-sm text-slate-500">The slot is held while the host checks your advance.</p>
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
      title="My Bookings"
      subtitle={upcoming.length > 0 ? `${upcoming.length} upcoming` : 'Charging slots you have booked'}
      user={shell.user}
      stats={shell.stats}
    >
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CalendarCheck size={28} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-semibold text-slate-900">No bookings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            Partner chargers that take bookings show a “Book a slot” section on their page.
          </p>
          <Link
            href="/map"
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-5 text-ui font-bold text-white transition-colors hover:bg-plug-cyan-500 hover:text-plug-blue-600"
          >
            Find a charger
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 ? (
            <section>
              <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-wide text-slate-400">Upcoming</h2>
              <ul className="grid gap-4 lg:grid-cols-2">{upcoming.map((booking) => card(booking, true))}</ul>
            </section>
          ) : null}
          {earlier.length > 0 ? (
            <section>
              <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-wide text-slate-400">Earlier</h2>
              <ul className="grid gap-4 lg:grid-cols-2">{earlier.map((booking) => card(booking, false))}</ul>
            </section>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  )
}

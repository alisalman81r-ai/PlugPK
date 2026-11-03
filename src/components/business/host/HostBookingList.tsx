// src/components/business/host/HostBookingList.tsx
'use client'

import { Check, ExternalLink, Loader2, X } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { BOOKING_STATUS_LABEL, formatClock, formatDateLabel, formatSpan, PAYOUT_METHOD_LABEL, type PayoutMethod } from '@/lib/charger-host'
import { decideBooking } from '@/lib/db/host-actions'
import type { HostBookingView } from '@/lib/db/host-queries'
import { formatPkr } from '@/lib/listing-application'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
}

/** `stationName` is set on the admin page, where bookings from every station share one list. */
type ListedBooking = HostBookingView & { stationName?: string }

function BookingCard({ booking }: { booking: ListedBooking }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [declining, setDeclining] = React.useState(false)
  const [note, setNote] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const decide = async (decision: 'confirmed' | 'declined') => {
    setBusy(true)
    setError(null)
    const result = await decideBooking(booking.id, decision, note).catch(() => ({ ok: false, message: 'Could not reach plugpk.' }))
    setBusy(false)
    if (!result.ok) setError(result.message ?? 'Could not update the booking.')
    else {
      setDeclining(false)
      router.refresh()
    }
  }

  return (
    <li className={cn('rounded-xl border bg-white p-4', booking.status === 'pending' ? 'border-amber-300' : 'border-slate-200')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-ui font-bold text-slate-900">
            {formatClock(booking.startTime)} – {formatClock(booking.endTime)}
          </p>
          {booking.stationName ? <p className="text-ui-sm font-semibold text-slate-800">{booking.stationName}</p> : null}
          <p className="text-ui-sm text-slate-600">{booking.chargerLabel}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-ui-xs font-semibold', STATUS_TONE[booking.status])}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-ui-sm sm:grid-cols-2">
        {[
          ['Driver', `${booking.driver.name} · ${booking.driver.email}`],
          ['Car', booking.vehicle ?? '—'],
          [
            'Charge',
            booking.fromPct !== null && booking.toPct !== null
              ? `${booking.fromPct}% → ${booking.toPct}%${booking.energyKwh ? ` · ~${booking.energyKwh} kWh` : ''}${booking.durationMinutes ? ` · ${formatSpan(booking.durationMinutes)}` : ''}`
              : '—',
          ],
          ['Advance', `${formatPkr(booking.fee)} via ${PAYOUT_METHOD_LABEL[booking.payMethod as PayoutMethod] ?? booking.payMethod}`],
          ['Paid by', booking.payerName],
          ['Transaction ID', booking.reference],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 sm:justify-start">
            <dt className="text-slate-500 sm:w-28 sm:shrink-0">{label}</dt>
            <dd className={cn('min-w-0 break-words text-slate-900', label === 'Transaction ID' && 'font-mono font-semibold')}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`/api/booking-receipts/${booking.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-ui-sm font-semibold text-plug-blue-600 hover:underline"
        >
          View receipt <ExternalLink size={12} aria-hidden="true" />
        </a>
        {booking.status === 'pending' ? (
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => decide('confirmed')}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-ui-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && !declining ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setDeclining((value) => !value)}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-ui-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X size={14} />
              Decline
            </button>
          </span>
        ) : null}
      </div>

      {declining ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50/60 p-3">
          <label htmlFor={`decline-${booking.id}`} className="block text-ui-xs font-semibold text-red-900">
            Reason the driver will see *
          </label>
          <textarea
            id={`decline-${booking.id}`}
            rows={2}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. The advance has not reached my account."
            className="mt-1.5 w-full rounded-md border border-red-200 bg-white p-2 text-ui-sm outline-none"
          />
          <button
            type="button"
            onClick={() => decide('declined')}
            disabled={busy || !note.trim()}
            className="mt-2 h-8 rounded-md bg-red-600 px-3 text-ui-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Decline booking
          </button>
        </div>
      ) : null}
      {booking.hostNote && booking.status === 'declined' ? (
        <p className="mt-2 text-ui-xs text-slate-500">You told the driver: {booking.hostNote}</p>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-ui-sm text-red-600">{error}</p> : null}
    </li>
  )
}

/** Upcoming bookings by day. Ones still waiting on the host stand out. */
export function HostBookingList({ bookings }: { bookings: ListedBooking[] }) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-ui-sm text-slate-500">
        No upcoming bookings yet. They appear here as soon as a driver books a slot.
      </p>
    )
  }
  const days = [...new Set(bookings.map((booking) => booking.date))]
  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => (
        <section key={day}>
          <h3 className="mb-2 text-ui-sm font-bold uppercase tracking-wide text-slate-400">{formatDateLabel(day)}</h3>
          <ul className="flex flex-col gap-3">
            {bookings.filter((booking) => booking.date === day).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// src/components/business/host/HostBookingList.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { btnClass, CARD, EmptyCard, FormError, Ico, NOTE_TEXTAREA, Pill, type PillTone } from '@/components/admin/network-kit'
import { BOOKING_STATUS_LABEL, formatClock, formatDateLabel, formatSpan, PAYOUT_METHOD_LABEL, type PayoutMethod } from '@/lib/charger-host'
import { decideBooking } from '@/lib/db/host-actions'
import type { HostBookingView } from '@/lib/db/host-queries'
import { formatPkr } from '@/lib/listing-application'
import { cn } from '@/lib/utils'

import { LIFT, Reveal, useBizEntrance } from './biz-kit'

const STATUS_TONE: Record<string, { tone: PillTone; icon: 'clock' | 'okc' | 'x' | 'undo' }> = {
  pending: { tone: 'warn', icon: 'clock' },
  confirmed: { tone: 'ok', icon: 'okc' },
  declined: { tone: 'bad', icon: 'x' },
  cancelled: { tone: 'unk', icon: 'undo' },
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

  const pending = booking.status === 'pending'
  const status = STATUS_TONE[booking.status] ?? STATUS_TONE.cancelled!
  const facts: [string, React.ReactNode, boolean?][] = [
    ['Driver', <>{booking.driver.name} <span className="text-muted">· {booking.driver.email}</span></>],
    ['Car', booking.vehicle ?? '—'],
    [
      'Charge',
      booking.fromPct !== null && booking.toPct !== null
        ? `${booking.fromPct}% → ${booking.toPct}%${booking.energyKwh ? ` · ~${booking.energyKwh} kWh` : ''}${booking.durationMinutes ? ` · ${formatSpan(booking.durationMinutes)}` : ''}`
        : '—',
    ],
    ['Advance', `${formatPkr(booking.fee)} via ${PAYOUT_METHOD_LABEL[booking.payMethod as PayoutMethod] ?? booking.payMethod}`],
    ['Paid by', booking.payerName],
    ['Transaction ID', booking.reference, true],
  ]

  return (
    <li
      data-biz-in=""
      className={cn(
        CARD,
        LIFT,
        'grid grid-cols-[168px_minmax(0,1fr)] overflow-hidden max-[760px]:grid-cols-1',
        pending && 'border-[rgba(255,176,32,.55)]',
      )}
    >
      {/* The slot: the one thing a host scans for. */}
      <div
        className={cn(
          'flex flex-col justify-between gap-3 border-r border-ink/[.09] p-5 max-[760px]:flex-row max-[760px]:items-center max-[760px]:border-b max-[760px]:border-r-0',
          pending ? 'bg-[rgba(255,176,32,.1)]' : 'bg-paper',
        )}
      >
        <div>
          <b className="block whitespace-nowrap font-mono text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
            {formatClock(booking.startTime)}
          </b>
          <span className="mt-1.5 block font-mono text-xs font-medium text-muted">to {formatClock(booking.endTime)}</span>
        </div>
        <Pill tone={status.tone} icon={status.icon} className="self-start max-[760px]:self-center">
          {BOOKING_STATUS_LABEL[booking.status]}
        </Pill>
      </div>

      <div className="min-w-0 p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {booking.stationName ? (
            <b className="font-display text-lg font-normal leading-tight text-ink">{booking.stationName}</b>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-muted">
            <Ico name="plug" />
            {booking.chargerLabel}
          </span>
        </div>

        <dl className="m-0 mt-3.5 grid grid-cols-2 gap-x-6 gap-y-3 max-[560px]:grid-cols-1">
          {facts.map(([label, value, mono]) => (
            <div key={label} className="min-w-0">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">{label}</dt>
              <dd className={cn('m-0 mt-1 break-words text-sm text-ink', mono && 'font-mono font-semibold')}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-ink/[.09] pt-4">
          <a
            href={`/api/booking-receipts/${booking.id}`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-ink no-underline [&_svg]:h-4 [&_svg]:w-4"
          >
            View receipt
            <Ico name="ext" className="transition-[translate] duration-300 ease-spring group-hover:[translate:3px_-1px]" />
          </a>
          {pending ? (
            <span className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={() => decide('confirmed')} disabled={busy} className={btnClass('ink', 'sm')}>
                {busy && !declining ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setDeclining((value) => !value)}
                disabled={busy}
                aria-expanded={declining}
                className={cn(btnClass('line', 'sm'), declining && 'border-ink')}
              >
                <Ico name="x" />
                Decline
              </button>
            </span>
          ) : null}
        </div>

        {declining ? (
          <Reveal>
            <div className="mt-3.5 rounded-2xl border border-[rgba(255,90,31,.25)] bg-[rgba(255,90,31,.05)] p-3.5">
              <label htmlFor={`decline-${booking.id}`} className="block text-sm font-medium text-[#8f2f0a]">
                Reason the driver will see <span aria-hidden="true">*</span>
              </label>
              <textarea
                id={`decline-${booking.id}`}
                rows={2}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. The advance has not reached my account."
                className={NOTE_TEXTAREA}
              />
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button type="button" onClick={() => decide('declined')} disabled={busy || !note.trim()} className={btnClass('danger', 'sm')}>
                  {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                  Decline booking
                </button>
                <button type="button" onClick={() => setDeclining(false)} disabled={busy} className={btnClass('line', 'sm')}>
                  Keep it
                </button>
              </div>
            </div>
          </Reveal>
        ) : null}
        {booking.hostNote && booking.status === 'declined' ? (
          <p className="mb-0 mt-3 text-[13px] text-muted">You told the driver: {booking.hostNote}</p>
        ) : null}
        {error ? (
          <div className="mt-3">
            <FormError>{error}</FormError>
          </div>
        ) : null}
      </div>
    </li>
  )
}

/** Upcoming bookings by day. Ones still waiting on the host stand out. */
export function HostBookingList({ bookings }: { bookings: ListedBooking[] }) {
  const root = React.useRef<HTMLDivElement>(null)
  useBizEntrance(root)

  if (bookings.length === 0) {
    return (
      <EmptyCard
        icon="inbox"
        title="No upcoming bookings yet"
        text="They appear here as soon as a driver books a slot."
      />
    )
  }
  const days = [...new Set(bookings.map((booking) => booking.date))]
  return (
    <div ref={root} className="grid gap-2">
      {days.map((day) => {
        const list = bookings.filter((booking) => booking.date === day)
        const waiting = list.filter((booking) => booking.status === 'pending').length
        return (
          <section key={day} aria-label={formatDateLabel(day)}>
            <h3
              data-biz-in=""
              className="m-0 mb-2.5 mt-4 flex items-center gap-2.5 px-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink first:mt-0"
            >
              {formatDateLabel(day)}
              <span className="font-sans text-[13px] font-medium normal-case tracking-normal text-muted">
                {list.length} booking{list.length === 1 ? '' : 's'}
                {waiting ? ` · ${waiting} to confirm` : ''}
              </span>
              <i aria-hidden="true" className="h-px flex-1 bg-ink/[.09]" />
            </h3>
            <ul className="m-0 grid list-none gap-3 p-0">
              {list.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

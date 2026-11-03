// src/components/business/host/HostSettingsForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { formatClock, START_STEPS, startStep, startTimes, type HostSettingsView } from '@/lib/charger-host'
import { saveHostSettings, saveStationBookingSettings } from '@/lib/db/host-actions'
import { formatPkr } from '@/lib/listing-application'
import { cn } from '@/lib/utils'

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'

/**
 * What the host charges and when they take bookings. The preview line under
 * the form says, in the driver's words, what this will look like on the
 * listing — so a host sees the effect of "90 minutes, 9 to 9" before saving.
 */
export function HostSettingsForm({
  businessId,
  stationId,
  initial,
  hasPayoutAccount,
}: {
  /** A partner listing, saved by its owner… */
  businessId?: string
  /** …or an operator station, saved by the plugpk team. */
  stationId?: string
  initial: HostSettingsView
  hasPayoutAccount: boolean
}) {
  const router = useRouter()
  const [price, setPrice] = React.useState(initial.pricePerKwh?.toString() ?? '')
  const [enabled, setEnabled] = React.useState(initial.bookingEnabled)
  const [fee, setFee] = React.useState(initial.bookingFee ? String(initial.bookingFee) : '')
  const [slotMinutes, setSlotMinutes] = React.useState(startStep(initial))
  const [openTime, setOpenTime] = React.useState(initial.openTime)
  const [closeTime, setCloseTime] = React.useState(initial.closeTime)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const starts = startTimes({ openTime, closeTime, slotMinutes })

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const input = {
        pricePerKwh: price.trim() ? Number(price) : null,
        bookingEnabled: enabled,
        bookingFee: fee.trim() ? Number(fee) : 0,
        slotMinutes,
        openTime,
        closeTime,
      }
      const result = stationId
        ? await saveStationBookingSettings(stationId, input)
        : await saveHostSettings(businessId ?? '', input)
      if (!result.ok) {
        setMessage({ tone: 'error', text: result.message ?? 'Could not save.' })
        return
      }
      setMessage({ tone: 'ok', text: stationId ? 'Saved. The station page shows the new details.' : 'Saved. Your listing shows the new details.' })
      router.refresh()
    } catch {
      setMessage({ tone: 'error', text: 'Could not reach plugpk. Check your connection and try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor="host-price" className="mb-2 block text-sm font-semibold text-slate-700">
          Price per unit (kWh)
        </label>
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ui-sm font-semibold text-slate-400">PKR</span>
          <input
            id="host-price"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="70"
            className={cn(FIELD, 'pl-14 font-mono')}
          />
        </div>
        <p className="mt-1.5 text-ui-sm text-slate-500">Shown on your listing. Leave empty to not publish a price.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-slate-900">Take bookings</span>
            <span className="mt-0.5 block text-ui-sm text-slate-500">
              {stationId
                ? 'Drivers reserve a time by paying an advance to plugpk. Your team confirms each booking under Admin › Bookings.'
                : 'Drivers reserve a time slot by paying an advance to your payout account.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-plug-blue-600"
          />
        </label>

        {enabled && !hasPayoutAccount ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-ui-sm text-amber-800">
            {stationId
              ? 'No plugpk payment account is set (PAYMENT_* in the environment), so drivers would have nowhere to pay the advance.'
              : 'Add a payout account under Payout accounts first — that is where drivers send the advance.'}
          </p>
        ) : null}

        <div className={cn('mt-5 grid gap-5', !enabled && 'pointer-events-none opacity-50')} aria-disabled={!enabled}>
          <div>
            <label htmlFor="host-fee" className="mb-2 block text-ui-sm font-medium text-slate-600">
              Booking advance
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ui-sm font-semibold text-slate-400">PKR</span>
              <input
                id="host-fee"
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="500"
                className={cn(FIELD, 'pl-14 font-mono')}
              />
            </div>
            <p className="mt-1.5 text-ui-xs text-slate-500">Paid to book, then deducted from the charging bill.</p>
          </div>
          <div>
            <label htmlFor="host-slot" className="mb-2 block text-ui-sm font-medium text-slate-600">
              Bookings can start every
            </label>
            <select id="host-slot" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className={cn(FIELD, 'cursor-pointer')}>
              {START_STEPS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes < 60 ? `${minutes} minutes` : '1 hour'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="host-open" className="mb-2 block text-ui-sm font-medium text-slate-600">
              Open from
            </label>
            <input id="host-open" type="time" step={1800} value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="host-close" className="mb-2 block text-ui-sm font-medium text-slate-600">
              Last car leaves by
            </label>
            <input id="host-close" type="time" step={1800} value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={FIELD} />
          </div>
        </div>

        {enabled ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-ui-sm text-slate-600">
            {starts.length > 0
              ? `Drivers choose their car and charge level, and each booking lasts as long as that charge needs. They can start from ${formatClock(openTime)}, every ${slotMinutes} minutes, and must finish by ${formatClock(closeTime)}${fee ? `, with a ${formatPkr(Number(fee))} advance` : ''}.`
              : 'Closing time must be after opening time.'}
          </p>
        ) : null}
      </div>

      {message ? (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={cn('text-sm', message.tone === 'error' ? 'text-red-600' : 'text-emerald-700')}>
          {message.text}
        </p>
      ) : null}
      <div>
        <Button onClick={save} isLoading={busy}>
          Save pricing and bookings
        </Button>
      </div>
    </div>
  )
}

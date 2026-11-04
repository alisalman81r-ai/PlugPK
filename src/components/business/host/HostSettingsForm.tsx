// src/components/business/host/HostSettingsForm.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { btnClass, FieldSelect, Fld, FormError, Ico, IN } from '@/components/admin/network-kit'
import { formatClock, START_STEPS, startStep, startTimes, type HostSettingsView } from '@/lib/charger-host'
import { saveHostSettings, saveStationBookingSettings } from '@/lib/db/host-actions'
import { formatPkr } from '@/lib/listing-application'
import { cn } from '@/lib/utils'

import { Collapse, FormOk, Reveal, Toggle } from './biz-kit'

/** An .in with a PKR prefix. */
function MoneyInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-muted">
        PKR
      </span>
      <input {...props} className={cn(IN, 'pl-[52px] font-mono')} />
    </span>
  )
}

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
    <div className="grid gap-[18px]">
      <Fld label="Price per unit (kWh)" htmlFor="host-price" hint="Shown on your listing. Leave empty to not publish a price.">
        <MoneyInput
          id="host-price"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="70"
        />
      </Fld>

      <div
        className={cn(
          'rounded-[18px] border p-[18px] transition-[background-color,border-color] duration-300',
          enabled ? 'border-ink/[.09] bg-paper' : 'border-dashed border-ink/[.12] bg-transparent',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <label htmlFor="host-enabled" className="min-w-0 cursor-pointer">
            <span className="block font-display text-lg font-normal leading-tight text-ink">Take bookings</span>
            <span className="mt-1 block text-[13px] leading-snug text-muted">
              {stationId
                ? 'Drivers reserve a time by paying an advance to plugpk. Your team confirms each booking under Admin › Bookings.'
                : 'Drivers reserve a time slot by paying an advance to your payout account.'}
            </span>
          </label>
          <Toggle id="host-enabled" checked={enabled} onChange={setEnabled} label="Take bookings" />
        </div>

        {enabled && !hasPayoutAccount ? (
          <Reveal>
            <p className="mb-0 mt-4 flex items-start gap-2 rounded-xl border border-[rgba(255,176,32,.35)] bg-[rgba(255,176,32,.13)] px-3.5 py-2.5 text-[13px] text-[#6b4b00] [&_svg]:mt-px [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#8a5a00]">
              <Ico name="alert" />
              {stationId
                ? 'No plugpk payment account is set (PAYMENT_* in the environment), so drivers would have nowhere to pay the advance.'
                : 'Add a payout account under Payout accounts first — that is where drivers send the advance.'}
            </p>
          </Reveal>
        ) : null}

        <Collapse open={enabled}>
          <div className="mt-[18px] grid gap-[18px]">
            <Fld label="Booking advance" htmlFor="host-fee" hint="Paid to book, then deducted from the charging bill.">
              <MoneyInput
                id="host-fee"
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="500"
              />
            </Fld>
            <Fld label="Bookings can start every" htmlFor="host-slot">
              <FieldSelect id="host-slot" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
                {START_STEPS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes < 60 ? `${minutes} minutes` : '1 hour'}
                  </option>
                ))}
              </FieldSelect>
            </Fld>
            <div className="grid grid-cols-2 gap-3.5">
              <Fld label="Open from" htmlFor="host-open">
                <input id="host-open" type="time" step={1800} value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={cn(IN, 'px-3 font-mono')} />
              </Fld>
              <Fld label="Last car leaves by" htmlFor="host-close">
                <input id="host-close" type="time" step={1800} value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={cn(IN, 'px-3 font-mono')} />
              </Fld>
            </div>

            {/* The listing as a driver will read it. */}
            <p
              className={cn(
                'm-0 rounded-[14px] px-4 py-3 text-[13px] leading-relaxed',
                starts.length > 0 ? 'bg-ink text-white/80' : 'border border-[rgba(255,90,31,.25)] bg-[rgba(255,90,31,.06)] text-[#b23b0d]',
              )}
            >
              {starts.length > 0 ? (
                <>
                  <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-volt">
                    What drivers see · {starts.length} start time{starts.length === 1 ? '' : 's'} a day
                  </span>
                  Drivers choose their car and charge level, and each booking lasts as long as that charge needs. They can start from{' '}
                  <b className="font-mono text-white">{formatClock(openTime)}</b>, every {slotMinutes} minutes, and must finish by{' '}
                  <b className="font-mono text-white">{formatClock(closeTime)}</b>
                  {fee ? (
                    <>
                      , with a <b className="font-mono text-white">{formatPkr(Number(fee))}</b> advance
                    </>
                  ) : null}
                  .
                </>
              ) : (
                'Closing time must be after opening time.'
              )}
            </p>
          </div>
        </Collapse>
      </div>

      {message ? message.tone === 'error' ? <FormError>{message.text}</FormError> : <FormOk>{message.text}</FormOk> : null}
      <div>
        <button type="button" onClick={save} disabled={busy} className={btnClass('ink')}>
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
          Save pricing and bookings
        </button>
      </div>
    </div>
  )
}

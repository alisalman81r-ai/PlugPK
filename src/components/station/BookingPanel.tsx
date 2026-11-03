// src/components/station/BookingPanel.tsx
'use client'

import { BatteryCharging, CalendarCheck, Car, Check, CheckCircle2, Clock, Copy, Loader2, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { DocumentPicker } from '@/components/business/application/DocumentPicker'
import { MyCarHint } from '@/components/tools/MyCarHint'
import { Button } from '@/components/ui'
import {
  bookableDates,
  formatClock,
  formatDateLabel,
  formatSpan,
  HANDOVER_MINUTES,
  PAYOUT_METHOD_LABEL,
  planCharge,
  type BookingCar,
  type ChargePlan,
  type HostSettingsView,
  type PayoutAccountView,
} from '@/lib/charger-host'
import { createBooking, getAvailability, type Availability, type BookableCharger } from '@/lib/db/host-actions'
import { formatPkr } from '@/lib/listing-application'
import { useMyCar } from '@/hooks/useMyCar'
import { cn } from '@/lib/utils'

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'

const CUSTOM = '__custom__'
/** The car a driver picked last time, so a returning driver starts one step in. */
const CAR_MEMORY = 'plugpk:booking-car'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard refused; the number is on screen to copy by hand.
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-ui-xs font-semibold text-plug-blue-600 hover:bg-plug-blue-50"
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <p className="mb-3 flex items-center gap-2.5 text-sm font-bold text-slate-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-plug-blue-600 text-[11px] font-bold text-white">
          {number}
        </span>
        {title}
      </p>
      {children}
    </div>
  )
}

/** A percentage chosen with a slider, with the number beside it. */
function PercentSlider({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-ui-sm font-medium text-slate-600">
          {label}
        </label>
        <span className="font-mono text-lg font-bold text-slate-900">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-plug-blue-600"
      />
    </div>
  )
}

/**
 * Book a partner's charger for exactly as long as your charge needs.
 *
 * The driver answers three things — which car, how full it is, how full they
 * want it — and the panel works out the time on each charger with the same
 * arithmetic as the charging calculator, plus a few minutes to plug in and
 * move off. Only start times where that whole stretch is free are offered;
 * a charger with more than one port can take overlapping bookings up to its
 * port count, never beyond. The server repeats every one of these checks.
 */
export function BookingPanel({
  venue,
  stationPath,
  listingName,
  settings,
  accounts,
  cars,
}: {
  /** "business:<id>" for a partner listing, "station:<id>" for an operator station. */
  venue: string
  /** This page's path, to come back to after signing in. */
  stationPath: string
  listingName: string
  settings: HostSettingsView
  accounts: PayoutAccountView[]
  cars: BookingCar[]
}) {
  const dates = React.useMemo(() => bookableDates(), [])
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null)

  // 1. Car
  const [carSlug, setCarSlug] = React.useState('')
  const [customBattery, setCustomBattery] = React.useState('')
  const [customName, setCustomName] = React.useState('')
  // 2. Charge
  const [fromPct, setFromPct] = React.useState(20)
  const [toPct, setToPct] = React.useState(80)
  // 3. Charger and day
  const [chargers, setChargers] = React.useState<BookableCharger[] | null>(null)
  const [listingMessage, setListingMessage] = React.useState<string | null>(null)
  const [chargerId, setChargerId] = React.useState('')
  const [date, setDate] = React.useState(dates[0] ?? '')
  // 4. Start
  const [starts, setStarts] = React.useState<Availability['starts'] | null>(null)
  const [loadingStarts, setLoadingStarts] = React.useState(false)
  const [start, setStart] = React.useState('')
  // 5. Payment
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? '')
  const [payerName, setPayerName] = React.useState('')
  const [reference, setReference] = React.useState('')
  const [receipt, setReceipt] = React.useState<File | undefined>()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<{ start: string; end: string } | null>(null)

  React.useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { user: unknown }) => setSignedIn(Boolean(body.user)))
      .catch(() => setSignedIn(false))
  }, [])

  /*
    Which car to start with: the driver's own, from their garage; failing that,
    the one last booked with on this device; failing that, none. Decided once,
    and never over a car the driver has already picked here.
  */
  const myCar = useMyCar()
  const startedCar = React.useRef(false)
  React.useEffect(() => {
    if (myCar === undefined || startedCar.current) return
    startedCar.current = true
    if (myCar && cars.some((car) => car.slug === myCar.slug)) {
      setCarSlug((current) => current || myCar.slug)
      return
    }
    try {
      const remembered = window.localStorage.getItem(CAR_MEMORY)
      if (remembered && cars.some((car) => car.slug === remembered)) setCarSlug((current) => current || remembered)
    } catch {
      // Storage unavailable (private window): the driver picks the car again.
    }
  }, [myCar, cars])

  // The listing's chargers, once.
  React.useEffect(() => {
    getAvailability(venue, dates[0] ?? '')
      .then((result) => {
        if (!result.ok) {
          setListingMessage(result.message ?? 'This listing is not taking bookings.')
          setChargers([])
          return
        }
        setChargers(result.chargers)
      })
      .catch(() => setListingMessage('Could not load this listing’s chargers. Check your connection.'))
  }, [venue, dates])

  const car = cars.find((item) => item.slug === carSlug)
  const battery = carSlug === CUSTOM ? Number(customBattery) : (car?.batteryKwh ?? null)
  const carReady = carSlug === CUSTOM ? Number.isFinite(battery) && (battery as number) >= 5 && (battery as number) <= 250 : Boolean(car)

  /** This charge, timed on one charger. */
  const planFor = React.useCallback(
    (charger: BookableCharger): ChargePlan | null => {
      if (!carReady) return null
      return planCharge({
        batteryKwh: battery,
        acKw: carSlug === CUSTOM ? null : (car?.acKw ?? null),
        dcKw: carSlug === CUSTOM ? null : (car?.dcKw ?? null),
        connectorType: charger.connectorType,
        chargerKw: charger.maxPowerKw,
        fromPct,
        toPct,
      })
    },
    [battery, car, carReady, carSlug, fromPct, toPct],
  )

  // Pick the quickest working charger by default, and move off one that stops being usable.
  React.useEffect(() => {
    if (!chargers || !carReady) return
    const usable = chargers.filter((charger) => charger.bookable && planFor(charger)?.ok)
    if (usable.some((charger) => charger.id === chargerId)) return
    const quickest = usable
      .map((charger) => ({ charger, plan: planFor(charger) }))
      .sort((a, b) => (a.plan?.ok ? a.plan.minutes : 1e9) - (b.plan?.ok ? b.plan.minutes : 1e9))[0]
    setChargerId(quickest?.charger.id ?? '')
  }, [chargers, carReady, chargerId, planFor])

  const charger = chargers?.find((item) => item.id === chargerId)
  const plan = charger ? planFor(charger) : null
  const minutes = plan?.ok ? plan.minutes : null

  // Start times that fit, refreshed whenever the day, charger or duration changes.
  React.useEffect(() => {
    setStart('')
    if (!chargerId || !minutes || !date) {
      setStarts(null)
      return
    }
    let cancelled = false
    setLoadingStarts(true)
    const timer = window.setTimeout(() => {
      getAvailability(venue, date, { chargerId, minutes })
        .then((result) => {
          if (!cancelled) setStarts(result.ok ? result.starts : [])
        })
        .catch(() => {
          if (!cancelled) setStarts([])
        })
        .finally(() => {
          if (!cancelled) setLoadingStarts(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [venue, chargerId, date, minutes])

  const chosen = starts?.find((option) => option.start === start)
  const account = accounts.find((item) => item.id === accountId)
  const cost = plan?.ok && settings.pricePerKwh ? Math.round(plan.gridKwh * settings.pricePerKwh) : null

  const chooseCar = (slug: string) => {
    setCarSlug(slug)
    try {
      if (slug && slug !== CUSTOM) window.localStorage.setItem(CAR_MEMORY, slug)
    } catch {
      // Not remembered; nothing else depends on it.
    }
  }

  const submit = async () => {
    setError(null)
    if (!charger || !plan?.ok || !chosen) return setError('Choose a start time.')
    if (!accountId) return setError('Choose the account you paid into.')
    if (!payerName.trim()) return setError('Enter the name on the account you paid from.')
    if (reference.trim().length < 4) return setError('Enter the transaction ID from your receipt.')
    if (!receipt) return setError('Upload your payment receipt.')

    const form = new FormData()
    form.set('venue', venue)
    form.set('chargerId', charger.id)
    form.set('date', date)
    form.set('start', chosen.start)
    form.set('fromPct', String(fromPct))
    form.set('toPct', String(toPct))
    if (carSlug === CUSTOM) {
      form.set('batteryKwh', customBattery)
      form.set('carName', customName)
    } else {
      form.set('carSlug', carSlug)
    }
    form.set('payoutAccountId', accountId)
    form.set('payerName', payerName)
    form.set('reference', reference)
    form.set('file', receipt)

    setBusy(true)
    try {
      const result = await createBooking(form)
      if (!result.ok) {
        setError(result.message ?? 'Could not book that time.')
        // Someone else got there first: show what is still free.
        if (result.message?.includes('moment ago')) {
          const fresh = await getAvailability(venue, date, { chargerId: charger.id, minutes: plan.minutes })
          setStarts(fresh.ok ? fresh.starts : [])
          setStart('')
        }
        return
      }
      setDone({ start: chosen.start, end: chosen.end })
    } catch {
      setError('Could not reach plugpk. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <CheckCircle2 size={28} className="text-emerald-600" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">Booking request sent</h3>
        <p className="mt-1 text-ui-sm text-slate-700">
          {formatDateLabel(date)}, {formatClock(done.start)} – {formatClock(done.end)} at {listingName}. The charger is held
          for you while the host checks your {formatPkr(settings.bookingFee)} advance, then they confirm it.
        </p>
        <Link href="/dashboard/bookings" className="mt-4 inline-flex text-ui-sm font-semibold text-plug-blue-700 hover:underline">
          Track it in My bookings →
        </Link>
      </div>
    )
  }

  if (listingMessage) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-5 text-ui-sm text-slate-500">{listingMessage}</p>
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="mb-6 rounded-xl bg-plug-blue-50/70 px-4 py-3 text-ui-sm text-slate-700">
        Tell us your car and how much charge you need — we work out how long it takes and show the times that are free.
        A <strong>{formatPkr(settings.bookingFee)}</strong> advance holds it, deducted from your bill
        {settings.pricePerKwh ? ` at ${formatPkr(settings.pricePerKwh)} per unit` : ''}.
      </p>

      <div className="flex flex-col gap-6">
        {/* ── 1. Car ─────────────────────────── */}
        <Step number={1} title="Your car">
          <div className="relative">
            <Car size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <select
              aria-label="Your car"
              value={carSlug}
              onChange={(e) => chooseCar(e.target.value)}
              className={cn(FIELD, 'cursor-pointer pl-11')}
            >
              <option value="">Choose your car</option>
              {cars.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.batteryKwh} kWh
                </option>
              ))}
              <option value={CUSTOM}>My car is not listed</option>
            </select>
          </div>
          {myCar && cars.some((item) => item.slug === myCar.slug) ? (
            <div className="mt-2">
              <MyCarHint car={myCar} selected={carSlug} onUse={chooseCar} />
            </div>
          ) : null}
          {carSlug === CUSTOM ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                aria-label="Car name"
                maxLength={80}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Car (e.g. Honda e:NS1)"
                className={FIELD}
              />
              <div className="relative">
                <input
                  aria-label="Battery size in kWh"
                  inputMode="decimal"
                  value={customBattery}
                  onChange={(e) => setCustomBattery(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                  placeholder="Battery size"
                  className={cn(FIELD, 'pr-14 font-mono')}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ui-sm font-semibold text-slate-400">kWh</span>
              </div>
            </div>
          ) : null}
        </Step>

        {/* ── 2. Charge ──────────────────────── */}
        <Step number={2} title="How much charge">
          <div className="grid gap-5 sm:grid-cols-2">
            <PercentSlider
              id="booking-from"
              label="Battery now"
              value={fromPct}
              min={0}
              max={95}
              onChange={(value) => {
                setFromPct(value)
                if (toPct <= value) setToPct(Math.min(100, value + 5))
              }}
            />
            <PercentSlider
              id="booking-to"
              label="Charge up to"
              value={toPct}
              min={5}
              max={100}
              onChange={(value) => {
                setToPct(value)
                if (fromPct >= value) setFromPct(Math.max(0, value - 5))
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[80, 90, 100].map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => {
                  setToPct(target)
                  if (fromPct >= target) setFromPct(target - 5)
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-ui-xs font-semibold',
                  toPct === target ? 'border-plug-blue-500 bg-plug-blue-50 text-plug-blue-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                Up to {target}%
              </button>
            ))}
          </div>
        </Step>

        {/* ── 3. Charger ─────────────────────── */}
        <Step number={3} title="Charger">
          {!chargers ? (
            <p className="flex items-center gap-2 text-ui-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Loading chargers…
            </p>
          ) : !carReady ? (
            <p className="text-ui-sm text-slate-500">Choose your car first — the time depends on it.</p>
          ) : (
            <div className="grid gap-2" role="radiogroup" aria-label="Charger">
              {chargers.map((item) => {
                const itemPlan = planFor(item)
                const usable = item.bookable && itemPlan?.ok
                const on = item.id === chargerId
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!usable}
                    onClick={() => setChargerId(item.id)}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors',
                      on ? 'border-plug-blue-500 bg-plug-blue-50' : usable ? 'border-slate-200 hover:bg-slate-50' : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-ui-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="block text-ui-xs text-slate-500">
                        {item.ports} port{item.ports === 1 ? '' : 's'}
                        {!item.bookable ? (item.condition === 'maintenance' ? ' · under maintenance' : ' · not working') : ''}
                      </span>
                    </span>
                    {item.bookable ? (
                      itemPlan?.ok ? (
                        <span className="flex items-center gap-1.5 font-mono text-ui-sm font-bold text-slate-900">
                          <Clock size={14} className="text-slate-400" aria-hidden="true" />
                          {formatSpan(itemPlan.minutes)}
                        </span>
                      ) : (
                        <span className="max-w-[14rem] text-right text-ui-xs text-amber-700">{itemPlan?.message}</span>
                      )
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          {plan?.ok ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
              {[
                { icon: Zap, label: 'Charging', value: `~${formatSpan(Math.max(1, plan.chargeMinutes))}` },
                { icon: Clock, label: 'Booking holds', value: formatSpan(plan.minutes) },
                { icon: BatteryCharging, label: 'Adds', value: `~${plan.energyKwh} kWh` },
                { icon: CalendarCheck, label: 'Approx. bill', value: cost ? formatPkr(cost) : '—' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="flex items-center gap-1 text-ui-xs text-slate-500">
                    <item.icon size={12} aria-hidden="true" />
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 font-mono text-ui-sm font-bold text-slate-900">{item.value}</dd>
                </div>
              ))}
              <p className="col-span-full text-ui-xs text-slate-400">
                Estimated for {plan.mode === 'dc' ? 'DC fast' : 'AC'} charging at up to {plan.powerKw} kW, plus {HANDOVER_MINUTES} minutes to plug in and move off.
              </p>
            </dl>
          ) : null}
        </Step>

        {/* ── 4. Day and time ────────────────── */}
        <Step number={4} title="Day and start time">
          <div className="scrollbar-hide -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {dates.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={day === date}
                onClick={() => setDate(day)}
                className={cn(
                  'shrink-0 rounded-xl border-[1.5px] px-3 py-2 text-ui-sm font-semibold transition-colors',
                  day === date ? 'border-plug-blue-500 bg-plug-blue-50 text-plug-blue-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {day === dates[0] ? 'Today' : formatDateLabel(day)}
              </button>
            ))}
          </div>

          {!minutes ? (
            <p className="text-ui-sm text-slate-500">Choose your car, charge and charger to see free times.</p>
          ) : loadingStarts && !starts ? (
            <p className="flex items-center gap-2 text-ui-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Finding free times…
            </p>
          ) : starts && starts.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-ui-sm text-amber-800">
              No free {formatSpan(minutes)} window on {formatDateLabel(date)}. Try another day, a lower target, or another charger.
            </p>
          ) : starts ? (
            <>
              <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', loadingStarts && 'opacity-60')}>
                {starts.map((option) => {
                  const on = option.start === start
                  return (
                    <button
                      key={option.start}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setStart(option.start)
                        setError(null)
                      }}
                      className={cn(
                        'rounded-lg border-[1.5px] px-3 py-2 text-left transition-colors',
                        on ? 'border-plug-blue-500 bg-plug-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-plug-blue-300 hover:bg-plug-blue-50',
                      )}
                    >
                      <span className="block text-ui-sm font-semibold">
                        {formatClock(option.start)} – {formatClock(option.end)}
                      </span>
                      {charger && charger.ports > 1 ? (
                        <span className={cn('block text-[11px]', on ? 'text-white/80' : 'text-slate-400')}>
                          {option.portsLeft} of {charger.ports} ports free
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-ui-xs text-slate-400">Only times where your whole charge fits are shown.</p>
            </>
          ) : null}
        </Step>

        {/* A booking refused because the time was just taken clears the chosen
            time (the list is refreshed), and the message has to survive that. */}
        {error && !chosen ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {/* ── 5. Pay and book ────────────────── */}
        {chosen && plan?.ok ? (
          signedIn === false ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-ui-sm text-slate-600">
                Sign in to book {formatClock(chosen.start)} – {formatClock(chosen.end)} on {formatDateLabel(date)}.
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent(`${stationPath}#book`)}`}
                className="mt-3 inline-flex h-10 items-center rounded-xl bg-plug-blue-600 px-5 text-ui-sm font-semibold text-white hover:bg-plug-blue-700"
              >
                Sign in to book
              </Link>
            </div>
          ) : (
            <Step number={5} title={`Pay the ${formatPkr(settings.bookingFee)} advance and book`}>
              <p className="mb-3 text-ui-sm text-slate-500">Send it to the host, then tell us which account you paid.</p>
              <div className="mb-5 grid gap-3">
                {accounts.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer gap-4 rounded-xl border-[1.5px] p-4 transition-colors',
                      item.id === accountId ? 'border-plug-blue-500 bg-plug-blue-50/50' : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <input type="radio" name="payout" checked={item.id === accountId} onChange={() => setAccountId(item.id)} className="mt-1 accent-plug-blue-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-ui-sm font-semibold text-slate-900">
                        {item.method === 'bank' ? item.provider : PAYOUT_METHOD_LABEL[item.method]}
                      </span>
                      <span className="block text-ui-sm text-slate-600">{item.accountTitle}</span>
                      <span className="flex items-center gap-1 font-mono text-ui-sm text-slate-900">
                        {item.accountNumber}
                        <CopyButton value={item.accountNumber} label="account number" />
                      </span>
                      {item.iban ? (
                        <span className="flex items-center gap-1 font-mono text-ui-xs text-slate-500">
                          {item.iban}
                          <CopyButton value={item.iban} label="IBAN" />
                        </span>
                      ) : null}
                    </span>
                    {item.hasQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/payout-qr/${item.id}`} alt={`QR code for ${item.accountTitle}`} className="h-28 w-28 shrink-0 rounded-lg border border-slate-200 bg-white object-contain" />
                    ) : null}
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-payer" className="mb-2 block text-ui-sm font-medium text-slate-600">Name on your account</label>
                  <input id="booking-payer" maxLength={120} value={payerName} onChange={(e) => setPayerName(e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="booking-reference" className="mb-2 block text-ui-sm font-medium text-slate-600">Transaction ID</label>
                  <input id="booking-reference" maxLength={60} value={reference} onChange={(e) => setReference(e.target.value)} className={cn(FIELD, 'font-mono')} />
                </div>
              </div>
              <div className="mt-4">
                <DocumentPicker id="booking-receipt" label="Payment receipt" required allowPdf file={receipt} onChange={setReceipt} hint="A screenshot of the confirmation, up to 4 MB" />
              </div>

              {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
              <Button fullWidth size="lg" className="mt-5 h-12" isLoading={busy} onClick={submit} disabled={signedIn === null}>
                <CalendarCheck size={18} aria-hidden="true" />
                Book {formatClock(chosen.start)} – {formatClock(chosen.end)}, {formatDateLabel(date)}
              </Button>
              <p className="mt-2 text-center text-ui-xs text-slate-400">
                {account ? `Paying ${account.accountTitle}. ` : ''}The host confirms once they see your advance.
              </p>
            </Step>
          )
        ) : null}
      </div>
    </div>
  )
}

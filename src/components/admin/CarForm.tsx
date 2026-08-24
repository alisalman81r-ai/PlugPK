// src/components/admin/CarForm.tsx
'use client'

import { AlertTriangle, Check, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { createCar, updateCar, type CarActionResult } from '@/lib/db/car-actions'
import { cn } from '@/lib/utils'

import { AdminField, FIELD_CLASS, TEXTAREA_CLASS } from './AdminField'

/**
 * Every editable field on a car, in one form.
 *
 * ── Blank means "not published", and the form has to say so ────────────
 *
 * The catalogue's governing rule is that nothing is invented: a car with no
 * published DC charging figure stores null, never a plausible number. So the
 * placeholder on every optional numeric field is the words "not published"
 * rather than a greyed-out example figure. An example in a placeholder is the
 * fastest way to end up with an invented number in a price database — somebody
 * reads it as a default and types something near it.
 *
 * It also means a figure can be *removed*: clearing a field writes null rather
 * than being skipped as "unchanged", which is what stops a wrong number becoming
 * permanent once entered.
 *
 * ── Why the powertrain switch changes the form ─────────────────────────
 *
 * A full hybrid has no plug, so its charging fields are disabled rather than
 * merely ignored. Leaving them editable would let the portal write a DC speed
 * onto a car that cannot be charged, which would then appear in the public
 * catalogue's DC filter — the server rejects it too, but a control you can fill
 * in and then be told off for is a worse control than one that is visibly not
 * applicable.
 *
 * Likewise an EV has no engine and a hybrid has no meaningful electric-only
 * range. The fields stay on the page, greyed, so the shape of a car is legible
 * rather than fields appearing and disappearing under the cursor.
 */

export interface CarFormProps {
  /** Absent when creating. */
  car?: Car
  /** Brands already in the catalogue, offered as a datalist. */
  brands: string[]
}

const CATEGORIES: { value: CarCategory; label: string; hint: string }[] = [
  { value: 'EV', label: 'EV', hint: 'Battery only, no engine' },
  { value: 'PHEV', label: 'PHEV', hint: 'Plug-in hybrid: engine plus a chargeable battery' },
  { value: 'REEV', label: 'REEV', hint: 'Engine charges the battery, never drives the wheels' },
  { value: 'Hybrid', label: 'Hybrid', hint: 'Full hybrid: no plug, charges itself' },
]

const CONNECTORS: ConnectorStandard[] = ['CCS2', 'Type 2', 'GB/T', 'CHAdeMO']

/** What each powertrain can actually carry. Mirrors the server's own rules. */
function applicability(category: CarCategory) {
  const plugged = category !== 'Hybrid'
  const burnsFuel = category !== 'EV'

  return {
    charging: plugged,
    connectors: plugged,
    // A plug-in quotes electric-only range; a full EV quotes total range.
    electricRange: category === 'PHEV' || category === 'REEV',
    totalRange: category === 'EV',
    engine: burnsFuel,
    // A hybrid's pack is tiny and often unpublished, but it is not nonsense.
    battery: true,
  }
}

export function CarForm({ car, brands }: CarFormProps) {
  const router = useRouter()
  const isNew = car === undefined

  const [category, setCategory] = React.useState<CarCategory>(car?.category ?? 'EV')
  const [pending, setPending] = React.useState(false)
  const [result, setResult] = React.useState<CarActionResult | null>(null)

  const can = applicability(category)
  const errors = result?.errors ?? {}

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setPending(true)
    setResult(null)

    const outcome = isNew ? await createCar(form) : await updateCar(car.id, form)

    setPending(false)
    setResult(outcome)

    if (outcome.ok && outcome.slug) {
      // A rename changes the URL this page lives at, and a create has no page
      // yet, so both navigate rather than relying on a revalidate.
      if (isNew || outcome.slug !== car?.slug) {
        router.push(`/admin/cars/${outcome.slug}`)
      } else {
        router.refresh()
      }
    }

    // The banner is above the fold; a save reported at the bottom of a form
    // this tall is a save nobody sees.
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {result?.message ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-4 text-ui-sm',
            result.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
        >
          {result.ok ? (
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <div>
            <p className="font-semibold">{result.message}</p>
            {!result.ok && result.errors ? (
              <p className="mt-0.5">Scroll down for the fields marked in red.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Identity ─────────────────────────────────────────────── */}
      <Group title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Brand" htmlFor="brand" required>
            <input
              id="brand"
              name="brand"
              list="car-brands"
              defaultValue={car?.brand ?? ''}
              className={cn(FIELD_CLASS, errors.brand && 'border-red-400')}
            />
            {/* Existing brands offered, not enforced: a new brand arriving in
                Pakistan must not need a code change to be listed. */}
            <datalist id="car-brands">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <FieldError message={errors.brand} />
          </AdminField>

          <AdminField label="Model" htmlFor="model" required>
            <input
              id="model"
              name="model"
              defaultValue={car?.model ?? ''}
              className={cn(FIELD_CLASS, errors.model && 'border-red-400')}
            />
            <FieldError message={errors.model} />
          </AdminField>

          <AdminField
            label="Full name"
            htmlFor="fullName"
            hint="Shown as the heading. Left blank, it becomes brand + model."
          >
            <input
              id="fullName"
              name="fullName"
              defaultValue={car?.fullName ?? ''}
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField
            label="Slug"
            htmlFor="slug"
            required
            hint={
              isNew
                ? 'The public URL. Left blank, it is made from brand and model.'
                : 'Changing this changes the public URL, and any existing link to it stops working.'
            }
          >
            <input
              id="slug"
              name="slug"
              defaultValue={car?.slug ?? ''}
              className={cn(FIELD_CLASS, 'font-mono text-ui-sm', errors.slug && 'border-red-400')}
            />
            <FieldError message={errors.slug} />
          </AdminField>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-ui-sm font-medium text-slate-700">
            Powertrain <span className="text-red-500">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((entry) => (
              <label
                key={entry.value}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors',
                  category === entry.value
                    ? 'border-plug-blue-500 bg-plug-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={entry.value}
                    checked={category === entry.value}
                    onChange={() => setCategory(entry.value)}
                    className="h-4 w-4 accent-plug-blue-600"
                  />
                  <span className="font-semibold text-slate-900">{entry.label}</span>
                </span>
                <span className="pl-6 text-ui-xs leading-relaxed text-slate-500">{entry.hint}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.category} />
        </fieldset>
      </Group>

      {/* ── Price ────────────────────────────────────────────────── */}
      <Group
        title="Price"
        note="Stored in rupees as integers so the catalogue can sort on them, and as the published string so nothing is recomputed. If a price is an estimate rather than a dealer figure, put “(indicative)” in the display text — the admin catalogue counts those, and the marker is printed on every card."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Lower price (PKR)" htmlFor="priceMin" required>
            <input
              id="priceMin"
              name="priceMin"
              inputMode="numeric"
              defaultValue={car ? String(car.price.min) : ''}
              placeholder="7290000"
              className={cn(FIELD_CLASS, 'font-mono', errors.priceMin && 'border-red-400')}
            />
            <FieldError message={errors.priceMin} />
          </AdminField>

          <AdminField
            label="Upper price (PKR)"
            htmlFor="priceMax"
            hint="Same as the lower price for a single figure."
          >
            <input
              id="priceMax"
              name="priceMax"
              inputMode="numeric"
              defaultValue={car ? String(car.price.max) : ''}
              placeholder="same as lower"
              className={cn(FIELD_CLASS, 'font-mono', errors.priceMax && 'border-red-400')}
            />
            <FieldError message={errors.priceMax} />
          </AdminField>

          <AdminField label="Displayed as" htmlFor="priceDisplay" required>
            <input
              id="priceDisplay"
              name="priceDisplay"
              defaultValue={car?.price.display ?? ''}
              placeholder="PKR 72.9 Lakh"
              className={cn(FIELD_CLASS, errors.priceDisplay && 'border-red-400')}
            />
            <FieldError message={errors.priceDisplay} />
          </AdminField>
        </div>
      </Group>

      {/* ── Battery and range ────────────────────────────────────── */}
      <Group title="Battery and range">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Numeric
            name="batteryCapacity"
            label="Battery capacity"
            unit="kWh"
            value={car?.batteryCapacity}
            error={errors.batteryCapacity}
            enabled={can.battery}
          />
          <Numeric
            name="range"
            label="Range"
            unit="km"
            value={car?.range}
            error={errors.range}
            enabled={can.totalRange}
            disabledNote="Only an EV quotes a full-charge range."
          />
          <Numeric
            name="rangeMax"
            label="Range, upper figure"
            unit="km"
            value={car?.rangeMax}
            error={errors.rangeMax}
            enabled={can.totalRange}
            hint="Only when the source quoted a span."
          />
          <Numeric
            name="electricRange"
            label="Electric-only range"
            unit="km"
            value={car?.electricRange}
            error={errors.electricRange}
            enabled={can.electricRange}
            disabledNote={
              category === 'EV'
                ? 'An EV is electric-only — use Range.'
                : 'A full hybrid has no meaningful electric-only range.'
            }
          />
          <Numeric
            name="electricRangeMax"
            label="Electric range, upper figure"
            unit="km"
            value={car?.electricRangeMax}
            error={errors.electricRangeMax}
            enabled={can.electricRange}
          />
        </div>
      </Group>

      {/* ── Performance ──────────────────────────────────────────── */}
      <Group title="Performance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Numeric
            name="power"
            label="Power"
            unit="hp"
            value={car?.power}
            error={errors.power}
            hint={can.engine ? 'Combined system output.' : undefined}
          />
          <Numeric
            name="acceleration"
            label="0–100 km/h"
            unit="sec"
            value={car?.acceleration}
            error={errors.acceleration}
          />
          <Numeric
            name="engineCapacity"
            label="Engine capacity"
            unit="cc"
            value={car?.engineCapacity}
            error={errors.engineCapacity}
            enabled={can.engine}
            disabledNote="An EV has no engine."
          />
          <Numeric name="torque" label="Torque" unit="Nm" value={car?.torque} error={errors.torque} />
          <Numeric
            name="topSpeed"
            label="Top speed"
            unit="km/h"
            value={car?.topSpeed}
            error={errors.topSpeed}
          />
          <Numeric name="seats" label="Seats" value={car?.seats} error={errors.seats} />
        </div>
      </Group>

      {/* ── Charging ─────────────────────────────────────────────── */}
      <Group
        title="Charging"
        note={
          can.charging
            ? undefined
            : 'A full hybrid charges its own battery from the engine and braking, and has no charging port — so these stay empty. The server rejects them too.'
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Numeric
            name="dcCharging"
            label="DC charging"
            unit="kW"
            value={car?.dcCharging}
            error={errors.dcCharging}
            enabled={can.charging}
          />
          <Numeric
            name="acCharging"
            label="AC charging"
            unit="kW"
            value={car?.acCharging}
            error={errors.acCharging}
            enabled={can.charging}
          />
        </div>

        <fieldset className="mt-4" disabled={!can.connectors}>
          <legend className="mb-1.5 text-ui-sm font-medium text-slate-700">Connectors</legend>
          <p className="mb-2 text-ui-xs text-slate-500">
            Leave all unticked when the source did not state a standard — that is different from
            stating it has none.
          </p>
          <div className="flex flex-wrap gap-2">
            {CONNECTORS.map((connector) => (
              <label
                key={connector}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-ui-sm transition-colors hover:bg-slate-50',
                  !can.connectors && 'cursor-not-allowed opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  name="connectors"
                  value={connector}
                  defaultChecked={car?.connector?.includes(connector) ?? false}
                  className="h-4 w-4 rounded accent-plug-blue-600"
                />
                <span className="font-mono">{connector}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.connectors} />
        </fieldset>
      </Group>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <Group
        title="Notes"
        note="Printed under the specifications on the public page. The place for a qualifier a number alone would lose — “90+ km”, an assembler’s name, or why a figure is missing."
      >
        <AdminField label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={car?.notes ?? ''}
            className={TEXTAREA_CLASS}
          />
        </AdminField>
      </Group>

      {/* Sticky, because this form is taller than any screen and a save button
          at the bottom of it is a save button nobody finds. */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-1 py-4 backdrop-blur">
        <p className="text-ui-xs text-slate-500">
          A blank numeric field is saved as <strong>not published</strong>, not as zero.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-plug-blue-600 px-5 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          {pending ? 'Saving…' : isNew ? 'Create car' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function Group({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <h2 className="text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">{title}</h2>
        {note ? (
          <p className="mt-1.5 max-w-3xl text-ui-xs leading-relaxed text-slate-500">{note}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-ui-xs font-medium text-red-600">
      <AlertTriangle size={12} aria-hidden="true" />
      {message}
    </p>
  )
}

/**
 * One optional numeric field.
 *
 * `enabled={false}` disables the input and states why rather than hiding it. A
 * field that vanishes when the powertrain changes makes the form feel unstable
 * and hides the shape of what a car can carry; a greyed field with a reason
 * teaches it. A disabled input submits nothing, which is exactly right — the
 * server writes null for anything absent.
 */
function Numeric({
  name,
  label,
  unit,
  value,
  error,
  hint,
  enabled = true,
  disabledNote,
}: {
  name: string
  label: string
  unit?: string
  value?: number | null
  error?: string
  hint?: string
  enabled?: boolean
  disabledNote?: string
}) {
  return (
    <AdminField
      label={unit ? `${label} (${unit})` : label}
      htmlFor={name}
      hint={enabled ? hint : (disabledNote ?? 'Not applicable to this powertrain.')}
    >
      <input
        id={name}
        name={name}
        inputMode="decimal"
        disabled={!enabled}
        defaultValue={value !== null && value !== undefined ? String(value) : ''}
        placeholder={enabled ? 'not published' : 'not applicable'}
        className={cn(FIELD_CLASS, 'font-mono', error && 'border-red-400')}
      />
      <FieldError message={error} />
    </AdminField>
  )
}

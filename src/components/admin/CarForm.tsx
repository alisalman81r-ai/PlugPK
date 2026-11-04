// src/components/admin/CarForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { createCar, updateCar, type CarActionResult } from '@/lib/db/car-actions'

import { useAdminToast } from './AdminToast'
import { Ico, Spinner, k, rise, s } from './people/kit'
import { runAction } from './run-action'
import { useUnsavedChanges } from './useUnsavedChanges'

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
  const toast = useAdminToast()
  const formRef = React.useRef<HTMLFormElement>(null)
  const { markClean } = useUnsavedChanges(formRef)

  const can = applicability(category)
  const errors = result?.errors ?? {}

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setPending(true)
    setResult(null)

    const outcome: CarActionResult = await runAction(() => (!car ? createCar(form) : updateCar(car.id, form)))

    setPending(false)
    setResult(outcome)

    if (outcome.ok) {
      markClean()
      toast.success(outcome.message ?? 'Saved.')
    }

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
    <form ref={formRef} onSubmit={onSubmit} className={s.stack18}>
      {result?.message ? (
        <div role="status" aria-live="polite" className={k('notice', result.ok ? 'notice--ok' : 'notice--bad')} style={{ margin: 0 }}>
          <Ico n={result.ok ? 'okc' : 'alert'} />
          <div>
            <b>{result.message}</b>
            {!result.ok && result.errors ? <span>Scroll down for the fields marked in red.</span> : null}
          </div>
        </div>
      ) : null}

      {/* ── Identity ─────────────────────────────────────────────── */}
      <Group title="Identity" sub="What the car is called, and where its public page lives." i={0}>
        <div className={s.fgrid}>
          <Field label="Brand" htmlFor="brand" required error={errors.brand}>
            <input id="brand" name="brand" list="car-brands" defaultValue={car?.brand ?? ''} className={k('in', errors.brand && 'bad')} />
            {/* Existing brands offered, not enforced: a new brand arriving in
                Pakistan must not need a code change to be listed. */}
            <datalist id="car-brands">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </Field>

          <Field label="Model" htmlFor="model" required error={errors.model}>
            <input id="model" name="model" defaultValue={car?.model ?? ''} className={k('in', errors.model && 'bad')} />
          </Field>

          <Field label="Full name" htmlFor="fullName" hint="Shown as the heading. Left blank, it becomes brand + model.">
            <input id="fullName" name="fullName" defaultValue={car?.fullName ?? ''} className={s.in} />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            required
            error={errors.slug}
            hint={
              isNew
                ? 'The public URL. Left blank, it is made from brand and model.'
                : 'Changing this changes the public URL, and any existing link to it stops working.'
            }
          >
            <input id="slug" name="slug" defaultValue={car?.slug ?? ''} className={k('in', 'mono', errors.slug && 'bad')} />
          </Field>
        </div>

        <fieldset className={s.fieldset}>
          <legend className={s.flegend}>
            Powertrain{' '}
            <span className={s.req} aria-hidden="true">
              *
            </span>
          </legend>
          <div className={s.radios}>
            {CATEGORIES.map((entry) => (
              <label key={entry.value} className={k('radio', category === entry.value && 'on')}>
                <input
                  type="radio"
                  name="category"
                  value={entry.value}
                  checked={category === entry.value}
                  onChange={() => setCategory(entry.value)}
                />
                <b>
                  {entry.label}
                  <i aria-hidden="true" />
                </b>
                <span>{entry.hint}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.category} />
        </fieldset>
      </Group>

      {/* ── Price ────────────────────────────────────────────────── */}
      <Group
        title="Price"
        i={1}
        sub="Stored in rupees as integers so the catalogue can sort on them, and as the published string so nothing is recomputed. If a price is an estimate rather than a dealer figure, put “(indicative)” in the display text — the admin catalogue counts those, and the marker is printed on every card."
      >
        <div className={k('fgrid', 'fgrid--3')}>
          <Field label="Lower price (PKR)" htmlFor="priceMin" required error={errors.priceMin}>
            <input
              id="priceMin"
              name="priceMin"
              inputMode="numeric"
              defaultValue={car ? String(car.price.min) : ''}
              placeholder="7290000"
              className={k('in', 'mono', errors.priceMin && 'bad')}
            />
          </Field>

          <Field label="Upper price (PKR)" htmlFor="priceMax" hint="Same as the lower price for a single figure." error={errors.priceMax}>
            <input
              id="priceMax"
              name="priceMax"
              inputMode="numeric"
              defaultValue={car ? String(car.price.max) : ''}
              placeholder="same as lower"
              className={k('in', 'mono', errors.priceMax && 'bad')}
            />
          </Field>

          <Field label="Displayed as" htmlFor="priceDisplay" required error={errors.priceDisplay}>
            <input
              id="priceDisplay"
              name="priceDisplay"
              defaultValue={car?.price.display ?? ''}
              placeholder="PKR 72.9 Lakh"
              className={k('in', errors.priceDisplay && 'bad')}
            />
          </Field>
        </div>
      </Group>

      {/* ── Battery and range ────────────────────────────────────── */}
      <Group title="Battery and range" i={2}>
        <div className={k('fgrid', 'fgrid--3')}>
          <Numeric name="batteryCapacity" label="Battery capacity" unit="kWh" value={car?.batteryCapacity} error={errors.batteryCapacity} enabled={can.battery} />
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
            disabledNote={category === 'EV' ? 'An EV is electric-only — use Range.' : 'A full hybrid has no meaningful electric-only range.'}
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
      <Group title="Performance" i={3}>
        <div className={k('fgrid', 'fgrid--3')}>
          <Numeric name="power" label="Power" unit="hp" value={car?.power} error={errors.power} hint={can.engine ? 'Combined system output.' : undefined} />
          <Numeric name="acceleration" label="0–100 km/h" unit="sec" value={car?.acceleration} error={errors.acceleration} />
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
          <Numeric name="topSpeed" label="Top speed" unit="km/h" value={car?.topSpeed} error={errors.topSpeed} />
          <Numeric name="seats" label="Seats" value={car?.seats} error={errors.seats} />
        </div>
      </Group>

      {/* ── Charging ─────────────────────────────────────────────── */}
      <Group
        title="Charging"
        i={4}
        sub={
          can.charging
            ? undefined
            : 'A full hybrid charges its own battery from the engine and braking, and has no charging port — so these stay empty. The server rejects them too.'
        }
      >
        <div className={s.fgrid}>
          <Numeric name="dcCharging" label="DC charging" unit="kW" value={car?.dcCharging} error={errors.dcCharging} enabled={can.charging} />
          <Numeric name="acCharging" label="AC charging" unit="kW" value={car?.acCharging} error={errors.acCharging} enabled={can.charging} />
        </div>

        <fieldset className={s.fieldset} disabled={!can.connectors}>
          <legend className={s.flegend}>Connectors</legend>
          <p className={s.fhint}>Leave all unticked when the source did not state a standard — that is different from stating it has none.</p>
          <div className={s.checks}>
            {CONNECTORS.map((connector) => (
              <label key={connector} className={s.check}>
                <input type="checkbox" name="connectors" value={connector} defaultChecked={car?.connector?.includes(connector) ?? false} />
                {connector}
              </label>
            ))}
          </div>
          <FieldError message={errors.connectors} />
        </fieldset>
      </Group>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <Group
        title="Notes"
        i={5}
        sub="Printed under the specifications on the public page. The place for a qualifier a number alone would lose — “90+ km”, an assembler’s name, or why a figure is missing."
      >
        <div className={s.fgrid}>
          <Field label="Notes" htmlFor="notes" full>
            <textarea id="notes" name="notes" rows={3} defaultValue={car?.notes ?? ''} className={s.in} />
          </Field>
        </div>
      </Group>

      {/* Sticky, because this form is taller than any screen and a save button
          at the bottom of it is a save button nobody finds. */}
      <div className={s.savebar}>
        <p>
          A blank numeric field is saved as <b>not published</b>, not as zero.
        </p>
        <button type="submit" disabled={pending} className={k('btn', 'btn--ink')}>
          {pending ? <Spinner /> : <Ico n="save" />}
          {pending ? 'Saving…' : isNew ? 'Create car' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

/** One section of the form (.formc): a Power Grotesk title, its note, then the fields. */
function Group({ title, sub, i = 0, children }: { title: string; sub?: string; i?: number; children: React.ReactNode }) {
  const r = rise(i)
  return (
    <section className={k('card', 'formc', r.className)} style={r.style}>
      <h2>{title}</h2>
      {sub ? <p className={s.formc__sub}>{sub}</p> : null}
      {children}
    </section>
  )
}

/**
 * A labelled field (.fld). Every control has a real <label> tied by id, and
 * required is said in text as well as with an asterisk.
 */
function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  full = false,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={k('fld', full && 'fld--full', error && 'is-bad')}>
      <label htmlFor={htmlFor}>
        {label}
        {required ? (
          <>
            <span className={s.req} aria-hidden="true">
              *
            </span>
            <span className={s.sr}>(required)</span>
          </>
        ) : (
          <span className={s.fnote}>optional</span>
        )}
      </label>
      {children}
      <FieldError message={error} />
      {hint ? <p className={s.fhint}>{hint}</p> : null}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className={s.ferr}>
      <Ico n="alert" />
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
    <Field label={unit ? `${label} (${unit})` : label} htmlFor={name} error={error} hint={enabled ? hint : (disabledNote ?? 'Not applicable to this powertrain.')}>
      <input
        id={name}
        name={name}
        inputMode="decimal"
        disabled={!enabled}
        defaultValue={value !== null && value !== undefined ? String(value) : ''}
        placeholder={enabled ? 'not published' : 'not applicable'}
        className={k('in', 'mono', error && 'bad')}
      />
    </Field>
  )
}

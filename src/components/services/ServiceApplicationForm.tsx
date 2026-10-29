// src/components/services/ServiceApplicationForm.tsx
'use client'

import { CheckCircle2, Send } from '@/components/ui/icons'
import * as React from 'react'

import { LocationPicker } from '@/components/business/LocationPicker'
import { HoursFields } from '@/components/services/HoursFields'
import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { applyToListService } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'

/**
 * The form a service provider fills in to be listed.
 *
 * In five parts — the business, who to talk to, where, when it is open, and a
 * confirmation — so a reviewer has what they need to decide without a phone
 * call, and an approved listing has hours, WhatsApp and prices from day one
 * rather than "Not listed". Only what a reviewer cannot do without is
 * required; everything else says "optional".
 *
 * The map pin is asked for here. Leaving it to the reviewer meant every
 * application was stored at 0,0, and the reviewer had no better idea where a
 * workshop is than its owner — who can tap "use my location" while standing in
 * it. The same picker the charger sign-up uses.
 *
 * It states plainly that nothing is published until a person checks it. That is
 * true — the row lands as `pending` and the public directory filters on it.
 */

const INPUT = 'h-12 w-full rounded-xl border bg-white px-4 text-ui text-slate-900 outline-none transition-colors placeholder:text-slate-400'
const OK_BORDER = 'border-slate-300 focus-visible:border-plug-blue-500'

/** The signed-in applicant, to prefill the contact person and email. */
export interface Applicant {
  name: string
  email: string
}

export function ServiceApplicationForm({ applicant }: { applicant: Applicant }) {
  const [pending, startTransition] = React.useTransition()
  const [done, setDone] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [errorField, setErrorField] = React.useState<string | null>(null)
  const [position, setPosition] = React.useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  })
  const [street, setStreet] = React.useState('')
  const formRef = React.useRef<HTMLFormElement>(null)

  /** Shows the message and brings the field it is about into view. */
  function fail(message: string, field: string | null) {
    setError(message)
    setErrorField(field)
    const el = field ? formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"], [name="${field}"]`) : null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const el = event.currentTarget
    const form = new FormData(el)

    if (position.lat === null || position.lng === null) {
      fail('Set your location on the map — use the current-location button or type the coordinates.', 'location')
      return
    }
    if (form.get('agree') !== 'on') {
      fail('Tick the box to confirm the details are correct.', 'agree')
      return
    }
    form.set('lat', String(position.lat))
    form.set('lng', String(position.lng))
    form.set('street', street)

    startTransition(async () => {
      const result = await applyToListService(form)
      if (!result.ok) {
        fail(result.message ?? 'Something went wrong. Try again.', result.field ?? null)
        return
      }
      setError(null)
      setErrorField(null)
      setDone(result.message ?? 'Thanks — your application is with our team.')
      el.reset()
      setPosition({ lat: null, lng: null })
      setStreet('')
      window.scrollTo({ top: (formRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 120, behavior: 'smooth' })
    })
  }

  if (done) {
    return (
      <div className={FRAME}>
        <div className={cn(FACE, 'items-start p-8 text-center sm:p-10')}>
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-plug-blue-300 text-plug-blue-600"
          >
            <CheckCircle2 size={26} />
          </span>
          <h3 className="mx-auto mt-6 text-xl font-bold tracking-tight text-slate-900">
            Application received
          </h3>
          {/* No email is sent by this application and there is no page where
              an applicant can check progress, so this says how they will
              actually hear: a person on the team uses the contact details
              they gave. No turnaround is promised because none is measured. */}
          <p className="mx-auto mt-3 max-w-md text-ui leading-relaxed text-slate-500">
            {done} Nothing appears on the directory until somebody has checked the details, so
            you will not see your listing on the services page yet.
          </p>
          <p className="mx-auto mt-3 max-w-md text-ui leading-relaxed text-slate-500">
            Once it has been reviewed, a member of the Plug.pk team will contact you on the phone
            number, WhatsApp or email address you gave. Questions in the meantime:{' '}
            <a href="mailto:hello@plug.pk" className="font-semibold text-plug-blue-600 hover:underline">
              hello@plug.pk
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  const border = (field: string) => (errorField === field ? 'border-red-400' : OK_BORDER)

  return (
    <div className={FRAME}>
      <form ref={formRef} onSubmit={onSubmit} className={cn(FACE, 'p-6 sm:p-10')} noValidate>
        <span aria-hidden="true" className={CAP_RULE} />
        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
          Apply to be listed
        </h3>
        <p className="mt-2 text-ui leading-relaxed text-slate-500">
          Five short parts, about five minutes. A person on our team reads every application and
          checks it before anything is published.
        </p>

        {/* ── 1. The business ─────────────────────────────── */}
        <Part number={1} title="Your business" hint="What drivers will see at the top of your listing.">
          {/* Not autofocused: the form sits below the page's hero, and focusing
              it on load scrolled the hero away and, on a phone, opened the
              keyboard before anyone had read what the form is for. */}
          <Field label="Business name" name="name" required maxLength={120} errorField={errorField} />

          <label className="block">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">What do you offer</span>
            <select name="category" required defaultValue="" className={cn(INPUT, 'px-3', border('category'))}>
              <option value="" disabled>
                Choose a category
              </option>
              {SERVICE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SERVICE_CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Year you started"
            name="yearEstablished"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 2019"
            errorField={errorField}
          />
          <Field
            label="EV makes you work with"
            name="brands"
            maxLength={300}
            placeholder="e.g. BYD, MG, Hyundai, all makes"
            errorField={errorField}
          />

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              What you do
            </span>
            <span className="mb-2 block text-ui-sm text-slate-500">
              The services you offer and what makes you good at them. At least a sentence or two.
            </span>
            <textarea
              name="description"
              required
              rows={4}
              maxLength={1000}
              placeholder="High-voltage certified workshop handling battery diagnostics, thermal system service and EV tyre fitting."
              className={cn('w-full rounded-xl border bg-white px-4 py-3 text-ui text-slate-900 outline-none transition-colors placeholder:text-slate-400', border('description'))}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              Prices
              <span className="ml-1 font-normal text-slate-400">optional</span>
            </span>
            <textarea
              name="pricing"
              rows={3}
              maxLength={600}
              placeholder={'e.g. Battery health check PKR 3,500\nHome charger installation from PKR 25,000'}
              className={cn('w-full rounded-xl border bg-white px-4 py-3 text-ui text-slate-900 outline-none transition-colors placeholder:text-slate-400', border('pricing'))}
            />
          </label>
        </Part>

        {/* ── 2. Contact ──────────────────────────────────── */}
        <Part
          number={2}
          title="Who we should talk to"
          hint="The contact person is only for our team. Phone, WhatsApp, email and links appear on your listing."
        >
          <Field label="Contact person" name="contactName" required maxLength={120} autoComplete="name" defaultValue={applicant.name} errorField={errorField} />
          <Field label="Their role" name="contactRole" maxLength={80} placeholder="Owner, manager…" errorField={errorField} />
          <Field label="Phone" name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="0300 1234567" errorField={errorField} />
          <Field label="WhatsApp" name="whatsapp" type="tel" maxLength={20} placeholder="0300 1234567" errorField={errorField} />
          <Field label="Email" name="email" type="email" maxLength={254} autoComplete="email" defaultValue={applicant.email} errorField={errorField} />
          <Field label="Website" name="website" type="url" maxLength={300} placeholder="yourbusiness.pk" errorField={errorField} />
          <div className="sm:col-span-2">
            <Field
              label="Facebook or Instagram page"
              name="socialUrl"
              type="url"
              maxLength={300}
              placeholder="facebook.com/yourbusiness"
              errorField={errorField}
            />
          </div>
          <p className="text-ui-sm text-slate-500 sm:col-span-2">
            Leave at least a phone number or an email so we can reach you.
          </p>
        </Part>

        {/* ── 3. Location ─────────────────────────────────── */}
        <Part number={3} title="Where you are" hint="The pin drivers will be given directions to.">
          <label className="block">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">City</span>
            <input
              name="city"
              required
              maxLength={80}
              list="service-apply-cities"
              autoComplete="address-level2"
              className={cn(INPUT, border('city'))}
            />
            <datalist id="service-apply-cities">
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </label>
          <Field label="Area or neighbourhood" name="area" maxLength={120} placeholder="e.g. Gulberg III" errorField={errorField} />

          <div
            data-field="location"
            className={cn('sm:col-span-2', errorField === 'location' && 'rounded-xl ring-2 ring-red-300 ring-offset-4')}
          >
            <p className="mb-3 text-ui-sm text-slate-500">
              Stand at your premises and tap the current-location button, or type the coordinates.
            </p>
            <LocationPicker
              idPrefix="service-apply"
              lat={position.lat}
              lng={position.lng}
              onChange={(next) => {
                setPosition(next)
                if (errorField === 'location') {
                  setError(null)
                  setErrorField(null)
                }
              }}
              currentAddress={street}
              onAddressFound={({ address }) => setStreet(address)}
            />
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              Street address
              <span className="ml-1 font-normal text-slate-400">optional</span>
            </span>
            <input
              type="text"
              value={street}
              maxLength={200}
              onChange={(event) => setStreet(event.target.value)}
              className={cn(INPUT, border('street'))}
            />
          </label>
        </Part>

        {/* ── 4. Hours ────────────────────────────────────── */}
        <Part number={4} title="When you are open" hint="Shown on your listing, so drivers do not arrive to a closed shutter.">
          <div data-field="hours" className="sm:col-span-2">
            <HoursFields invalid={errorField === 'hours'} />
          </div>
        </Part>

        {/* ── 5. Confirm ──────────────────────────────────── */}
        <Part number={5} title="Confirm and send">
          <label
            data-field="agree"
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-ui-sm text-slate-700 sm:col-span-2',
              errorField === 'agree' ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50',
            )}
          >
            <input
              type="checkbox"
              name="agree"
              onChange={() => {
                if (errorField === 'agree') {
                  setError(null)
                  setErrorField(null)
                }
              }}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-plug-blue-600"
            />
            <span>
              The details above are correct and I can speak for this business. I understand the
              listing is checked by the Plug.pk team before it is published, and that listing costs
              PKR 4,999 a month once approved.
            </span>
          </label>
        </Part>

        {error ? (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-ui-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors duration-200 hover:bg-plug-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 sm:w-auto"
        >
          <Send size={16} aria-hidden="true" />
          {pending ? 'Sending…' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}

function Part({
  number,
  title,
  hint,
  children,
}: {
  number: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="mt-10 border-t border-slate-100 pt-8 first-of-type:mt-8">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-ui-sm font-bold text-plug-blue-700"
        >
          {number}
        </span>
        <div>
          <p className="text-ui-lg font-bold text-slate-900">{title}</p>
          {hint ? <p className="mt-0.5 text-ui-sm text-slate-500">{hint}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  maxLength,
  placeholder,
  autoComplete,
  inputMode,
  defaultValue,
  errorField,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  maxLength?: number
  placeholder?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  defaultValue?: string
  errorField: string | null
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
        {label}
        {required ? null : <span className="ml-1 font-normal text-slate-400">optional</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className={cn(INPUT, errorField === name ? 'border-red-400' : OK_BORDER)}
      />
    </label>
  )
}

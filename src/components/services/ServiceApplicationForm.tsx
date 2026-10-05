// src/components/services/ServiceApplicationForm.tsx
'use client'

import { CheckCircle2, Send } from '@/components/ui/icons'
import * as React from 'react'

import { LocationPicker } from '@/components/business/LocationPicker'
import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { applyToListService } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'

/**
 * The form a service provider fills in to be listed.
 *
 * Short on purpose. It asks for what a reviewer needs in order to decide —
 * who you are, what you do, where, and how to reach you — and nothing else.
 * Opening hours and photographs are filled in by the reviewer once they have
 * agreed to list you.
 *
 * The map pin is asked for here, though. Leaving it to the reviewer meant
 * every application was stored at 0,0, and the reviewer had no better idea
 * where a workshop is than its owner — who can tap "use my location" while
 * standing in it. The same picker the charger sign-up uses, so it behaves the
 * same way in both places.
 *
 * It states plainly that nothing is published until a person checks it. That is
 * true — the row lands as `pending` and the public directory filters on it —
 * and saying so is what stops the applicant refreshing /services looking for
 * themselves.
 */
export function ServiceApplicationForm() {
  const [pending, startTransition] = React.useTransition()
  const [done, setDone] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [errorField, setErrorField] = React.useState<string | null>(null)
  const [position, setPosition] = React.useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  })
  const [street, setStreet] = React.useState('')

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const el = event.currentTarget

    if (position.lat === null || position.lng === null) {
      setError('Set your location on the map — use the current-location button or type the coordinates.')
      setErrorField('location')
      return
    }
    form.set('lat', String(position.lat))
    form.set('lng', String(position.lng))
    form.set('street', street)

    startTransition(async () => {
      const result = await applyToListService(form)
      if (!result.ok) {
        setError(result.message ?? 'Something went wrong. Try again.')
        setErrorField(result.field ?? null)
        return
      }
      setError(null)
      setErrorField(null)
      setDone(result.message ?? 'Thanks — your application is with our team.')
      el.reset()
      setPosition({ lat: null, lng: null })
      setStreet('')
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
            number or email address you gave. Questions in the meantime:{' '}
            <a href="mailto:hello@plug.pk" className="font-semibold text-plug-blue-600 hover:underline">
              hello@plug.pk
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={FRAME}>
      <form onSubmit={onSubmit} className={cn(FACE, 'p-8 sm:p-10')} noValidate>
        <span aria-hidden="true" className={CAP_RULE} />
        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
          Tell us about your service
        </h3>
        <p className="mt-2 text-ui leading-relaxed text-slate-500">
          A few details and a map pin. A person reads every application, so nothing goes live
          automatically.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {/* Not autofocused: the form sits below the page's hero, and focusing
              it on load scrolled the hero away and, on a phone, opened the
              keyboard before anyone had read what the form is for. */}
          <Field label="Business name" name="name" required maxLength={120} errorField={errorField} />

          <label className="block">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              What do you offer
            </span>
            <select
              name="category"
              required
              defaultValue=""
              className={cn(
                'h-12 w-full rounded-xl border bg-white px-3 text-ui text-slate-900 outline-none transition-colors',
                errorField === 'category'
                  ? 'border-red-400'
                  : 'border-slate-300 focus-visible:border-plug-blue-500',
              )}
            >
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

          <Field label="City" name="city" required maxLength={80} errorField={errorField} />
          <Field label="Area or neighbourhood" name="area" maxLength={120} errorField={errorField} />
          <Field label="Phone" name="phone" type="tel" maxLength={20} errorField={errorField} />
          <Field label="Email" name="email" type="email" maxLength={254} errorField={errorField} />
          <div className="sm:col-span-2">
            <Field label="Website" name="website" type="url" maxLength={300} errorField={errorField} />
          </div>

          <div
            className={cn(
              'sm:col-span-2',
              errorField === 'location' && 'rounded-xl ring-2 ring-red-300 ring-offset-4',
            )}
          >
            <p className="mb-1 text-ui-sm font-semibold text-slate-900">Where you are</p>
            <p className="mb-3 text-ui-sm text-slate-500">
              The pin drivers will be given directions to. Stand at your premises and tap the
              button, or type the coordinates.
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
              className={cn(
                'h-12 w-full rounded-xl border bg-white px-4 text-ui text-slate-900 outline-none transition-colors',
                errorField === 'street' ? 'border-red-400' : 'border-slate-300 focus-visible:border-plug-blue-500',
              )}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              What you do, in a sentence or two
            </span>
            <textarea
              name="description"
              required
              rows={4}
              maxLength={1000}
              placeholder="High-voltage certified workshop handling battery diagnostics and thermal system service."
              className={cn(
                'w-full rounded-xl border bg-white px-4 py-3 text-ui text-slate-900 outline-none transition-colors placeholder:text-slate-400',
                errorField === 'description'
                  ? 'border-red-400'
                  : 'border-slate-300 focus-visible:border-plug-blue-500',
              )}
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-5 text-ui-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors duration-200 hover:bg-plug-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          <Send size={16} aria-hidden="true" />
          {pending ? 'Sending…' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  autoFocus = false,
  maxLength,
  errorField,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoFocus?: boolean
  maxLength?: number
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
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={cn(
          'h-12 w-full rounded-xl border bg-white px-4 text-ui text-slate-900 outline-none transition-colors',
          errorField === name
            ? 'border-red-400'
            : 'border-slate-300 focus-visible:border-plug-blue-500',
        )}
      />
    </label>
  )
}

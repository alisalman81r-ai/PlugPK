// src/components/services/ServiceApplicationForm.tsx
'use client'

import { CheckCircle2, Send } from 'lucide-react'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { applyToListService } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'

/**
 * The form a service provider fills in to be listed.
 *
 * Short on purpose. It asks for what a reviewer needs in order to decide —
 * who you are, what you do, where, and how to reach you — and nothing else.
 * The address pin, the opening hours and the photographs are filled in by the
 * reviewer once they have agreed to list you; asking an applicant for
 * coordinates before anyone has said yes is how a form gets abandoned halfway.
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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const el = event.currentTarget

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
          <p className="mx-auto mt-3 max-w-md text-ui leading-relaxed text-slate-500">
            {done} Nothing appears on the directory until somebody has checked the details, so
            you will not see your listing on the services page yet.
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
          Five fields. A person reads every application, so nothing goes live automatically.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Business name" name="name" required autoFocus errorField={errorField} />

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

          <Field label="City" name="city" required errorField={errorField} />
          <Field label="Area or neighbourhood" name="area" errorField={errorField} />
          <Field label="Phone" name="phone" type="tel" errorField={errorField} />
          <Field label="Email" name="email" type="email" errorField={errorField} />
          <div className="sm:col-span-2">
            <Field label="Website" name="website" type="url" errorField={errorField} />
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-ui-sm font-semibold text-slate-900">
              What you do, in a sentence or two
            </span>
            <textarea
              name="description"
              required
              rows={4}
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
  errorField,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoFocus?: boolean
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

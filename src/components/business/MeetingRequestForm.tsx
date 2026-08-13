// src/components/business/MeetingRequestForm.tsx
'use client'

import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react'
import * as React from 'react'

import { requestMeeting } from '@/lib/db/meeting-actions'
import { cn } from '@/lib/utils'

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus'

/**
 * Replaces the published subscription tiers.
 *
 * Terms are discussed rather than listed now, so this has to capture enough
 * for that conversation to actually happen — who, which business, how to
 * reach them, and when suits. Everything past those is optional, because a
 * long form is the fastest way to lose the enquiry it was meant to collect.
 *
 * The preferred date and time are a stated preference, not a booking. Nothing
 * is reserved and no slot is held; the confirmation says so rather than
 * implying a calendar entry exists.
 */
export function MeetingRequestForm() {
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await requestMeeting(form)
      if (result.ok) setSent(true)
      else setError(result.message ?? 'Could not send your request.')
    })
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"
      >
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={22} className="text-emerald-700" aria-hidden="true" />
        </span>
        <p className="text-lg font-bold text-slate-900">Request received</p>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-ui-sm leading-relaxed text-slate-600">
          We have your details and will be in touch to confirm a time. Nothing is booked
          yet — the date you gave is a preference, not a reservation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <CalendarCheck size={18} className="text-plug-blue-600" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-bold text-slate-900">Request a meeting</h3>
          <p className="text-ui-sm text-slate-500">We usually reply within two working days.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="mr-name" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Your name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input id="mr-name" name="name" required autoComplete="name" className={FIELD} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="mr-company" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Business name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input id="mr-company" name="company" required autoComplete="organization" className={FIELD} />
        </div>

        <div>
          <label htmlFor="mr-email" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input id="mr-email" name="email" type="email" required autoComplete="email" className={FIELD} />
        </div>

        <div>
          <label htmlFor="mr-phone" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Phone <span className="font-normal text-ui-xs text-slate-400">optional</span>
          </label>
          <input id="mr-phone" name="phone" type="tel" autoComplete="tel" className={FIELD} />
        </div>

        <div>
          <label htmlFor="mr-date" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Preferred date <span className="font-normal text-ui-xs text-slate-400">optional</span>
          </label>
          <input id="mr-date" name="preferredDate" type="date" className={cn(FIELD, 'font-mono')} />
        </div>

        <div>
          <label htmlFor="mr-time" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Preferred time <span className="font-normal text-ui-xs text-slate-400">optional</span>
          </label>
          <input id="mr-time" name="preferredTime" type="time" className={cn(FIELD, 'font-mono')} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="mr-note" className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
            Anything we should know{' '}
            <span className="font-normal text-ui-xs text-slate-400">optional</span>
          </label>
          <textarea
            id="mr-note"
            name="note"
            rows={3}
            placeholder="How many sites, what you are hoping to get out of it…"
            className="w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus"
          />
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-ui-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
        Request a meeting
      </button>

      <p className="mt-3 text-center text-ui-xs leading-relaxed text-slate-500">
        Listing your business is free. We will talk through what you need before anything
        is agreed.
      </p>
    </form>
  )
}

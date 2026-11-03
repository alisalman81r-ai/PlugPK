// src/components/partners/PartnerMeetingForm.tsx
'use client'

import { CalendarCheck, Check, Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import { Btn, INPUT } from '@/components/v2/ui'
import { requestMeeting } from '@/lib/db/meeting-actions'
import { cn } from '@/lib/utils'

/**
 * The meeting request on Partner Up, in landing-v2's .pt-formcard.
 *
 * Same fields, names and server action (`requestMeeting`) as
 * components/business/MeetingRequestForm; only the presentation differs. The
 * action validates and rate-limits everything itself, so the browser checks
 * here are a courtesy, not the guard.
 *
 * The preferred date and time are a stated preference, not a booking. Nothing
 * is reserved and no slot is held; the confirmation says so rather than
 * implying a calendar entry exists.
 */

const FIELD = cn(INPUT, 'h-[50px]')
const LABEL = 'mb-1.5 block text-sm font-semibold text-ink'

function Optional() {
  return <small className="ml-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">optional</small>
}

function Required() {
  return (
    <span className="text-[#B42E05]" aria-hidden="true">
      {' '}*
    </span>
  )
}

export function PartnerMeetingForm() {
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState<{ name: string; email: string } | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const doneRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (sent) doneRef.current?.focus()
  }, [sent])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await requestMeeting(form)
      if (result.ok) {
        setSent({ name: String(form.get('name') ?? '').trim(), email: String(form.get('email') ?? '').trim() })
      } else {
        setError(result.message ?? 'Could not send your request.')
      }
    })
  }

  return (
    <div className="rounded-[26px] border border-ink/10 bg-white px-[18px] py-[22px] shadow-e2 sm:rounded-[32px] sm:p-[34px]">
      <div className="mb-[22px] flex items-center gap-3.5 border-b border-ink/10 pb-[22px]">
        <span aria-hidden="true" className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-ink text-volt">
          <CalendarCheck size={22} />
        </span>
        <div>
          <h3 className="font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium">Request a meeting</h3>
          <p className="mt-1 text-sm text-muted">We reply by email to arrange a time.</p>
        </div>
      </div>

      {sent ? (
        <div ref={doneRef} tabIndex={-1} role="status" className="grid justify-items-start gap-2.5 pb-1 pt-2 outline-none">
          <span aria-hidden="true" className="mb-1.5 grid h-14 w-14 place-items-center rounded-full bg-volt text-ink">
            <Check size={26} />
          </span>
          <h3 className="font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium">
            Thanks{sent.name ? `, ${sent.name}` : ''}. Meeting request sent.
          </h3>
          <p className="text-[15.5px] leading-[1.6] text-muted">
            Your request has reached us. We will email you
            {sent.email ? (
              <>
                {' '}at <b className="text-ink">{sent.email}</b>
              </>
            ) : null}{' '}
            to confirm a suitable time. Nothing is booked yet.
          </p>
          <p className="text-[13.5px] leading-[1.6] text-muted">
            A listing is PKR 4,999 a month. We will talk through what you need before anything is agreed. In a hurry?
            Write to{' '}
            <a
              href="mailto:hello@plug.pk"
              className="font-semibold text-ink underline decoration-volt-2 decoration-2 underline-offset-[3px]"
            >
              hello@plug.pk
            </a>
            .
          </p>
          <Btn
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              formRef.current?.reset()
              setError(null)
              setSent(null)
            }}
          >
            Request another meeting
          </Btn>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-x-3.5 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="mr-name" className={LABEL}>
              Your name
              <Required />
            </label>
            <input id="mr-name" name="name" required maxLength={120} autoComplete="name" className={FIELD} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mr-company" className={LABEL}>
              Business name
              <Required />
            </label>
            <input id="mr-company" name="company" required maxLength={160} autoComplete="organization" className={FIELD} />
          </div>

          <div>
            <label htmlFor="mr-email" className={LABEL}>
              Email
              <Required />
            </label>
            <input
              id="mr-email"
              name="email"
              type="email"
              inputMode="email"
              required
              maxLength={254}
              autoComplete="email"
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="mr-phone" className={LABEL}>
              Phone <Optional />
            </label>
            <input id="mr-phone" name="phone" type="tel" inputMode="tel" maxLength={30} autoComplete="tel" className={FIELD} />
          </div>

          <div>
            <label htmlFor="mr-date" className={LABEL}>
              Preferred date <Optional />
            </label>
            <input id="mr-date" name="preferredDate" type="date" className={cn(FIELD, 'font-mono text-[15px]')} />
          </div>

          <div>
            <label htmlFor="mr-time" className={LABEL}>
              Preferred time <Optional />
            </label>
            <input id="mr-time" name="preferredTime" type="time" className={cn(FIELD, 'font-mono text-[15px]')} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mr-note" className={LABEL}>
              Anything we should know <Optional />
            </label>
            <textarea
              id="mr-note"
              name="note"
              rows={4}
              maxLength={2000}
              placeholder="How many sites, what you are hoping to get out of it…"
              className={cn(INPUT, 'h-auto min-h-[112px] resize-y py-3.5')}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05] sm:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Btn type="submit" variant="ink" size="lg" disabled={isPending} className="mt-1.5 w-full">
              {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
              {isPending ? 'Sending…' : 'Request a meeting'}
            </Btn>
            <p className="mt-3 text-center text-[13px] leading-[1.55] text-muted">
              A listing is PKR 4,999 a month. We will talk through what you need before anything is agreed.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

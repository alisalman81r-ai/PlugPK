// src/components/partners/PartnerMeetingForm.tsx
'use client'

import { CalendarCheck, Check, Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import { Btn, INPUT } from '@/components/v2/ui'
import { requestMeeting } from '@/lib/db/meeting-actions'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
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
 *
 * Behaviour and motion are page-partner.js's: each required field is checked
 * when you leave it (once it has something in it, or once it has been marked
 * wrong) and rechecked as you type into a marked one. A submit with a mistake
 * focuses the first one, brings it to the middle of the screen and shakes it
 * (x -6 → 0, 0.5s, elastic.out(1.2,.3)). A request that goes through fades the
 * form up and out (0.3s, power2.in) and the confirmation's lines spring in
 * (0.7s, back.out(1.6), 0.06s apart).
 */

const FIELD = cn(INPUT, 'h-[50px]')
/* .pt-form .is-bad input — it wins over the focus ring too */
const BAD = 'border-[#E2541F] shadow-[0_0_0_4px_rgba(255,90,31,.14)] focus:border-[#E2541F] focus:shadow-[0_0_0_4px_rgba(255,90,31,.14)]'
const LABEL = 'mb-1.5 block text-sm font-semibold text-ink'
const ERR = 'mt-1.5 text-[13px] text-[#B42E05]'

type FieldId = 'mr-name' | 'mr-company' | 'mr-email' | 'mr-date'

const pad = (n: number) => String(n).padStart(2, '0')
const todayString = () => {
  const today = new Date()
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
}

const RULES: Record<FieldId, (v: string) => string> = {
  'mr-name': (v) => (v ? '' : 'Please tell us your name.'),
  'mr-company': (v) => (v ? '' : 'Please add the name of your business.'),
  'mr-email': (v) =>
    !v
      ? 'We need an email to reply to.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
        ? ''
        : 'That email does not look right. Check it and try again.',
  'mr-date': (v) => (v && v < todayString() ? 'Pick a date from today onwards.' : ''),
}
const FIELD_IDS = Object.keys(RULES) as FieldId[]

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

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
  const [errors, setErrors] = React.useState<Partial<Record<FieldId, string>>>({})
  const [minDate, setMinDate] = React.useState<string | undefined>(undefined)
  const [sent, setSent] = React.useState<{ name: string; email: string } | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const doneRef = React.useRef<HTMLDivElement>(null)
  const nameRef = React.useRef<HTMLInputElement>(null)
  const wasSent = React.useRef(false)

  // date.min = today, set in the browser so it is the visitor's today.
  React.useEffect(() => setMinDate(todayString()), [])

  /* The confirmation arrives: focus it, its lines spring in. Leaving it: back to the name. */
  useIsoLayoutEffect(() => {
    const now = sent !== null
    if (now === wasSent.current) return
    wasSent.current = now
    if (now) {
      const done = doneRef.current
      if (!done) return
      done.focus()
      let tween: gsap.core.Tween | null = null
      if (!prefersReduced()) {
        tween = gsap.from(done.children, { y: 20, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.06 })
      }
      ScrollTrigger.refresh()
      return () => {
        tween?.revert()
      }
    }
    nameRef.current?.focus()
    ScrollTrigger.refresh()
  }, [sent])

  const value = (id: FieldId) => {
    const el = formRef.current?.querySelector<HTMLInputElement>(`#${id}`)
    return el ? el.value.trim() : ''
  }

  const check = (id: FieldId) => {
    const msg = RULES[id](value(id))
    setErrors((prev) => ({ ...prev, [id]: msg }))
    return !msg
  }

  const fieldProps = (id: FieldId) => ({
    id,
    'aria-describedby': `${id}-err`,
    'aria-invalid': errors[id] ? ('true' as const) : ('false' as const),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.currentTarget.value.trim() || errors[id]) check(id)
    },
    onInput: () => {
      if (errors[id]) check(id)
    },
  })

  const errorText = (id: FieldId) => (
    <p id={`${id}-err`} className={cn(ERR, !errors[id] && 'hidden')}>
      {errors[id]}
    </p>
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const reduce = prefersReduced()

    const bad = FIELD_IDS.filter((id) => !check(id))
    if (bad.length) {
      const first = formEl.querySelector<HTMLInputElement>(`#${bad[0]}`)
      if (first) {
        first.focus({ preventScroll: true })
        first.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
        const field = first.closest('[data-field]')
        if (!reduce && field) gsap.fromTo(field, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2,.3)' })
      }
      return
    }

    const form = new FormData(formEl)
    setError(null)

    startTransition(async () => {
      const result = await requestMeeting(form)
      if (result.ok) {
        const details = { name: String(form.get('name') ?? '').trim(), email: String(form.get('email') ?? '').trim() }
        if (reduce) {
          setSent(details)
          return
        }
        gsap.to(formEl, {
          autoAlpha: 0,
          y: -10,
          duration: 0.3,
          ease: 'power2.in',
          // The form unmounts with the confirmation, so nothing to clear; a
          // later "another meeting" mounts a fresh one.
          onComplete: () => setSent(details),
        })
      } else {
        setError(result.message ?? 'Could not send your request.')
      }
    })
  }

  return (
    <div
      data-reveal=""
      className="rounded-[26px] border border-ink/10 bg-white px-[18px] py-[22px] shadow-e2 sm:rounded-[32px] sm:p-[34px]"
    >
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
          {/* .pt-btn-line */}
          <Btn
            variant="ghost"
            size="sm"
            magnetic={false}
            className="mt-2 border-ink/20 bg-transparent hover:border-ink hover:bg-volt"
            onClick={() => {
              setError(null)
              setErrors({})
              setSent(null)
            }}
          >
            Request another meeting
          </Btn>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-x-3.5 gap-y-4 sm:grid-cols-2">
          <div data-field="" className="sm:col-span-2">
            <label htmlFor="mr-name" className={LABEL}>
              Your name
              <Required />
            </label>
            <input
              ref={nameRef}
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className={cn(FIELD, errors['mr-name'] && BAD)}
              {...fieldProps('mr-name')}
            />
            {errorText('mr-name')}
          </div>

          <div data-field="" className="sm:col-span-2">
            <label htmlFor="mr-company" className={LABEL}>
              Business name
              <Required />
            </label>
            <input
              name="company"
              required
              maxLength={160}
              autoComplete="organization"
              className={cn(FIELD, errors['mr-company'] && BAD)}
              {...fieldProps('mr-company')}
            />
            {errorText('mr-company')}
          </div>

          <div data-field="">
            <label htmlFor="mr-email" className={LABEL}>
              Email
              <Required />
            </label>
            <input
              name="email"
              type="email"
              inputMode="email"
              required
              maxLength={254}
              autoComplete="email"
              className={cn(FIELD, errors['mr-email'] && BAD)}
              {...fieldProps('mr-email')}
            />
            {errorText('mr-email')}
          </div>

          <div data-field="">
            <label htmlFor="mr-phone" className={LABEL}>
              Phone <Optional />
            </label>
            <input id="mr-phone" name="phone" type="tel" inputMode="tel" maxLength={30} autoComplete="tel" className={FIELD} />
          </div>

          <div data-field="">
            <label htmlFor="mr-date" className={LABEL}>
              Preferred date <Optional />
            </label>
            <input
              name="preferredDate"
              type="date"
              min={minDate}
              className={cn(FIELD, 'font-mono text-[15px]', errors['mr-date'] && BAD)}
              {...fieldProps('mr-date')}
            />
            {errorText('mr-date')}
          </div>

          <div data-field="">
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
            <Btn type="submit" variant="ink" size="lg" disabled={isPending} magnetic={false} className="mt-1.5 w-full">
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

// src/components/services/ServiceApplicationForm.tsx
'use client'

import {
  Check,
  CheckCircle2,
  Clock,
  Mail,
  Package,
  ShieldCheck,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { LocationPicker } from '@/components/business/LocationPicker'
import { HoursFields } from '@/components/services/HoursFields'
import { CATEGORY_ICON } from '@/components/services/ServiceCategoryTabs'
import { Button } from '@/components/ui'
import { btnClass } from '@/components/v2/ui'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { applyToListService } from '@/lib/db/service-application-actions'
import type { ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Applying to the services directory, one step at a time — the same shape as
 * listing a charger on /business/signup: what you offer, the details drivers
 * see, who we talk to, where you are and when you are open, then a review.
 *
 * Every field stays mounted the whole way through; only the current step is
 * shown. Nothing typed is lost going back and forth, and the final submit
 * sends exactly the fields the server already validates. Each step checks
 * what the server would refuse before moving on, and a refusal the server
 * still returns sends the applicant straight back to the step that holds the
 * field.
 *
 * The map pin is asked for here. Leaving it to the reviewer meant every
 * application was stored at 0,0, and the reviewer had no better idea where a
 * workshop is than its owner — who can tap "use my location" while standing in
 * it. The same picker the charger sign-up uses.
 *
 * Nothing is published until a person checks it: the row lands as `pending`
 * and the public directory filters on it.
 */

/** The signed-in applicant, to prefill the contact person and email. */
export interface Applicant {
  name: string
  email: string
}

const STEPS = ['Service', 'Details', 'Contact', 'Location', 'Review'] as const

/** Which step holds each field the server can refuse. */
const STEP_OF_FIELD: Record<string, number> = {
  category: 1,
  name: 2,
  description: 2,
  contactName: 3,
  phone: 3,
  email: 3,
  website: 3,
  city: 4,
  area: 4,
  street: 4,
  location: 4,
  hours: 4,
  agree: 5,
}

const FIELD =
  'h-[54px] w-full appearance-none rounded-[14px] border-[1.5px] bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus'
const AREA =
  'w-full resize-y rounded-[14px] border-[1.5px] bg-white p-4 text-[15px] leading-[1.6] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus'

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface Summary {
  category: string
  name: string
  description: string
  pricing: string
  yearEstablished: string
  brands: string
  contactName: string
  contactRole: string
  phone: string
  whatsapp: string
  email: string
  website: string
  socialUrl: string
  city: string
  area: string
  hours: string
}

/** The open hours as one line, from the HoursFields inputs. */
function describeHours(form: FormData): string {
  const mode = String(form.get('hoursMode') ?? '')
  if (mode === '24h') return 'Open 24 hours'
  if (mode !== 'set') return 'Not given'
  const open = DAY_KEYS.filter((day) => form.get(`${day}Closed`) !== 'on')
  if (open.length === 0) return 'Closed every day'
  const first = open[0]!
  const same = open.every(
    (day) => form.get(`${day}Open`) === form.get(`${first}Open`) && form.get(`${day}Close`) === form.get(`${first}Close`),
  )
  const days = open.length === 7 ? 'Every day' : `${open.length} days a week`
  return same ? `${days}, ${form.get(`${first}Open`)}–${form.get(`${first}Close`)}` : `${days}, hours vary by day`
}

export function ServiceApplicationForm({ applicant }: { applicant: Applicant }) {
  const [step, setStep] = React.useState(1)
  const [category, setCategory] = React.useState<ServiceCategory | ''>('')
  const [position, setPosition] = React.useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [street, setStreet] = React.useState('')
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [done, setDone] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [errorField, setErrorField] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const topRef = React.useRef<HTMLDivElement>(null)

  const read = () => new FormData(formRef.current ?? undefined)
  const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

  const goTo = (next: number) => {
    setError(null)
    setErrorField(null)
    if (next === STEPS.length) {
      const form = read()
      setSummary({
        category: category ? SERVICE_CATEGORY_META[category].label : '',
        name: text(form, 'name'),
        description: text(form, 'description'),
        pricing: text(form, 'pricing'),
        yearEstablished: text(form, 'yearEstablished'),
        brands: text(form, 'brands'),
        contactName: text(form, 'contactName'),
        contactRole: text(form, 'contactRole'),
        phone: text(form, 'phone'),
        whatsapp: text(form, 'whatsapp'),
        email: text(form, 'email'),
        website: text(form, 'website'),
        socialUrl: text(form, 'socialUrl'),
        city: text(form, 'city'),
        area: text(form, 'area'),
        hours: describeHours(form),
      })
    }
    setStep(next)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** What the server would refuse on this step, said before it is sent. */
  function problemOn(current: number): [string, string] | null {
    const form = read()
    if (current === 1 && !category) return ['category', 'Choose what you offer.']
    if (current === 2) {
      if (text(form, 'name').length < 2) return ['name', 'Enter your business name.']
      if (text(form, 'description').length < 20)
        return ['description', 'Describe what you do in a sentence or two — at least 20 characters.']
      const year = text(form, 'yearEstablished')
      if (year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > new Date().getFullYear()))
        return ['yearEstablished', 'Enter the year you started as four digits, e.g. 2019.']
    }
    if (current === 3) {
      if (!text(form, 'contactName')) return ['contactName', 'Enter who we should talk to.']
      if (!text(form, 'phone') && !text(form, 'email'))
        return ['phone', 'Leave a phone number or an email so we can reach you.']
    }
    if (current === 4) {
      if (!text(form, 'city')) return ['city', 'Enter your city.']
      if (position.lat === null || position.lng === null)
        return ['location', 'Set your location on the map — use the current-location button or type the coordinates.']
    }
    return null
  }

  function next() {
    const problem = problemOn(step)
    if (problem) {
      setErrorField(problem[0])
      setError(problem[1])
      return
    }
    goTo(step + 1)
  }

  function submit() {
    const form = read()
    if (form.get('agree') !== 'on') {
      setErrorField('agree')
      setError('Tick the box to confirm the details are correct.')
      return
    }
    form.set('category', category)
    form.set('lat', String(position.lat))
    form.set('lng', String(position.lng))
    form.set('street', street)

    startTransition(async () => {
      try {
        const result = await applyToListService(form)
        if (!result.ok) {
          const field = result.field ?? null
          const target = field ? STEP_OF_FIELD[field] : undefined
          if (target && target !== step) setStep(target)
          setErrorField(field)
          setError(result.message ?? 'Something went wrong. Try again.')
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        setDone(result.message ?? 'Thanks — your application is with our team.')
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {
        setError('Could not reach plugpk. Check your connection and try again.')
      }
    })
  }

  const border = (field: string) => (errorField === field ? 'border-red-400' : 'border-ink/10')
  const clearIf = (field: string) => () => {
    if (errorField === field) {
      setError(null)
      setErrorField(null)
    }
  }

  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-24 animate-scale-in rounded-[28px] border border-ink/10 bg-white p-6 shadow-e1 sm:p-10">
        <div className="text-center">
          <span className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-ink text-volt">
            <CheckCircle2 size={34} aria-hidden="true" />
          </span>
          <h2 className="mb-3 mt-6 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.05] text-ink">Application received</h2>
          <p className="mx-auto max-w-lg text-slate-500">{done}</p>
        </div>

        <ol className="mx-auto mt-8 max-w-lg space-y-4">
          {[
            { icon: ShieldCheck, title: 'We check the details', body: 'A person confirms your address and contact details.' },
            { icon: Mail, title: 'We get in touch', body: 'On the phone, WhatsApp or email you gave — no turnaround is promised, because none is measured.' },
            { icon: CheckCircle2, title: 'You appear in the directory', body: 'Under your category, findable by drivers searching for exactly what you do.' },
          ].map((item, index) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-tint font-mono text-sm font-semibold text-volt-ink">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-ui-sm text-slate-500">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-8 max-w-lg rounded-2xl bg-chalk px-4 py-3 text-center text-ui-sm text-muted">
          Nothing appears on the services page until it has been checked. Follow it in your service portal, or ask:{' '}
          <a href="mailto:hello@plug.pk" className="font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4 hover:decoration-ink">
            hello@plug.pk
          </a>
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/business/services"
            className={btnClass('ink', 'md')}
          >
            Open your service portal
          </Link>
          <Link
            href="/services"
            className={btnClass('ghost', 'md')}
          >
            Back to services
          </Link>
        </div>
      </div>
    )
  }

  const errorLine = error ? (
    <p role="alert" className="mb-4 text-sm text-red-600">
      {error}
    </p>
  ) : null

  const navigation = (label = 'Continue') => (
    <div className="mt-8 flex gap-3">
      {step > 1 ? (
        <button type="button" className={btnClass('ghost', 'md')} onClick={() => goTo(step - 1)}>
          Back
        </button>
      ) : null}
      <button type="button" className={btnClass('ink', 'md', 'flex-1')} onClick={next}>
        {label} &rarr;
      </button>
    </div>
  )

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* ── Step indicator ───────────────────────────────────── */}
      <ol className="mb-10 flex items-start" aria-label="Application steps">
        {STEPS.map((label, index) => {
          const number = index + 1
          const isDone = number < step
          const isCurrent = number === step
          return (
            <React.Fragment key={label}>
              <li className="flex flex-col items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-semibold transition-all duration-300',
                    isDone ? 'bg-ink text-volt' : isCurrent ? 'bg-volt text-ink' : 'border border-ink/10 bg-white text-fog',
                    isCurrent && 'ring-4 ring-volt/30',
                  )}
                >
                  {isDone ? <Check size={16} aria-hidden="true" /> : number}
                </span>
                <span className={cn('whitespace-nowrap font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] sm:text-[11px]', isDone || isCurrent ? 'text-ink' : 'text-fog')}>
                  {label}
                </span>
              </li>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('mt-[18px] h-0.5 flex-1 transition-colors duration-500', number < step ? 'bg-ink' : 'bg-ink/10')}
                />
              ) : null}
            </React.Fragment>
          )
        })}
      </ol>

      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault()
          if (step === STEPS.length) submit()
          else next()
        }}
        noValidate
        className="rounded-[28px] border border-ink/10 bg-white p-5 shadow-e1 sm:p-9"
      >
        {/* ── Step 1 — What you offer ───────────────────────── */}
        <div hidden={step !== 1}>
          <h2 className="mb-2 font-display text-[clamp(26px,3vw,34px)] leading-[1.1] text-ink">What do you offer?</h2>
          <p className="mb-8 text-slate-500">Choose the category drivers will find you under.</p>

          <fieldset className="mb-6">
            <legend className="sr-only">Service category</legend>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {SERVICE_CATEGORY_KEYS.map((key) => {
                const meta = SERVICE_CATEGORY_META[key]
                const Icon = CATEGORY_ICON[meta.icon] ?? Package
                const selected = category === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setCategory(key)
                      clearIf('category')()
                    }}
                    className={cn(
                      'rounded-[20px] border-[1.5px] p-4 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.98]',
                      selected ? 'border-ink bg-volt-tint' : 'border-ink/10 bg-white hover:border-ink/30',
                    )}
                  >
                    <Icon size={20} className={cn('mb-2', selected ? 'text-ink' : 'text-muted')} aria-hidden="true" />
                    <span className="block text-sm font-semibold text-slate-900">{meta.label}</span>
                    <span className="block text-xs text-muted">{meta.description}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {category ? (
            <p className="mb-6 flex items-start gap-2 rounded-2xl bg-chalk px-4 py-3 text-ui-sm text-muted">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-volt-ink" aria-hidden="true" />
              Next: your business details, who we should talk to, and where you are. About five minutes.
            </p>
          ) : null}

          {step === 1 ? errorLine : null}
          {navigation()}
        </div>

        {/* ── Step 2 — The business ─────────────────────────── */}
        <div hidden={step !== 2}>
          <h2 className="mb-2 font-display text-[clamp(26px,3vw,34px)] leading-[1.1] text-ink">Your business</h2>
          <p className="mb-6 text-slate-500">What drivers will see at the top of your listing</p>

          <div className="mb-5">
            <label htmlFor="svc-name" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">Business name *</label>
            <input id="svc-name" name="name" maxLength={120} onChange={clearIf('name')} placeholder="e.g. Volt Motors EV Care" className={cn(FIELD, border('name'))} />
          </div>

          <div className="mb-5">
            <label htmlFor="svc-description" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">What you do *</label>
            <textarea
              id="svc-description"
              name="description"
              rows={4}
              maxLength={1000}
              onChange={clearIf('description')}
              placeholder="High-voltage certified workshop handling battery diagnostics, thermal system service and EV tyre fitting."
              className={cn(AREA, 'min-h-[110px]', border('description'))}
            />
            <p className="mt-1.5 text-ui-sm text-slate-500">The services you offer and what makes you good at them.</p>
          </div>

          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="svc-year" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Year you started <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-year" name="yearEstablished" inputMode="numeric" maxLength={4} onChange={clearIf('yearEstablished')} placeholder="e.g. 2019" className={cn(FIELD, border('yearEstablished'))} />
            </div>
            <div>
              <label htmlFor="svc-brands" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                EV makes you work with <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-brands" name="brands" maxLength={300} placeholder="e.g. BYD, MG, Hyundai, all makes" className={cn(FIELD, 'border-ink/10')} />
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="svc-pricing" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Prices <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
            </label>
            <textarea
              id="svc-pricing"
              name="pricing"
              rows={3}
              maxLength={600}
              placeholder={'e.g. Battery health check PKR 3,500\nHome charger installation from PKR 25,000'}
              className={cn(AREA, 'min-h-[90px] border-ink/10')}
            />
          </div>

          {step === 2 ? <div className="mt-6">{errorLine}</div> : null}
          {navigation()}
        </div>

        {/* ── Step 3 — Contact ──────────────────────────────── */}
        <div hidden={step !== 3}>
          <h2 className="mb-2 font-display text-[clamp(26px,3vw,34px)] leading-[1.1] text-ink">Who we should talk to</h2>
          <p className="mb-6 text-slate-500">
            The contact person is only for our team. Phone, WhatsApp, email and links appear on your listing.
          </p>

          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="svc-contact" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">Contact person *</label>
              <input id="svc-contact" name="contactName" maxLength={120} autoComplete="name" defaultValue={applicant.name} onChange={clearIf('contactName')} className={cn(FIELD, border('contactName'))} />
            </div>
            <div>
              <label htmlFor="svc-role" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Their role <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-role" name="contactRole" maxLength={80} placeholder="Owner, manager…" className={cn(FIELD, 'border-ink/10')} />
            </div>
            <div>
              <label htmlFor="svc-phone" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">Phone</label>
              <input id="svc-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" onChange={clearIf('phone')} placeholder="0300 1234567" className={cn(FIELD, border('phone'))} />
            </div>
            <div>
              <label htmlFor="svc-whatsapp" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                WhatsApp <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-whatsapp" name="whatsapp" type="tel" maxLength={20} placeholder="0300 1234567" className={cn(FIELD, 'border-ink/10')} />
            </div>
            <div>
              <label htmlFor="svc-email" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</label>
              <input id="svc-email" name="email" type="email" maxLength={254} autoComplete="email" defaultValue={applicant.email} onChange={clearIf('email')} className={cn(FIELD, border('email'))} />
            </div>
            <div>
              <label htmlFor="svc-website" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Website <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-website" name="website" type="url" maxLength={300} onChange={clearIf('website')} placeholder="yourbusiness.pk" className={cn(FIELD, border('website'))} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="svc-social" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Facebook or Instagram page <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-social" name="socialUrl" type="url" maxLength={300} placeholder="facebook.com/yourbusiness" className={cn(FIELD, 'border-ink/10')} />
            </div>
          </div>
          <p className="text-ui-sm text-slate-500">Leave at least a phone number or an email so we can reach you.</p>

          {step === 3 ? <div className="mt-6">{errorLine}</div> : null}
          {navigation()}
        </div>

        {/* ── Step 4 — Where and when ───────────────────────── */}
        <div hidden={step !== 4}>
          <h2 className="mb-2 font-display text-[clamp(26px,3vw,34px)] leading-[1.1] text-ink">Where you are and when you are open</h2>
          <p className="mb-6 text-slate-500">The pin drivers get directions to, and the hours on your listing</p>

          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="svc-city" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">City *</label>
              <input id="svc-city" name="city" maxLength={80} list="service-apply-cities" autoComplete="address-level2" onChange={clearIf('city')} placeholder="Start typing your city" className={cn(FIELD, border('city'))} />
              <datalist id="service-apply-cities">
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="svc-area" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Area or neighbourhood <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
              </label>
              <input id="svc-area" name="area" maxLength={120} onChange={clearIf('area')} placeholder="e.g. Gulberg III" className={cn(FIELD, border('area'))} />
            </div>
          </div>

          <div
            data-field="location"
            className={cn('mb-5', errorField === 'location' && 'rounded-xl ring-2 ring-red-300 ring-offset-4')}
          >
            <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">Exact location *</p>
            <p className="mb-3 text-ui-sm text-slate-500">
              Stand at your premises and tap the current-location button, or type the coordinates.
            </p>
            <LocationPicker
              idPrefix="service-apply"
              lat={position.lat}
              lng={position.lng}
              onChange={(nextPosition) => {
                setPosition(nextPosition)
                clearIf('location')()
              }}
              currentAddress={street}
              onAddressFound={({ address }) => setStreet(address)}
            />
          </div>

          <div className="mb-8">
            <label htmlFor="svc-street" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Street address <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-fog">(optional)</span>
            </label>
            <input id="svc-street" value={street} maxLength={200} onChange={(event) => setStreet(event.target.value)} className={cn(FIELD, border('street'))} />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <p className="mb-1 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <Clock size={16} className="text-slate-400" aria-hidden="true" />
              Opening hours
            </p>
            <p className="mb-4 text-ui-sm text-slate-500">Shown on your listing, so drivers do not arrive to a closed shutter.</p>
            <div data-field="hours">
              <HoursFields invalid={errorField === 'hours'} />
            </div>
          </div>

          {step === 4 ? <div className="mt-6">{errorLine}</div> : null}
          {navigation('Review application')}
        </div>

        {/* ── Step 5 — Review and send ──────────────────────── */}
        <div hidden={step !== 5}>
          <h2 className="mb-2 font-display text-[clamp(26px,3vw,34px)] leading-[1.1] text-ink">Review and submit</h2>
          <p className="mb-8 text-slate-500">Check everything before it goes to the plugpk review team</p>

          {summary ? (
            <div className="mb-6 divide-y divide-ink/10 rounded-[22px] bg-chalk px-5 sm:px-6">
              {[
                {
                  title: 'Business',
                  step: 2,
                  rows: [
                    ['Category', summary.category],
                    ['Name', summary.name],
                    ['What you do', summary.description],
                    ['Prices', summary.pricing],
                    ['Started', summary.yearEstablished],
                    ['EV makes', summary.brands],
                  ],
                },
                {
                  title: 'Contact',
                  step: 3,
                  rows: [
                    ['Contact person', [summary.contactName, summary.contactRole].filter(Boolean).join(' · ')],
                    ['Phone', summary.phone],
                    ['WhatsApp', summary.whatsapp],
                    ['Email', summary.email],
                    ['Website', summary.website],
                    ['Social page', summary.socialUrl],
                  ],
                },
                {
                  title: 'Location and hours',
                  step: 4,
                  rows: [
                    ['Address', [street, summary.area, summary.city].filter(Boolean).join(', ')],
                    ['Map pin', position.lat !== null && position.lng !== null ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : ''],
                    ['Hours', summary.hours],
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">{section.title}</h3>
                    <button type="button" onClick={() => goTo(section.step)} className="text-xs font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4">
                      Edit
                    </button>
                  </div>
                  {section.rows
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 py-1">
                        <span className="shrink-0 text-sm text-slate-500">{label}</span>
                        <span className="min-w-0 whitespace-pre-line break-words text-right text-sm font-medium text-slate-900">{value}</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : null}

          <label
            data-field="agree"
            className={cn(
              'mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-4 text-sm text-muted',
              errorField === 'agree' ? 'border-red-400 bg-red-50/50' : 'border-ink/10',
            )}
          >
            <input
              type="checkbox"
              name="agree"
              onChange={clearIf('agree')}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-ink"
            />
            <span>
              The details above are correct and I can speak for this business. I understand the listing is checked by
              the plugpk team before it is published, and that listing costs PKR 4,999 a month once approved.
            </span>
          </label>

          {step === 5 ? errorLine : null}

          <div className="flex gap-3">
            <button type="button" className={btnClass('ghost', 'lg')} onClick={() => goTo(4)}>
              Back
            </button>
            <Button type="submit" fullWidth size="lg" className="h-[58px] rounded-full bg-volt text-base text-ink shadow-volt hover:bg-ink hover:text-white" isLoading={pending}>
              Submit for review
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

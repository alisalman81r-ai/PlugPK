// src/components/business/services/ServiceProfileEditor.tsx
'use client'

import { AlertTriangle, CheckCircle2, Clock, Package } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { LocationPicker } from '@/components/business/LocationPicker'
import { HoursFields } from '@/components/services/HoursFields'
import { CATEGORY_ICON } from '@/components/services/ServiceCategoryTabs'
import { Button } from '@/components/ui'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { OwnerService } from '@/lib/db/service-owner-queries'
import { updateMyService } from '@/lib/db/service-owner-actions'
import { cn } from '@/lib/utils'

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'
const AREA =
  'w-full resize-y rounded-xl border-[1.5px] bg-white p-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500'

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {hint ? <p className="mt-1 text-ui-sm text-slate-500">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

/**
 * The owner's own service listing, editable in place. The same sections and
 * the same checks as the application. A live listing whose category changes or
 * whose pin moves more than a kilometre goes back for review; the owner is told
 * and asked before anything is saved.
 */
export function ServiceProfileEditor({ service }: { service: OwnerService }) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [category, setCategory] = React.useState(service.category)
  const [position, setPosition] = React.useState<{ lat: number | null; lng: number | null }>({ lat: service.lat, lng: service.lng })
  const [street, setStreet] = React.useState(service.street)
  const [busy, setBusy] = React.useState(false)
  const [confirming, setConfirming] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ tone: 'ok' | 'error'; text: string; field?: string } | null>(null)

  const save = async (confirmReview = false) => {
    if (!formRef.current) return
    const form = new FormData(formRef.current)
    form.set('id', service.id)
    form.set('category', category)
    form.set('street', street)
    form.set('lat', String(position.lat ?? ''))
    form.set('lng', String(position.lng ?? ''))
    if (confirmReview) form.set('confirmReview', '1')

    setBusy(true)
    setMessage(null)
    try {
      const result = await updateMyService(form)
      if (result.needsConfirmation) {
        setConfirming(result.message ?? 'This change sends your listing back for review.')
        return
      }
      setConfirming(null)
      if (!result.ok) {
        setMessage({ tone: 'error', text: result.message ?? 'Could not save.', field: result.field })
        return
      }
      setMessage({
        tone: 'ok',
        text: result.backToReview
          ? 'Saved. Your listing has gone back to the review queue — the outcome will appear on your Overview.'
          : 'Saved. Your listing shows the new details.',
      })
      router.refresh()
    } catch {
      setMessage({ tone: 'error', text: 'Could not reach plugpk. Check your connection and try again.' })
    } finally {
      setBusy(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const border = (field: string) => (message?.field === field ? 'border-red-400' : 'border-slate-200')

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
      className="flex max-w-3xl flex-col gap-6"
    >
      {message ? (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-2 rounded-xl px-4 py-3 text-ui-sm',
            message.tone === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {message.tone === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
          {message.text}
        </p>
      ) : null}

      {service.status === 'approved' ? (
        <p className="flex items-start gap-2 rounded-xl bg-slate-100 px-4 py-3 text-ui-sm text-slate-600">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          Your listing is live. Changing its category or moving its pin more than 1 km sends it back for review.
        </p>
      ) : null}

      <Section title="What you offer">
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
                onClick={() => setCategory(key)}
                className={cn(
                  'rounded-2xl border-[1.5px] p-4 text-left transition-all',
                  selected ? 'border-plug-blue-500 bg-plug-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <Icon size={20} className={cn('mb-2', selected ? 'text-plug-blue-600' : 'text-slate-400')} aria-hidden="true" />
                <span className="block text-sm font-semibold text-slate-900">{meta.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Your business" hint="What drivers see at the top of your listing.">
        <div className="grid gap-5">
          <div>
            <label htmlFor="sp-name" className="mb-2 block text-sm font-semibold text-slate-700">Business name *</label>
            <input id="sp-name" name="name" maxLength={120} defaultValue={service.name} className={cn(FIELD, border('name'))} />
          </div>
          <div>
            <label htmlFor="sp-description" className="mb-2 block text-sm font-semibold text-slate-700">What you do *</label>
            <textarea id="sp-description" name="description" rows={4} maxLength={1000} defaultValue={service.description} className={cn(AREA, 'min-h-[110px]', border('description'))} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sp-year" className="mb-2 block text-sm font-semibold text-slate-700">Year you started</label>
              <input id="sp-year" name="yearEstablished" inputMode="numeric" maxLength={4} defaultValue={service.yearEstablished ?? ''} className={cn(FIELD, border('yearEstablished'))} />
            </div>
            <div>
              <label htmlFor="sp-brands" className="mb-2 block text-sm font-semibold text-slate-700">EV makes you work with</label>
              <input id="sp-brands" name="brands" maxLength={300} defaultValue={service.brands ?? ''} className={cn(FIELD, 'border-slate-200')} />
            </div>
          </div>
          <div>
            <label htmlFor="sp-pricing" className="mb-2 block text-sm font-semibold text-slate-700">Prices</label>
            <textarea id="sp-pricing" name="pricing" rows={3} maxLength={600} defaultValue={service.pricing ?? ''} className={cn(AREA, 'min-h-[90px] border-slate-200')} />
          </div>
        </div>
      </Section>

      <Section title="Contact" hint="The contact person is only for our team. Phone, WhatsApp, email and links appear on your listing.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sp-contact" className="mb-2 block text-sm font-semibold text-slate-700">Contact person *</label>
            <input id="sp-contact" name="contactName" maxLength={120} defaultValue={service.contactName ?? ''} className={cn(FIELD, border('contactName'))} />
          </div>
          <div>
            <label htmlFor="sp-role" className="mb-2 block text-sm font-semibold text-slate-700">Their role</label>
            <input id="sp-role" name="contactRole" maxLength={80} defaultValue={service.contactRole ?? ''} className={cn(FIELD, 'border-slate-200')} />
          </div>
          <div>
            <label htmlFor="sp-phone" className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
            <input id="sp-phone" name="phone" type="tel" maxLength={20} defaultValue={service.phone} className={cn(FIELD, border('phone'))} />
          </div>
          <div>
            <label htmlFor="sp-whatsapp" className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp</label>
            <input id="sp-whatsapp" name="whatsapp" type="tel" maxLength={20} defaultValue={service.whatsapp ?? ''} className={cn(FIELD, 'border-slate-200')} />
          </div>
          <div>
            <label htmlFor="sp-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input id="sp-email" name="email" type="email" maxLength={254} defaultValue={service.email ?? ''} className={cn(FIELD, border('email'))} />
          </div>
          <div>
            <label htmlFor="sp-website" className="mb-2 block text-sm font-semibold text-slate-700">Website</label>
            <input id="sp-website" name="website" type="url" maxLength={300} defaultValue={service.website ?? ''} className={cn(FIELD, border('website'))} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sp-social" className="mb-2 block text-sm font-semibold text-slate-700">Facebook or Instagram page</label>
            <input id="sp-social" name="socialUrl" type="url" maxLength={300} defaultValue={service.socialUrl ?? ''} className={cn(FIELD, 'border-slate-200')} />
          </div>
        </div>
      </Section>

      <Section title="Where you are" hint="The pin drivers get directions to.">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sp-city" className="mb-2 block text-sm font-semibold text-slate-700">City *</label>
              <input id="sp-city" name="city" maxLength={80} list="sp-cities" defaultValue={service.city} className={cn(FIELD, border('city'))} />
              <datalist id="sp-cities">
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="sp-area" className="mb-2 block text-sm font-semibold text-slate-700">Area or neighbourhood</label>
              <input id="sp-area" name="area" maxLength={120} defaultValue={service.area} className={cn(FIELD, border('area'))} />
            </div>
          </div>
          <div className={cn(message?.field === 'location' && 'rounded-xl ring-2 ring-red-300 ring-offset-4')}>
            <p className="mb-3 text-sm font-semibold text-slate-700">Exact location *</p>
            <LocationPicker
              idPrefix="service-profile"
              lat={position.lat}
              lng={position.lng}
              onChange={setPosition}
              currentAddress={street}
              onAddressFound={({ address }) => setStreet(address)}
            />
          </div>
          <div>
            <label htmlFor="sp-street" className="mb-2 block text-sm font-semibold text-slate-700">Street address</label>
            <input id="sp-street" value={street} maxLength={200} onChange={(event) => setStreet(event.target.value)} className={cn(FIELD, border('street'))} />
          </div>
        </div>
      </Section>

      <Section title="Opening hours" hint="Shown on your listing, so drivers do not arrive to a closed shutter.">
        <div className="flex items-start gap-2">
          <Clock size={16} className="mt-3 shrink-0 text-slate-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <HoursFields initial={service.operatingHours ?? undefined} invalid={message?.field === 'hours'} />
          </div>
        </div>
      </Section>

      {confirming ? (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-ui-sm font-semibold text-amber-900">This sends your listing back for review</p>
          <p className="mt-1 text-ui-sm text-amber-800">{confirming}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void save(true)} isLoading={busy}>
              Save and send for review
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(null)} disabled={busy}>
              Keep editing
            </Button>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <Button type="submit" size="lg" className="h-12 bg-gradient-brand shadow-lg" isLoading={busy}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

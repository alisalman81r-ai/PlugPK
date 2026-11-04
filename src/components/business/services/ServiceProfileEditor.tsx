// src/components/business/services/ServiceProfileEditor.tsx
'use client'

import { Loader2, Package } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { btnClass, FGRID, Fld, FormCard, FormError, Ico, IN, TEXTAREA } from '@/components/admin/network-kit'
import { LocationPicker } from '@/components/business/LocationPicker'
import { HoursFields } from '@/components/services/HoursFields'
import { CATEGORY_ICON } from '@/components/services/ServiceCategoryTabs'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { OwnerService } from '@/lib/db/service-owner-queries'
import { updateMyService } from '@/lib/db/service-owner-actions'
import { cn } from '@/lib/utils'

import { FormOk, LIFT, Notice, Reveal, SaveBar } from '../host/biz-kit'

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

  /** Marks the field the server named, which .in draws in ember. */
  const bad = (field: string) => (message?.field === field ? true : undefined)

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
      className="grid max-w-[920px] gap-[18px]"
    >
      {message ? (
        <Reveal key={message.text}>{message.tone === 'error' ? <FormError>{message.text}</FormError> : <FormOk>{message.text}</FormOk>}</Reveal>
      ) : null}

      {service.status === 'approved' ? (
        <Notice title="Your listing is live." tone="info" className="mb-0">
          Changing its category or moving its pin more than 1 km sends it back for review.
        </Notice>
      ) : null}

      <FormCard i={0} title="What you offer" sub="The category drivers find you under.">
        <div role="group" aria-label="Category" className="mt-[22px] grid grid-cols-3 gap-3 max-[900px]:grid-cols-2">
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
                  'relative flex min-h-[92px] flex-col items-start justify-between gap-3 rounded-[18px] border p-4 text-left',
                  LIFT,
                  selected
                    ? 'border-ink bg-ink text-white shadow-[0_20px_40px_-24px_rgba(11,12,14,.6)]'
                    : 'border-ink/[.09] bg-paper text-ink hover:border-ink/30',
                )}
              >
                <Icon size={22} className={selected ? 'text-volt' : 'text-muted'} aria-hidden="true" />
                <span className="block text-sm font-semibold">{meta.label}</span>
                {selected ? (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-volt text-ink [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <Ico name="check" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </FormCard>

      <FormCard i={1} title="Your business" sub="What drivers see at the top of your listing.">
        <div className={FGRID}>
          <Fld label="Business name" htmlFor="sp-name" required full>
            <input id="sp-name" name="name" maxLength={120} defaultValue={service.name} aria-invalid={bad('name')} className={IN} />
          </Fld>
          <Fld label="What you do" htmlFor="sp-description" required full>
            <textarea id="sp-description" name="description" rows={4} maxLength={1000} defaultValue={service.description} aria-invalid={bad('description')} className={cn(TEXTAREA, 'min-h-[120px]')} />
          </Fld>
          <Fld label="Year you started" htmlFor="sp-year" optional>
            <input id="sp-year" name="yearEstablished" inputMode="numeric" maxLength={4} defaultValue={service.yearEstablished ?? ''} aria-invalid={bad('yearEstablished')} className={cn(IN, 'font-mono')} />
          </Fld>
          <Fld label="EV makes you work with" htmlFor="sp-brands" optional>
            <input id="sp-brands" name="brands" maxLength={300} defaultValue={service.brands ?? ''} className={IN} />
          </Fld>
          <Fld label="Prices" htmlFor="sp-pricing" optional full>
            <textarea id="sp-pricing" name="pricing" rows={3} maxLength={600} defaultValue={service.pricing ?? ''} className={cn(TEXTAREA, 'min-h-[96px]')} />
          </Fld>
        </div>
      </FormCard>

      <FormCard i={2} title="Contact" sub="The contact person is only for our team. Phone, WhatsApp, email and links appear on your listing.">
        <div className={FGRID}>
          <Fld label="Contact person" htmlFor="sp-contact" required>
            <input id="sp-contact" name="contactName" maxLength={120} defaultValue={service.contactName ?? ''} aria-invalid={bad('contactName')} className={IN} />
          </Fld>
          <Fld label="Their role" htmlFor="sp-role" optional>
            <input id="sp-role" name="contactRole" maxLength={80} defaultValue={service.contactRole ?? ''} className={IN} />
          </Fld>
          <Fld label="Phone" htmlFor="sp-phone">
            <input id="sp-phone" name="phone" type="tel" maxLength={20} defaultValue={service.phone} aria-invalid={bad('phone')} className={cn(IN, 'font-mono')} />
          </Fld>
          <Fld label="WhatsApp" htmlFor="sp-whatsapp" optional>
            <input id="sp-whatsapp" name="whatsapp" type="tel" maxLength={20} defaultValue={service.whatsapp ?? ''} className={cn(IN, 'font-mono')} />
          </Fld>
          <Fld label="Email" htmlFor="sp-email" optional>
            <input id="sp-email" name="email" type="email" maxLength={254} defaultValue={service.email ?? ''} aria-invalid={bad('email')} className={IN} />
          </Fld>
          <Fld label="Website" htmlFor="sp-website" optional>
            <input id="sp-website" name="website" type="url" maxLength={300} defaultValue={service.website ?? ''} aria-invalid={bad('website')} className={IN} />
          </Fld>
          <Fld label="Facebook or Instagram page" htmlFor="sp-social" optional full>
            <input id="sp-social" name="socialUrl" type="url" maxLength={300} defaultValue={service.socialUrl ?? ''} className={IN} />
          </Fld>
        </div>
      </FormCard>

      <FormCard i={3} title="Where you are" sub="The pin drivers get directions to.">
        <div className={FGRID}>
          <Fld label="City" htmlFor="sp-city" required>
            <input id="sp-city" name="city" maxLength={80} list="sp-cities" defaultValue={service.city} aria-invalid={bad('city')} className={IN} />
            <datalist id="sp-cities">
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </Fld>
          <Fld label="Area or neighbourhood" htmlFor="sp-area" optional>
            <input id="sp-area" name="area" maxLength={120} defaultValue={service.area} aria-invalid={bad('area')} className={IN} />
          </Fld>
          <div
            className={cn(
              'col-span-full grid gap-2 rounded-[18px] border border-ink/[.09] bg-paper p-[18px] transition-[border-color,box-shadow]',
              message?.field === 'location' && 'border-ember shadow-[0_0_0_4px_rgba(255,90,31,.15)]',
            )}
          >
            <p className="m-0 text-sm font-medium text-ink">
              Exact location<span className="ml-1 text-[#c2410c]" aria-hidden="true">*</span>
            </p>
            <LocationPicker
              idPrefix="service-profile"
              lat={position.lat}
              lng={position.lng}
              onChange={setPosition}
              currentAddress={street}
              onAddressFound={({ address }) => setStreet(address)}
            />
          </div>
          <Fld label="Street address" htmlFor="sp-street" full>
            <input id="sp-street" value={street} maxLength={200} onChange={(event) => setStreet(event.target.value)} aria-invalid={bad('street')} className={IN} />
          </Fld>
        </div>
      </FormCard>

      <FormCard i={4} title="Opening hours" sub="Shown on your listing, so drivers do not arrive to a closed shutter.">
        <div className="mt-[22px]">
          <HoursFields initial={service.operatingHours ?? undefined} invalid={message?.field === 'hours'} />
        </div>
      </FormCard>

      {confirming ? (
        <Reveal role="alert">
          <div className="rounded-[20px] border border-[rgba(255,176,32,.45)] bg-[#FFF8E8] p-5">
            <p className="m-0 flex items-center gap-2.5 font-display text-lg font-normal text-ink [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[#8a5a00]">
              <Ico name="alert" />
              This sends your listing back for review
            </p>
            <p className="mb-0 mt-1.5 text-sm text-[#6b4b00]">{confirming}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button type="button" onClick={() => void save(true)} disabled={busy} className={btnClass('ink')}>
                {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
                Save and send for review
              </button>
              <button type="button" onClick={() => setConfirming(null)} disabled={busy} className={btnClass('line')}>
                Keep editing
              </button>
            </div>
          </div>
        </Reveal>
      ) : null}

      <SaveBar>
        <button type="submit" disabled={busy} className={btnClass('ink')}>
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
          {busy ? 'Saving' : 'Save changes'}
        </button>
        <span className="text-[13px] text-muted">Fields marked * are required.</span>
      </SaveBar>
    </form>
  )
}

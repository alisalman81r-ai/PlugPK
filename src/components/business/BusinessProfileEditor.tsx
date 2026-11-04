// src/components/business/BusinessProfileEditor.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import {
  btnClass,
  FGRID,
  FieldSelect,
  Fld,
  FormCard,
  FormError,
  Ico,
  IN,
  Note,
  Pill,
  TEXTAREA,
} from '@/components/admin/network-kit'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { updateMyBusiness } from '@/lib/db/business-actions'
import { distanceKm, MOVE_REVIEW_KM } from '@/lib/db/business-listing'
import type { BusinessRow } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

import { Reveal, SaveBar, SavedTick } from './host/biz-kit'
import { LocationPicker } from './LocationPicker'

/**
 * Edits the owner's real listing.
 *
 * This component used to take MOCK_BUSINESS and an onSave that set React state:
 * every edit looked like it worked and was gone on the next page load. It now
 * posts to a server action that checks the listing belongs to the signed-in
 * account before writing.
 *
 * Only the fields the listing actually stores appear here. Opening hours,
 * amenities and photos are not collected anywhere yet, so offering inputs for
 * them would be collecting information into nothing.
 */

export interface BusinessProfileEditorProps {
  business: BusinessRow
}

const TYPES: { value: string; label: string }[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'mall', label: 'Shopping Mall' },
  { value: 'office', label: 'Office' },
  { value: 'dealership', label: 'Dealership' },
  { value: 'service-center', label: 'Service Center' },
  { value: 'home', label: 'Home Charger' },
]

const MAX_DESCRIPTION = 600

export function BusinessProfileEditor({ business }: BusinessProfileEditorProps) {
  const [name, setName] = React.useState(business.businessName)
  const [type, setType] = React.useState(business.businessType)
  const [description, setDescription] = React.useState(business.description ?? '')
  const [city, setCity] = React.useState(business.city)
  const [address, setAddress] = React.useState(business.address ?? '')
  const [phone, setPhone] = React.useState(business.phone ?? '')
  const [website, setWebsite] = React.useState(business.website ?? '')
  const [position, setPosition] = React.useState<{ lat: number | null; lng: number | null }>({
    lat: business.lat,
    lng: business.lng,
  })

  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  // Set when the server says this save would send a live listing back for
  // review; the owner then confirms or puts the pin back.
  const [confirming, setConfirming] = React.useState<string | null>(null)

  const isHome = type === 'home'

  /*
    The approved pin, and how far the edited one is from it. Shown before Save
    so moving a live listing across town is never a surprise: past a kilometre
    the listing goes back for review and leaves the map until it is approved.
  */
  const original =
    business.status === 'approved' && business.lat !== null && business.lng !== null
      ? { lat: business.lat, lng: business.lng }
      : null
  const movedKm =
    original && position.lat !== null && position.lng !== null
      ? distanceKm(original, { lat: position.lat, lng: position.lng })
      : original
        ? Infinity
        : 0
  const movesOffMap = original !== null && movedKm > MOVE_REVIEW_KM

  const handleSave = async (confirmMove = false) => {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    const form = new FormData()
    form.set('id', business.id)
    form.set('businessName', name)
    form.set('businessType', type)
    form.set('description', description)
    form.set('city', city)
    form.set('address', address)
    form.set('phone', phone)
    form.set('website', website)
    if (position.lat !== null) form.set('lat', String(position.lat))
    if (position.lng !== null) form.set('lng', String(position.lng))
    if (confirmMove) form.set('confirmMove', '1')

    const result = await updateMyBusiness(form)
    setIsSaving(false)

    if (result.needsConfirmation) {
      setConfirming(result.message ?? 'This change sends your listing back for review.')
      return
    }
    setConfirming(null)

    if (!result.ok) {
      setError(result.message ?? 'Could not save your changes.')
      return
    }

    if (result.backToReview) {
      setNotice('Saved. Your listing is back in the review queue and will return to the map once it is approved.')
    }
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const typeLabel = TYPES.find((option) => option.value === type)?.label ?? type
  const pinned = position.lat !== null && position.lng !== null

  return (
    <div className="grid max-w-[1240px] items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 gap-[18px]">
        {/* ── Identity ─────────────────────────────────────────── */}
        <FormCard i={0} title={isHome ? 'Your listing' : 'Business details'} sub="The name and words drivers see first.">
          <div className={FGRID}>
            <Fld label={isHome ? 'Listing name' : 'Business name'} htmlFor="biz-name">
              <input
                id="biz-name"
                type="text"
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                className={IN}
              />
            </Fld>

            <Fld label="Type" htmlFor="biz-type">
              <FieldSelect id="biz-type" value={type} onChange={(event) => setType(event.target.value)}>
                {TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FieldSelect>
            </Fld>

            <Fld
              label="Description"
              htmlFor="biz-desc"
              full
              hint={
                <span className="flex justify-between gap-3">
                  <span>What should a driver know before they arrive?</span>
                  <span className={cn('font-mono tabular-nums', description.length > MAX_DESCRIPTION - 40 && 'text-[#b23b0d]')}>
                    {description.length}/{MAX_DESCRIPTION}
                  </span>
                </span>
              }
            >
              <textarea
                id="biz-desc"
                value={description}
                maxLength={MAX_DESCRIPTION}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Parking on the left of the main gate; ask the guard for the charger key."
                className={cn(TEXTAREA, 'min-h-[120px]')}
              />
            </Fld>
          </div>
        </FormCard>

        {/* ── Where it is ──────────────────────────────────────── */}
        <FormCard i={1} title="Location" sub="The pin is what puts your listing on the map at all.">
          <div className={FGRID}>
            <Fld label="City" htmlFor="biz-city">
              <FieldSelect id="biz-city" value={city} onChange={(event) => setCity(event.target.value)}>
                {PAKISTAN_CITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </FieldSelect>
            </Fld>

            <Fld label="Address" htmlFor="biz-address" full>
              <textarea
                id="biz-address"
                value={address}
                maxLength={300}
                onChange={(event) => setAddress(event.target.value)}
                className={cn(TEXTAREA, 'min-h-[84px]')}
              />
            </Fld>

            {/* The pin is what puts the listing on the map at all, so it is
                editable here rather than frozen at whatever was set on sign-up. */}
            <div className="col-span-full">
              <LocationPicker
                lat={position.lat}
                lng={position.lng}
                onChange={setPosition}
                idPrefix="profile"
                currentAddress={address}
                onAddressFound={({ address: found, city: foundCity }) => {
                  setAddress(found)
                  if (foundCity) setCity(foundCity)
                }}
              />

              {!pinned ? (
                <Note tone="warn">Without a pin this listing cannot appear on the map.</Note>
              ) : null}

              {movesOffMap ? (
                <Reveal role="note">
                  <Note tone="warn">
                    {Number.isFinite(movedKm)
                      ? `This pin is ${movedKm.toFixed(1)} km from the approved one.`
                      : 'The approved pin has been removed.'}{' '}
                    Saving will send your listing back for review, and it will be off the map until it is approved again.
                  </Note>
                </Reveal>
              ) : null}
            </div>
          </div>
        </FormCard>

        {/* ── How to reach you ─────────────────────────────────── */}
        <FormCard i={2} title="Contact" sub="How drivers reach you from the listing.">
          <div className={FGRID}>
            <Fld label="Phone" htmlFor="biz-phone">
              <input
                id="biz-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0300-1234567"
                className={cn(IN, 'font-mono')}
              />
            </Fld>

            <Fld label="Website" htmlFor="biz-website">
              <input
                id="biz-website"
                type="url"
                value={website}
                maxLength={300}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://"
                className={IN}
              />
            </Fld>

            {/* Read-only on purpose: this address links the listing to the account
                that signs in. Changing it here would break that link silently. */}
            <div className="col-span-full flex items-center gap-3 rounded-[14px] border border-ink/[.09] bg-paper px-4 py-3 [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:text-fog">
              <Ico name="mail" />
              <div className="min-w-0">
                <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">Account email</span>
                <span className="block truncate text-sm text-ink">{business.email}</span>
              </div>
              <span className="ml-auto text-xs text-muted">Used to sign in</span>
            </div>
          </div>
        </FormCard>

        {error ? <FormError>{error}</FormError> : null}
        {notice ? <Note tone="warn">{notice}</Note> : null}

        {confirming ? (
          <Reveal role="alertdialog" aria-label="Confirm moving the pin">
            <div className="rounded-[20px] border border-[rgba(255,176,32,.45)] bg-[#FFF8E8] p-5">
              <p className="m-0 flex items-start gap-2.5 text-sm font-semibold text-[#6b4b00] [&_svg]:mt-px [&_svg]:h-[18px] [&_svg]:w-[18px]">
                <Ico name="alert" />
                {confirming}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => void handleSave(true)} disabled={isSaving} className={btnClass('ink')}>
                  Move the pin and resubmit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (original) setPosition(original)
                    setConfirming(null)
                  }}
                  disabled={isSaving}
                  className={btnClass('line')}
                >
                  <Ico name="undo" />
                  Keep the approved pin
                </button>
              </div>
            </div>
          </Reveal>
        ) : null}

        <SaveBar>
          <button type="button" onClick={() => void handleSave(false)} disabled={isSaving} className={btnClass('ink')}>
            {isSaving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
            {isSaving ? 'Saving' : 'Save changes'}
          </button>
          {isSaved ? <SavedTick /> : null}
          {business.status !== 'approved' ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-fog">
              <Ico name="building" />
              Changes go live once the listing is approved.
            </span>
          ) : null}
        </SaveBar>
      </div>

      {/* What a driver sees, as it is being typed. */}
      <aside
        data-adm-in=""
        style={{ '--i': 3 } as React.CSSProperties}
        aria-label="Listing preview"
        className="relative overflow-hidden rounded-[20px] bg-ink p-6 text-white shadow-[0_30px_60px_-30px_rgba(11,12,14,.6)] xl:sticky xl:top-24"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.18),transparent_70%)]"
        />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-fog">What drivers see</span>
        <b className="mt-3 block break-words font-display text-[26px] font-normal leading-[1.1] text-white">
          {name.trim() || 'Your listing'}
        </b>
        <span className="mt-2 inline-flex items-center gap-2 text-sm text-fog">
          <span className="rounded-md border border-volt/40 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-volt">
            {typeLabel}
          </span>
          {city}
        </span>
        {description.trim() ? (
          <p className="mb-0 mt-4 line-clamp-4 text-sm leading-relaxed text-white/75">{description}</p>
        ) : null}
        <ul className="m-0 mt-5 grid list-none gap-2.5 border-t border-white/[.08] p-0 pt-5 text-sm text-white/80 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-volt">
          <li className="flex items-start gap-2.5">
            <Ico name="pinl" className="mt-0.5" />
            <span className="min-w-0 break-words">{address.trim() || 'No address yet'}</span>
          </li>
          {phone.trim() ? (
            <li className="flex items-center gap-2.5">
              <Ico name="phone" />
              <span className="font-mono">{phone}</span>
            </li>
          ) : null}
          {website.trim() ? (
            <li className="flex items-center gap-2.5">
              <Ico name="globe" />
              <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
            </li>
          ) : null}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {business.status === 'approved' ? (
            <Pill tone="ok" icon="okc" className="bg-[rgba(53,208,127,.16)] text-[#7ee2aa]">Live on the map</Pill>
          ) : (
            <Pill tone="warn" icon="clock" className="bg-[rgba(255,176,32,.16)] text-[#ffcf73]">Not live yet</Pill>
          )}
          <Pill tone="unk" icon="pinl" className={cn('bg-white/[.06]', pinned ? 'text-white/80' : 'text-[#ff9a73]')}>
            {pinned ? 'Pin set' : 'No pin'}
          </Pill>
        </div>
      </aside>
    </div>
  )
}

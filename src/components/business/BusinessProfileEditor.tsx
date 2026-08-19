// src/components/business/BusinessProfileEditor.tsx
'use client'

import { Building2, Check, Loader2, MapPin } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { updateMyBusiness } from '@/lib/db/business-actions'
import type { BusinessRow } from '@/lib/db/queries'

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

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:shadow-focus'

const AREA =
  'w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-lg font-bold text-slate-900">{children}</h2>
}

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

  const isHome = type === 'home'

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

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

    const result = await updateMyBusiness(form)
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message ?? 'Could not save your changes.')
      return
    }

    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Identity ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <SectionTitle>{isHome ? 'Your listing' : 'Business details'}</SectionTitle>

        <div className="mb-5">
          <label htmlFor="biz-name" className="mb-2 block text-sm font-semibold text-slate-700">
            {isHome ? 'Listing name' : 'Business name'}
          </label>
          <input
            id="biz-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="biz-type" className="mb-2 block text-sm font-semibold text-slate-700">
            Type
          </label>
          <select
            id="biz-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={`${FIELD} cursor-pointer`}
          >
            {TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="biz-desc" className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            id="biz-desc"
            value={description}
            maxLength={MAX_DESCRIPTION}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What should a driver know before they arrive?"
            className={`${AREA} min-h-[120px]`}
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {description.length}/{MAX_DESCRIPTION}
          </p>
        </div>
      </section>

      {/* ── Where it is ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <SectionTitle>Location</SectionTitle>

        <div className="mb-5">
          <label htmlFor="biz-city" className="mb-2 block text-sm font-semibold text-slate-700">
            City
          </label>
          <div className="relative">
            <MapPin
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <select
              id="biz-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={`${FIELD} cursor-pointer pl-11`}
            >
              {PAKISTAN_CITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="biz-address" className="mb-2 block text-sm font-semibold text-slate-700">
            Address
          </label>
          <textarea
            id="biz-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={`${AREA} min-h-[80px]`}
          />
        </div>

        {/* The pin is what puts the listing on the map at all, so it is
            editable here rather than frozen at whatever was set on sign-up. */}
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

        {position.lat === null || position.lng === null ? (
          <p className="mt-3 text-ui-sm text-amber-700">
            Without a pin this listing cannot appear on the map.
          </p>
        ) : null}
      </section>

      {/* ── How to reach you ─────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <SectionTitle>Contact</SectionTitle>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="biz-phone" className="mb-2 block text-sm font-semibold text-slate-700">
              Phone
            </label>
            <input
              id="biz-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0300-1234567"
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="biz-website" className="mb-2 block text-sm font-semibold text-slate-700">
              Website
            </label>
            <input
              id="biz-website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://"
              className={FIELD}
            />
          </div>
        </div>

        {/* Read-only on purpose: this address links the listing to the account
            that signs in. Changing it here would break that link silently. */}
        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">
            Account email
          </p>
          <p className="mt-0.5 text-ui-sm text-slate-700">{business.email}</p>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            'Save changes'
          )}
        </Button>

        {isSaved ? (
          <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
            <Check size={16} aria-hidden="true" />
            Saved
          </span>
        ) : null}

        {business.status !== 'approved' ? (
          <span className="inline-flex items-center gap-1.5 text-ui-sm text-slate-500">
            <Building2 size={14} className="text-slate-400" aria-hidden="true" />
            Changes go live once the listing is approved.
          </span>
        ) : null}
      </div>
    </div>
  )
}

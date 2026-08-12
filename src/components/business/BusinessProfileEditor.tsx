// src/components/business/BusinessProfileEditor.tsx
'use client'

import { Camera, CheckCircle2, Globe, Mail, MapPin, Phone } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import type { Business, BusinessType, DayHours } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface BusinessProfileEditorProps {
  business: Business
  onSave: (data: Partial<Business>) => void
}

const BUSINESS_TYPES: BusinessType[] = [
  'hotel',
  'restaurant',
  'mall',
  'office',
  'dealership',
  'service-center',
  'other',
]

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:shadow-focus'

const MAX_DESCRIPTION = 500

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-lg font-bold text-slate-900">{children}</h2>
}

export function BusinessProfileEditor({ business, onSave }: BusinessProfileEditorProps) {
  const [name, setName] = React.useState(business.name)
  const [type, setType] = React.useState<BusinessType>(business.type)
  const [description, setDescription] = React.useState(business.description)
  const [city, setCity] = React.useState(business.address.city)
  const [street, setStreet] = React.useState(business.address.street)
  const [phone, setPhone] = React.useState(business.phone)
  const [email, setEmail] = React.useState(business.email)
  const [website, setWebsite] = React.useState(business.website ?? '')
  const [is24Hours, setIs24Hours] = React.useState(business.operatingHours.is24Hours)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    onSave({
      name,
      type,
      description,
      phone,
      email,
      website: website || undefined,
      address: { ...business.address, city, street },
      operatingHours: { ...business.operatingHours, is24Hours },
    })
    setIsLoading(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      {/* 1 — Basic information */}
      <section className="mb-10">
        <SectionTitle>Basic Information</SectionTitle>

        <div className="mb-5">
          <label htmlFor="biz-name" className="mb-2 block text-sm font-semibold text-slate-700">
            Business Name
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
            Business Type
          </label>
          <select
            id="biz-type"
            value={type}
            onChange={(event) => setType(event.target.value as BusinessType)}
            className={cn(FIELD, 'cursor-pointer capitalize')}
          >
            {BUSINESS_TYPES.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option.replace('-', ' ')}
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
            className="min-h-[120px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all focus:border-plug-blue-500"
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {description.length}/{MAX_DESCRIPTION}
          </p>
        </div>
      </section>

      {/* 2 — Location */}
      <section className="mb-10">
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
              className={cn(FIELD, 'cursor-pointer pl-11')}
            >
              {PAKISTAN_CITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="biz-address" className="mb-2 block text-sm font-semibold text-slate-700">
            Full Address
          </label>
          <textarea
            id="biz-address"
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all focus:border-plug-blue-500"
          />
        </div>
      </section>

      {/* 3 — Contact */}
      <section className="mb-10">
        <SectionTitle>Contact</SectionTitle>

        <div className="mb-5">
          <label htmlFor="biz-phone" className="mb-2 block text-sm font-semibold text-slate-700">
            Phone Number
          </label>
          <div className="relative">
            <Phone
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="biz-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={cn(FIELD, 'pl-11')}
            />
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="biz-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="biz-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={cn(FIELD, 'pl-11')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="biz-website" className="mb-2 block text-sm font-semibold text-slate-700">
            Website URL
          </label>
          <div className="relative">
            <Globe
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="biz-website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className={cn(FIELD, 'pl-11')}
            />
          </div>
        </div>
      </section>

      {/* 4 — Operating hours */}
      <section className="mb-10">
        <SectionTitle>Operating Hours</SectionTitle>

        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <span className="text-sm font-semibold text-slate-900">Open 24 hours</span>
          <button
            type="button"
            role="switch"
            aria-checked={is24Hours}
            aria-label="Open 24 hours"
            onClick={() => setIs24Hours((value) => !value)}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              is24Hours ? 'bg-green-500' : 'bg-slate-200',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200',
                is24Hours ? 'translate-x-[23px]' : 'translate-x-[3px]',
              )}
            />
          </button>
        </div>

        {!is24Hours ? (
          <div className="flex flex-col gap-2">
            {DAYS.map((day) => {
              const hours: DayHours = business.operatingHours[day]

              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-slate-700">{day}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="time"
                      defaultValue={hours.open}
                      aria-label={`${day} opening time`}
                      className="h-9 rounded-lg border border-slate-200 px-2 font-mono text-sm text-slate-700"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="time"
                      defaultValue={hours.close}
                      aria-label={`${day} closing time`}
                      className="h-9 rounded-lg border border-slate-200 px-2 font-mono text-sm text-slate-700"
                    />
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}
      </section>

      {/* 5 — Photos */}
      <section className="mb-10">
        <SectionTitle>Photos</SectionTitle>

        <div className="mb-4 cursor-not-allowed opacity-50">
          <p className="mb-2 text-sm font-semibold text-slate-700">Cover Photo</p>
          <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
            <Camera size={32} className="text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">Upload cover photo</p>
            <p className="mt-1 text-xs text-slate-400">(Coming soon)</p>
          </div>
        </div>

        <div className="cursor-not-allowed opacity-50">
          <p className="mb-2 text-sm font-semibold text-slate-700">Additional Photos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-200"
              >
                <Camera size={20} className="text-slate-300" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">(Coming soon)</p>
        </div>
      </section>

      {isSaved ? (
        <p className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} aria-hidden="true" />
          Profile saved
        </p>
      ) : null}

      {/* Sticky above the portal's mobile tab bar; inline from lg up. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-6 border-t border-slate-200 bg-white px-6 py-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        <Button size="lg" fullWidth className="h-12" isLoading={isLoading} onClick={handleSave}>
          Save Profile
        </Button>
      </div>
    </div>
  )
}

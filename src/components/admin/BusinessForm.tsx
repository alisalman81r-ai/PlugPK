// src/components/admin/BusinessForm.tsx
'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { AdminField, FIELD_CLASS, TEXTAREA_CLASS } from '@/components/admin/AdminField'
import { LocationPicker } from '@/components/business/LocationPicker'
import { CONNECTOR_TYPES, PAKISTAN_CITIES } from '@/lib/constants'
import type { BusinessRow } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

export interface BusinessFormProps {
  /** Undefined means create. */
  business?: BusinessRow
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

const TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'mall', label: 'Shopping Mall' },
  { value: 'office', label: 'Office' },
  { value: 'dealership', label: 'Dealership' },
  { value: 'service-center', label: 'Service Center' },
  { value: 'home', label: 'Home Charger' },
]

interface DraftCharger {
  connectorType: string
  maxPowerKw: number
  ports: number
}

export function BusinessForm({ business, action }: BusinessFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const [lat, setLat] = React.useState<number | null>(business?.lat ?? null)
  const [lng, setLng] = React.useState<number | null>(business?.lng ?? null)
  const [chargers, setChargers] = React.useState<DraftCharger[]>(business?.chargers ?? [])

  const addCharger = () =>
    setChargers((current) => [
      ...current,
      { connectorType: CONNECTOR_TYPES[0] ?? 'CCS2', maxPowerKw: 50, ports: 1 },
    ])

  const updateCharger = (index: number, patch: Partial<DraftCharger>) =>
    setChargers((current) =>
      current.map((charger, i) => (i === index ? { ...charger, ...patch } : charger)),
    )

  const removeCharger = (index: number) =>
    setChargers((current) => current.filter((_, i) => i !== index))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // The picker and the charger rows are React state rather than named
    // inputs, so they are attached here instead of relying on the DOM.
    form.set('lat', lat === null ? '' : String(lat))
    form.set('lng', lng === null ? '' : String(lng))
    form.set('chargers', JSON.stringify(chargers))
    setError(null)

    startTransition(async () => {
      const result = await action(form)
      if (result.ok) {
        router.push('/admin/businesses')
        // Without this the list renders the router's cached copy, so a save
        // looks like it did nothing.
        router.refresh()
      } else {
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      {business ? <input type="hidden" name="id" value={business.id} /> : null}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Owner</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Who submitted the listing. Used to get back to them about it.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Full name" htmlFor="ownerName" required>
            <input
              id="ownerName"
              name="ownerName"
              required
              defaultValue={business?.ownerName}
              placeholder="Ahmed Khan"
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={business?.email}
              placeholder="info@yourbusiness.pk"
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField label="Phone" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={business?.phone ?? ''}
              placeholder="0300-1234567"
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField label="Status" htmlFor="status" required>
            <select
              id="status"
              name="status"
              defaultValue={business?.status ?? 'pending'}
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved — shows on the map</option>
              <option value="rejected">Rejected</option>
            </select>
          </AdminField>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Business</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          What EV drivers see on the map once this is approved.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Business name" htmlFor="businessName" required>
            <input
              id="businessName"
              name="businessName"
              required
              defaultValue={business?.businessName}
              placeholder="Serena Hotel Islamabad"
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField label="Type" htmlFor="businessType" required>
            <select
              id="businessType"
              name="businessType"
              required
              defaultValue={business?.businessType ?? ''}
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              <option value="" disabled>
                Select a type
              </option>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="City" htmlFor="city" required>
            <select
              id="city"
              name="city"
              required
              defaultValue={business?.city ?? ''}
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              <option value="" disabled>
                Select a city
              </option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="Website" htmlFor="website">
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={business?.website ?? ''}
              placeholder="https://yourbusiness.pk"
              className={FIELD_CLASS}
            />
          </AdminField>
        </div>

        <div className="mt-5">
          <AdminField label="Address" htmlFor="address">
            <textarea
              id="address"
              name="address"
              defaultValue={business?.address ?? ''}
              placeholder="24 Mall Road, Gulberg"
              className={TEXTAREA_CLASS}
            />
          </AdminField>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Location</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          The exact pin drivers navigate to. Required before this can be approved — an
          approved business without coordinates would not appear anywhere.
        </p>

        <LocationPicker
          idPrefix="admin-biz"
          lat={lat}
          lng={lng}
          onChange={(next) => {
            setLat(next.lat)
            setLng(next.lng)
            setError(null)
          }}
        />
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mb-1 font-semibold text-slate-900">Chargers</h2>
            <p className="text-ui-sm text-slate-500">
              What is actually installed at this location.
            </p>
          </div>

          <button
            type="button"
            onClick={addCharger}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={14} className="shrink-0" aria-hidden="true" />
            Add charger
          </button>
        </div>

        {chargers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-ui-sm text-slate-500">
            No chargers listed yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {chargers.map((charger, index) => (
              <li
                key={index}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
              >
                <span className="min-w-[9rem] flex-1">
                  <span className="mb-1 block text-ui-xs font-semibold text-slate-600">
                    Connector
                  </span>
                  <select
                    value={charger.connectorType}
                    onChange={(event) =>
                      updateCharger(index, { connectorType: event.target.value })
                    }
                    aria-label={`Charger ${index + 1} connector type`}
                    className={cn(FIELD_CLASS, 'cursor-pointer')}
                  >
                    {CONNECTOR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </span>

                <span className="w-28">
                  <span className="mb-1 block text-ui-xs font-semibold text-slate-600">kW</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={charger.maxPowerKw}
                    onChange={(event) =>
                      updateCharger(index, { maxPowerKw: Number(event.target.value) || 0 })
                    }
                    aria-label={`Charger ${index + 1} max power`}
                    className={FIELD_CLASS}
                  />
                </span>

                <span className="w-24">
                  <span className="mb-1 block text-ui-xs font-semibold text-slate-600">Ports</span>
                  <input
                    type="number"
                    min={1}
                    value={charger.ports}
                    onChange={(event) =>
                      updateCharger(index, { ports: Math.max(1, Number(event.target.value) || 1) })
                    }
                    aria-label={`Charger ${index + 1} port count`}
                    className={FIELD_CLASS}
                  />
                </span>

                <button
                  type="button"
                  onClick={() => removeCharger(index)}
                  aria-label={`Remove charger ${index + 1}`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-ui-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={15} className="shrink-0 animate-spin" aria-hidden="true" />
          ) : null}
          {business ? 'Save changes' : 'Add business'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/businesses')}
          className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

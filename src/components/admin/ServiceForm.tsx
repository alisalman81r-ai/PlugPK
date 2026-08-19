// src/components/admin/ServiceForm.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { AdminField, FIELD_CLASS, TEXTAREA_CLASS } from '@/components/admin/AdminField'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { EVService } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ServiceFormProps {
  /** Undefined means create. */
  service?: EVService
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

export function ServiceForm({ service, action }: ServiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await action(form)
      if (result.ok) {
        router.push('/admin/services')
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
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Business</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Appears in the services directory and on the business&apos;s own page.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Name" htmlFor="name" required className="sm:col-span-2">
            <input id="name" name="name" required defaultValue={service?.name} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="Category" htmlFor="category" required>
            <select
              id="category"
              name="category"
              required
              defaultValue={service?.category ?? SERVICE_CATEGORY_KEYS[0]}
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              {SERVICE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SERVICE_CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField
            label="URL slug"
            htmlFor="slug"
            hint="Leave blank to generate from the name."
          >
            <input
              id="slug"
              name="slug"
              defaultValue={service?.slug}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <AdminField label="Description" htmlFor="description" className="sm:col-span-2">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={service?.description}
              className={TEXTAREA_CLASS}
            />
          </AdminField>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Location</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Coordinates place the business on the directory map.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Street" htmlFor="street" className="sm:col-span-2">
            <input id="street" name="street" defaultValue={service?.address.street} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="Area" htmlFor="area">
            <input id="area" name="area" defaultValue={service?.address.area} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="City" htmlFor="city" required>
            <select
              id="city"
              name="city"
              required
              // Deliberately unset — see the same note in StationForm.
              defaultValue={service?.address.city ?? ''}
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

          <AdminField label="Province" htmlFor="province">
            <input id="province" name="province" defaultValue={service?.address.province} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="Country" htmlFor="country">
            <input
              id="country"
              name="country"
              defaultValue={service?.address.country ?? 'Pakistan'}
              className={FIELD_CLASS}
            />
          </AdminField>

          <AdminField label="Latitude" htmlFor="lat" hint="Decimal degrees, e.g. 24.8607">
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              required
              defaultValue={service?.coordinates.lat}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <AdminField label="Longitude" htmlFor="lng" hint="Decimal degrees, e.g. 67.0011">
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              required
              defaultValue={service?.coordinates.lng}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-5 font-semibold text-slate-900">Contact and presentation</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Phone" htmlFor="phone" required>
            <input id="phone" name="phone" required defaultValue={service?.phone} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="Email" htmlFor="email">
            <input id="email" name="email" type="email" defaultValue={service?.email} className={FIELD_CLASS} />
          </AdminField>

          <AdminField label="Website" htmlFor="website" className="sm:col-span-2">
            <input id="website" name="website" type="url" defaultValue={service?.website} className={FIELD_CLASS} />
          </AdminField>

          <AdminField
            label="Cover photo path"
            htmlFor="coverPhoto"
            hint="Path under /public, e.g. /images/services/name.jpg"
            className="sm:col-span-2"
          >
            <input
              id="coverPhoto"
              name="coverPhoto"
              defaultValue={service?.coverPhoto}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <AdminField label="Rating" htmlFor="rating" hint="0 to 5">
            <input
              id="rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={service?.rating ?? 0}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 text-ui text-slate-700">
              <input
                type="checkbox"
                name="isVerified"
                defaultChecked={service?.isVerified}
                className="h-5 w-5 cursor-pointer rounded border-slate-300 text-plug-blue-600 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              />
              Verified business
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-ui-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-plug-blue-600 px-5 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
          {service ? 'Save changes' : 'Create service'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/services')}
          className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-ui font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// src/components/admin/StationForm.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { PAKISTAN_CITIES } from '@/lib/constants'
import type { Station, StationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface StationFormProps {
  /** Undefined means create. */
  station?: Station
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

const STATUSES: StationStatus[] = ['available', 'limited', 'offline', 'unknown']

const FIELD =
  'h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:shadow-focus'

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-ui-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-ui-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

export function StationForm({ station, action }: StationFormProps) {
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
        router.push('/admin/stations')
        // Refresh so the list reflects the write immediately rather than
        // showing the router's cached copy of the previous page.
        router.refresh()
      } else {
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl px-8 py-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-bold text-slate-900">Identity</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              defaultValue={station?.name}
              className={FIELD}
            />
          </Field>

          <Field
            label="URL slug"
            htmlFor="slug"
            hint="Leave blank to generate from the name and city."
            className="sm:col-span-2"
          >
            <input
              id="slug"
              name="slug"
              defaultValue={station?.slug}
              placeholder="mall-road-ev-hub-lahore"
              className={cn(FIELD, 'font-mono')}
            />
          </Field>

          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={station?.description}
              className="w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-3.5 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:shadow-focus"
            />
          </Field>

          <Field label="Network" htmlFor="network">
            <input id="network" name="network" defaultValue={station?.network} className={FIELD} />
          </Field>

          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              defaultValue={station?.status ?? 'available'}
              className={cn(FIELD, 'cursor-pointer capitalize')}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-bold text-slate-900">Location</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Street" htmlFor="street" className="sm:col-span-2">
            <input id="street" name="street" defaultValue={station?.address.street} className={FIELD} />
          </Field>

          <Field label="Area" htmlFor="area">
            <input id="area" name="area" defaultValue={station?.address.area} className={FIELD} />
          </Field>

          <Field label="City" htmlFor="city">
            <select
              id="city"
              name="city"
              required
              defaultValue={station?.address.city ?? PAKISTAN_CITIES[0]}
              className={cn(FIELD, 'cursor-pointer')}
            >
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Province" htmlFor="province">
            <input
              id="province"
              name="province"
              defaultValue={station?.address.province}
              className={FIELD}
            />
          </Field>

          <Field label="Country" htmlFor="country">
            <input
              id="country"
              name="country"
              defaultValue={station?.address.country ?? 'Pakistan'}
              className={FIELD}
            />
          </Field>

          <Field label="Latitude" htmlFor="lat" hint="Decimal degrees, e.g. 31.5497">
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              required
              defaultValue={station?.coordinates.lat}
              className={cn(FIELD, 'font-mono')}
            />
          </Field>

          <Field label="Longitude" htmlFor="lng" hint="Decimal degrees, e.g. 74.3436">
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              required
              defaultValue={station?.coordinates.lng}
              className={cn(FIELD, 'font-mono')}
            />
          </Field>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-bold text-slate-900">Contact and presentation</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" defaultValue={station?.phone} className={FIELD} />
          </Field>

          <Field label="Website" htmlFor="website">
            <input id="website" name="website" defaultValue={station?.website} className={FIELD} />
          </Field>

          <Field
            label="Cover photo path"
            htmlFor="coverPhoto"
            hint="Path under /public, e.g. /images/stations/name.jpg"
            className="sm:col-span-2"
          >
            <input
              id="coverPhoto"
              name="coverPhoto"
              defaultValue={station?.coverPhoto}
              className={cn(FIELD, 'font-mono')}
            />
          </Field>

          <Field label="Rating" htmlFor="rating" hint="0 to 5">
            <input
              id="rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={station?.rating ?? 0}
              className={cn(FIELD, 'font-mono')}
            />
          </Field>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 text-ui text-slate-700">
              <input
                type="checkbox"
                name="isVerified"
                defaultChecked={station?.isVerified}
                className="h-5 w-5 cursor-pointer rounded border-slate-300 text-plug-blue-600 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              />
              Verified station
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-ui-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : null}
          {station ? 'Save changes' : 'Create station'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/stations')}
          className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-6 text-ui font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          Cancel
        </button>
      </div>

      {/* Connectors are edited on their own, not through this form — a station
          write should never silently rewrite port counts. */}
      {station ? (
        <p className="mt-6 text-ui-sm text-slate-500">
          This station has {station.connectors.length} connector
          {station.connectors.length === 1 ? '' : 's'} and {station.reviewCount} review
          {station.reviewCount === 1 ? '' : 's'}. Deleting the station removes both.
        </p>
      ) : null}
    </form>
  )
}

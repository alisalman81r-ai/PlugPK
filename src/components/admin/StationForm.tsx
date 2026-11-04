// src/components/admin/StationForm.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { PAKISTAN_CITIES } from '@/lib/constants'
import type { Station, StationStatus, VenueType } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { FGRID, FieldSelect, Fld, FORM_ACTS, FORM_COL, FormCard, FormError, IN, Ico, TEXTAREA, btnClass } from './network-kit'
import { runAction } from './run-action'
import { useUnsavedChanges } from './useUnsavedChanges'

export interface StationFormProps {
  /** Undefined means create. */
  station?: Station
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

const STATUSES: { value: StationStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'offline', label: 'Offline' },
  { value: 'unknown', label: 'Unknown' },
]

/**
 * Where the charger sits. Labels are written out because the stored values are
 * slugs, and `service-center` in a dropdown reads like a bug.
 *
 * `other` is offered last and deliberately: choosing it is a real answer for a
 * forecourt or a roadside bay, and the alternative — forcing one of the seven
 * — would fill the column with venues nobody meant.
 */
const VENUES: { value: VenueType; label: string }[] = [
  { value: 'standalone', label: 'Standalone charging site' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'mall', label: 'Mall' },
  { value: 'office', label: 'Office' },
  { value: 'dealership', label: 'Dealership' },
  { value: 'service-center', label: 'Service centre' },
  { value: 'home', label: 'Home' },
  { value: 'other', label: 'Other / not set' },
]

export function StationForm({ station, action }: StationFormProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const { markClean, confirmLeave } = useUnsavedChanges(formRef)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await runAction(() => action(form))
      if (result.ok) {
        markClean()
        toast.success(result.message ?? 'Saved.')
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
    <form ref={formRef} onSubmit={handleSubmit} className={FORM_COL}>
      <FormCard title="Identity" sub="How the station is named and filed on the map.">
        <div className={FGRID}>
          <Fld label="Name" htmlFor="name" required full>
            <input id="name" name="name" required defaultValue={station?.name} className={IN} />
          </Fld>

          <Fld label="URL slug" htmlFor="slug" hint="Leave blank to generate from the name and city." optional full>
            <input
              id="slug"
              name="slug"
              defaultValue={station?.slug}
              placeholder="mall-road-ev-hub-lahore"
              className={cn(IN, 'font-mono text-[15px]')}
            />
          </Fld>

          <Fld label="Description" htmlFor="description" optional full>
            <textarea id="description" name="description" rows={3} defaultValue={station?.description} className={TEXTAREA} />
          </Fld>

          <Fld label="Network" htmlFor="network" optional>
            <input id="network" name="network" defaultValue={station?.network} className={IN} />
          </Fld>

          <Fld label="Venue" htmlFor="venueType">
            <FieldSelect id="venueType" name="venueType" defaultValue={station?.venueType ?? 'other'}>
              {VENUES.map((venue) => (
                <option key={venue.value} value={venue.value}>
                  {venue.label}
                </option>
              ))}
            </FieldSelect>
          </Fld>

          <Fld label="Status" htmlFor="status" hint="Whether drivers are told they can charge here.">
            <FieldSelect id="status" name="status" defaultValue={station?.status ?? 'available'}>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FieldSelect>
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Location" sub="The pin drivers navigate to, and the address under it." i={1}>
        <div className={FGRID}>
          <Fld label="Street" htmlFor="street" optional full>
            <input id="street" name="street" defaultValue={station?.address.street} className={IN} />
          </Fld>

          <Fld label="Area" htmlFor="area" optional>
            <input id="area" name="area" defaultValue={station?.address.area} className={IN} />
          </Fld>

          <Fld label="City" htmlFor="city" required>
            <FieldSelect
              id="city"
              name="city"
              required
              // No default. With 103 options, pre-selecting the alphabetically
              // first one files every hurried entry under Abbottabad; an empty
              // required option makes the browser stop and ask instead.
              defaultValue={station?.address.city ?? ''}
            >
              <option value="" disabled>
                Select a city
              </option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </FieldSelect>
          </Fld>

          <Fld label="Province" htmlFor="province" optional>
            <input id="province" name="province" defaultValue={station?.address.province} className={IN} />
          </Fld>

          <Fld label="Country" htmlFor="country" optional>
            <input id="country" name="country" defaultValue={station?.address.country ?? 'Pakistan'} className={IN} />
          </Fld>

          <Fld label="Latitude" htmlFor="lat" required hint="Decimal degrees inside Pakistan, e.g. 31.5497">
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              required
              defaultValue={station?.coordinates.lat}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          <Fld label="Longitude" htmlFor="lng" required hint="Decimal degrees, e.g. 74.3436">
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              required
              defaultValue={station?.coordinates.lng}
              className={cn(IN, 'font-mono')}
            />
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Contact and presentation" sub="What the public station page shows beside the map." i={2}>
        <div className={FGRID}>
          <Fld label="Phone" htmlFor="phone" optional>
            <input id="phone" name="phone" defaultValue={station?.phone} className={IN} />
          </Fld>

          <Fld label="Website" htmlFor="website" optional>
            <input id="website" name="website" defaultValue={station?.website} className={IN} />
          </Fld>

          <Fld label="Cover photo path" htmlFor="coverPhoto" hint="Path under /public, e.g. /images/stations/name.jpg" optional full>
            <input id="coverPhoto" name="coverPhoto" defaultValue={station?.coverPhoto} className={cn(IN, 'font-mono text-[15px]')} />
          </Fld>

          {/* No rating field. It was typed in by hand, which put a score on
              the public page that no driver had given; ratings now come from
              the reviews themselves. */}
          <label className="col-span-full flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-ink/[.09] bg-paper px-4 py-3.5 text-[15px] text-ink transition-colors hover:border-ink/30">
            <input
              type="checkbox"
              name="isVerified"
              defaultChecked={station?.isVerified}
              className="h-5 w-5 cursor-pointer rounded accent-ink"
            />
            <Ico name="shield" className="h-[18px] w-[18px] text-[#12804a]" />
            Verified station
          </label>
        </div>
      </FormCard>

      {error ? <FormError>{error}</FormError> : null}

      <div className={FORM_ACTS}>
        <button type="submit" disabled={isPending} className={btnClass('ink')}>
          {isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
          {station ? 'Save changes' : 'Create station'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmLeave()) router.push('/admin/stations')
          }}
          className={btnClass('line')}
        >
          Cancel
        </button>
      </div>

      {/* Connectors are edited on their own, not through this form — a station
          write should never silently rewrite port counts. */}
      {station ? (
        <p className="m-0 text-sm text-muted">
          This station has {station.connectors.length} connector
          {station.connectors.length === 1 ? '' : 's'} and {station.reviewCount} review
          {station.reviewCount === 1 ? '' : 's'}. Deleting the station removes both, and any member bookmarks of it.
        </p>
      ) : null}
    </form>
  )
}

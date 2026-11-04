// src/components/admin/ServiceForm.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { HoursFields } from '@/components/services/HoursFields'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import type { EVService } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { FGRID, FieldSelect, Fld, FORM_ACTS, FORM_COL, FormCard, FormError, IN, Ico, TEXTAREA, btnClass } from './network-kit'
import { runAction } from './run-action'
import { useUnsavedChanges } from './useUnsavedChanges'

export interface ServiceFormProps {
  /** Undefined means create. */
  service?: EVService
  /** The listing's review status; absent on create, which defaults to approved. */
  status?: string
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

export function ServiceForm({ service, status, action }: ServiceFormProps) {
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
    <form ref={formRef} onSubmit={handleSubmit} className={FORM_COL}>
      <FormCard title="Business" sub={<>Appears in the services directory and on the business&apos;s own page.</>}>
        <div className={FGRID}>
          <Fld label="Name" htmlFor="name" required full>
            <input id="name" name="name" required defaultValue={service?.name} className={IN} />
          </Fld>

          <Fld label="Category" htmlFor="category" required>
            <FieldSelect
              id="category"
              name="category"
              required
              defaultValue={service?.category ?? SERVICE_CATEGORY_KEYS[0]}>
              {SERVICE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SERVICE_CATEGORY_META[key].label}
                </option>
              ))}
            </FieldSelect>
          </Fld>

          <Fld
            label="URL slug"
            htmlFor="slug"
            hint="Leave blank to generate from the name."
          >
            <input
              id="slug"
              name="slug"
              defaultValue={service?.slug}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          {/*
            Status is chosen here rather than left to the schema default.
            The default is 'pending', which is right for the public application
            form and wrong for an operator: a service added here used to land
            in the review queue, invisible on the directory, as though a
            stranger had submitted it.
          */}
          <Fld
            label="Status"
            htmlFor="status"
            required
            hint="Approved services appear in the public directory."
          >
            <FieldSelect
              id="status"
              name="status"
              defaultValue={status ?? 'approved'}>
              <option value="approved">Approved — listed publicly</option>
              <option value="pending">Pending — in the review queue</option>
              <option value="rejected">Rejected — hidden</option>
            </FieldSelect>
          </Fld>

          <Fld label="Description" htmlFor="description" full>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={service?.description}
              className={TEXTAREA}
            />
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Location" sub={<>Coordinates place the business on the directory map.</>} i={1}>
        <div className={FGRID}>
          <Fld label="Street" htmlFor="street" full>
            <input id="street" name="street" defaultValue={service?.address.street} className={IN} />
          </Fld>

          <Fld label="Area" htmlFor="area">
            <input id="area" name="area" defaultValue={service?.address.area} className={IN} />
          </Fld>

          <Fld label="City" htmlFor="city" required>
            <FieldSelect
              id="city"
              name="city"
              required
              // Deliberately unset — see the same note in StationForm.
              defaultValue={service?.address.city ?? ''}>
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

          <Fld label="Province" htmlFor="province">
            <input id="province" name="province" defaultValue={service?.address.province} className={IN} />
          </Fld>

          <Fld label="Country" htmlFor="country">
            <input
              id="country"
              name="country"
              defaultValue={service?.address.country ?? 'Pakistan'}
              className={IN}
            />
          </Fld>

          <Fld label="Latitude" htmlFor="lat" hint="Decimal degrees inside Pakistan, e.g. 24.8607">
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              required
              defaultValue={service?.coordinates.lat}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          <Fld label="Longitude" htmlFor="lng" hint="Decimal degrees, e.g. 67.0011">
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              required
              defaultValue={service?.coordinates.lng}
              className={cn(IN, 'font-mono')}
            />
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Contact and presentation" i={2}>
        <div className={FGRID}>
          <Fld label="Phone" htmlFor="phone" required>
            <input id="phone" name="phone" required defaultValue={service?.phone} className={IN} />
          </Fld>

          <Fld label="Email" htmlFor="email">
            <input id="email" name="email" type="email" defaultValue={service?.email} className={IN} />
          </Fld>

          <Fld label="Website" htmlFor="website" full>
            <input id="website" name="website" type="url" defaultValue={service?.website} className={IN} />
          </Fld>

          <Fld
            label="Cover photo path"
            htmlFor="coverPhoto"
            hint="Path under /public, e.g. /images/services/name.jpg"
            full
          >
            <input
              id="coverPhoto"
              name="coverPhoto"
              defaultValue={service?.coverPhoto}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          {/* No rating field. Services have no review table, so any figure
              typed here would be a score no customer gave. */}
          <div className="col-span-full grid gap-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-ink/[.09] bg-paper px-4 py-3.5 text-[15px] text-ink transition-colors hover:border-ink/30">
              <input type="checkbox" name="isVerified" defaultChecked={service?.isVerified} className="h-5 w-5 cursor-pointer rounded accent-ink" />
              <Ico name="shield" className="h-[18px] w-[18px] text-[#12804a]" />
              Verified business
            </label>
            <p className="m-0 text-[13px] text-muted">
              Your own assertion that you have checked this business exists — shown publicly as a badge.
            </p>
          </div>
        </div>
      </FormCard>

      {/*
        What the applicant told us. Editable, because a reviewer often fixes a
        typo before approving; the contact person never appears publicly.
      */}
      <FormCard title="Applicant and details" sub={<>The contact person is for the team only. WhatsApp, social page, year, makes, prices and hours appear on the public listing once it is approved.</>} i={3}>
        <div className={FGRID}>
          <Fld label="Contact person" htmlFor="contactName">
            <input id="contactName" name="contactName" maxLength={120} defaultValue={service?.contactName} className={IN} />
          </Fld>
          <Fld label="Their role" htmlFor="contactRole" hint="Owner, manager…">
            <input id="contactRole" name="contactRole" maxLength={80} defaultValue={service?.contactRole} className={IN} />
          </Fld>
          <Fld label="WhatsApp" htmlFor="whatsapp">
            <input id="whatsapp" name="whatsapp" type="tel" maxLength={20} defaultValue={service?.whatsapp} className={IN} />
          </Fld>
          <Fld label="Year established" htmlFor="yearEstablished">
            <input
              id="yearEstablished"
              name="yearEstablished"
              type="number"
              min={1947}
              max={new Date().getFullYear()}
              defaultValue={service?.yearEstablished}
              className={IN}
            />
          </Fld>
          <Fld label="Facebook or Instagram page" htmlFor="socialUrl" full>
            <input id="socialUrl" name="socialUrl" type="url" maxLength={300} defaultValue={service?.socialUrl} className={IN} />
          </Fld>
          <Fld label="EV makes they work with" htmlFor="brands" full>
            <input id="brands" name="brands" maxLength={300} defaultValue={service?.brands} className={IN} />
          </Fld>
          <Fld label="Prices" htmlFor="pricing" full>
            <textarea id="pricing" name="pricing" rows={3} maxLength={600} defaultValue={service?.pricing} className={TEXTAREA} />
          </Fld>
          <div className="col-span-full grid gap-2">
            <p className="m-0 text-sm font-medium text-ink">Opening hours</p>
            <HoursFields initial={service?.operatingHours} />
          </div>
        </div>
      </FormCard>

      {error ? <FormError>{error}</FormError> : null}

      <div className={FORM_ACTS}>
        <button type="submit" disabled={isPending} className={btnClass('ink')}>
          {isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
          {service ? 'Save changes' : 'Create service'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmLeave()) router.push('/admin/services')
          }}
          className={btnClass('line')}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

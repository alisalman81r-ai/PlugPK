// src/components/admin/BusinessForm.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { LocationPicker } from '@/components/business/LocationPicker'
import { CONNECTOR_TYPES, PAKISTAN_CITIES } from '@/lib/constants'
import type { BusinessRow } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { FGRID, FieldSelect, Fld, FORM_ACTS, FORM_COL, FormCard, FormError, IN, Ico, PANEL, TEXTAREA, btnClass } from './network-kit'
import { runAction } from './run-action'
import { useUnsavedChanges } from './useUnsavedChanges'

export interface BusinessFormProps {
  /** Undefined means create. */
  business?: BusinessRow
  action: (form: FormData) => Promise<{ ok: boolean; message?: string }>
}

const TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'mall', label: 'Shopping mall' },
  { value: 'office', label: 'Office' },
  { value: 'dealership', label: 'Dealership' },
  { value: 'service-center', label: 'Service centre' },
  { value: 'home', label: 'Home charger' },
]

interface DraftCharger {
  connectorType: string
  maxPowerKw: number
  ports: number
}

export function BusinessForm({ business, action }: BusinessFormProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const { markClean, markDirty, confirmLeave } = useUnsavedChanges(formRef)

  const [lat, setLatState] = React.useState<number | null>(business?.lat ?? null)
  const [lng, setLngState] = React.useState<number | null>(business?.lng ?? null)
  const [chargers, setChargersState] = React.useState<DraftCharger[]>(business?.chargers ?? [])

  // The pin and the charger rows live in state, not in inputs, so the form's
  // own input events cannot see them change. Each setter marks it unsaved.
  const setLat: typeof setLatState = (value) => {
    markDirty()
    setLatState(value)
  }
  const setLng: typeof setLngState = (value) => {
    markDirty()
    setLngState(value)
  }
  const setChargers: typeof setChargersState = (value) => {
    markDirty()
    setChargersState(value)
  }

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
      const result = await runAction(() => action(form))
      if (result.ok) {
        markClean()
        toast.success(result.message ?? 'Saved.')
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
    <form ref={formRef} onSubmit={handleSubmit} className={FORM_COL}>
      {business ? <input type="hidden" name="id" value={business.id} /> : null}

      <FormCard title="Owner" sub="Who submitted the listing. Used to get back to them about it.">
        <div className={FGRID}>
          <Fld label="Full name" htmlFor="ownerName" required>
            <input id="ownerName" name="ownerName" required defaultValue={business?.ownerName} placeholder="Ahmed Khan" className={IN} />
          </Fld>

          <Fld label="Email" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={business?.email}
              placeholder="info@yourbusiness.pk"
              className={IN}
            />
          </Fld>

          <Fld label="Phone" htmlFor="phone" optional>
            <input id="phone" name="phone" type="tel" defaultValue={business?.phone ?? ''} placeholder="0300-1234567" className={IN} />
          </Fld>

          <Fld label="Status" htmlFor="status" required>
            <FieldSelect id="status" name="status" defaultValue={business?.status ?? 'pending'}>
              <option value="pending">Pending</option>
              <option value="approved">Approved — shows on the map</option>
              <option value="rejected">Rejected</option>
            </FieldSelect>
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Business" sub="What EV drivers see on the map once this is approved." i={1}>
        <div className={FGRID}>
          <Fld label="Business name" htmlFor="businessName" required>
            <input
              id="businessName"
              name="businessName"
              required
              defaultValue={business?.businessName}
              placeholder="Serena Hotel Islamabad"
              className={IN}
            />
          </Fld>

          <Fld label="Type" htmlFor="businessType" required>
            <FieldSelect id="businessType" name="businessType" required defaultValue={business?.businessType ?? ''}>
              <option value="" disabled>
                Select a type
              </option>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </FieldSelect>
          </Fld>

          <Fld label="City" htmlFor="city" required>
            <FieldSelect id="city" name="city" required defaultValue={business?.city ?? ''}>
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

          <Fld label="Website" htmlFor="website" optional>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={business?.website ?? ''}
              placeholder="https://yourbusiness.pk"
              className={IN}
            />
          </Fld>

          <Fld label="Address" htmlFor="address" optional full>
            <textarea
              id="address"
              name="address"
              defaultValue={business?.address ?? ''}
              placeholder="24 Mall Road, Gulberg"
              className={cn(TEXTAREA, 'min-h-[96px]')}
            />
          </Fld>
        </div>
      </FormCard>

      <FormCard
        title="Location"
        sub="The exact pin drivers navigate to. Required before this can be approved — an approved business without coordinates would not appear anywhere."
        i={2}
      >
        <div className="mt-[22px]" data-lenis-prevent>
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
        </div>
      </FormCard>

      <FormCard
        title="Chargers"
        sub="What is actually installed at this location."
        i={3}
        action={
          <button type="button" onClick={addCharger} className={btnClass('line', 'sm')}>
            <Ico name="plus" />
            Add charger
          </button>
        }
      >
        {chargers.length === 0 ? (
          <div className="mt-[22px] rounded-2xl border-[1.5px] border-dashed border-ink/15 bg-paper px-4 py-7 text-center text-sm text-muted">
            No chargers listed yet.
          </div>
        ) : (
          <ul className="m-0 mt-[22px] grid list-none gap-3 p-0">
            {chargers.map((charger, index) => (
              <li key={index} className={cn(PANEL, 'flex flex-wrap items-end gap-3 p-3.5')}>
                <span className="mr-1 grid h-[52px] place-items-center self-end font-display text-lg text-ink">
                  {index + 1}
                </span>
                <span className="grid min-w-[9rem] flex-1 gap-2">
                  <span className="text-[13px] font-medium text-muted">Connector</span>
                  <FieldSelect
                    value={charger.connectorType}
                    onChange={(event) => updateCharger(index, { connectorType: event.target.value })}
                    aria-label={`Charger ${index + 1} connector type`}
                  >
                    {CONNECTOR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </FieldSelect>
                </span>

                <span className="grid w-28 gap-2">
                  <span className="text-[13px] font-medium text-muted">kW</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={charger.maxPowerKw}
                    onChange={(event) => updateCharger(index, { maxPowerKw: Number(event.target.value) || 0 })}
                    aria-label={`Charger ${index + 1} max power`}
                    className={cn(IN, 'font-mono')}
                  />
                </span>

                <span className="grid w-24 gap-2">
                  <span className="text-[13px] font-medium text-muted">Ports</span>
                  <input
                    type="number"
                    min={1}
                    value={charger.ports}
                    onChange={(event) => updateCharger(index, { ports: Math.max(1, Number(event.target.value) || 1) })}
                    aria-label={`Charger ${index + 1} port count`}
                    className={cn(IN, 'font-mono')}
                  />
                </span>

                <button
                  type="button"
                  onClick={() => removeCharger(index)}
                  aria-label={`Remove charger ${index + 1}`}
                  className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] border-[1.5px] border-ink/[.09] bg-white text-muted transition-colors duration-200 hover:border-[#e2a48c] hover:bg-[rgba(255,90,31,.08)] hover:text-[#b23b0d] [&_svg]:h-[18px] [&_svg]:w-[18px]"
                >
                  <Ico name="trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </FormCard>

      {error ? <FormError>{error}</FormError> : null}

      <div className={FORM_ACTS}>
        <button type="submit" disabled={isPending} className={btnClass('ink')}>
          {isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name={business ? 'check' : 'plus'} />}
          {business ? 'Save changes' : 'Add business'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmLeave()) router.push('/admin/businesses')
          }}
          className={btnClass('line')}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

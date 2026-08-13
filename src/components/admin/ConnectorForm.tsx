// src/components/admin/ConnectorForm.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { AdminField, FIELD_CLASS } from '@/components/admin/AdminField'
import { CONNECTOR_TYPES } from '@/lib/constants'
import type { Connector } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface StationOption {
  id: string
  name: string
  city: string
}

export interface ConnectorFormProps {
  /** Undefined means create. */
  connector?: Connector
  /** Fixed on edit — moving a connector between stations is not a thing. */
  stationId?: string
  stations: StationOption[]
  action: (stationId: string, form: FormData) => Promise<{ ok: boolean; message?: string }>
}

const STATUSES = ['available', 'limited', 'offline', 'unknown'] as const

export function ConnectorForm({ connector, stationId, stations, action }: ConnectorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const [selectedStation, setSelectedStation] = React.useState(
    stationId ?? stations[0]?.id ?? '',
  )

  // Kept in state so the free-ports field can be validated against the total
  // as it is typed, rather than only on submit.
  const [ports, setPorts] = React.useState(connector?.ports ?? 1)
  const [availablePorts, setAvailablePorts] = React.useState(connector?.availablePorts ?? 0)
  const [isFree, setIsFree] = React.useState(connector?.isFree ?? false)

  const portsExceeded = availablePorts > ports

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedStation) {
      setError('Choose a station.')
      return
    }

    const form = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await action(selectedStation, form)
      if (result.ok) {
        router.push('/admin/connectors')
        router.refresh()
      } else {
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Placement</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Which station this connector physically sits at.
        </p>

        <AdminField label="Station" htmlFor="stationId" required>
          {connector ? (
            // Reassigning hardware to a different site is a physical move, not
            // an edit, so the field is shown but locked on an existing record.
            <>
              <input
                id="stationId"
                readOnly
                value={stations.find((s) => s.id === selectedStation)?.name ?? ''}
                className={cn(FIELD_CLASS, 'cursor-not-allowed bg-slate-50 text-slate-600')}
              />
              <p className="mt-1.5 text-ui-xs text-slate-500">
                To move this connector, delete it and add it at the other station.
              </p>
            </>
          ) : (
            <select
              id="stationId"
              value={selectedStation}
              onChange={(event) => setSelectedStation(event.target.value)}
              required
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} — {station.city}
                </option>
              ))}
            </select>
          )}
        </AdminField>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Hardware</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Peak power and connector type as shown on the public map.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Connector type" htmlFor="type" required>
            <select
              id="type"
              name="type"
              defaultValue={connector?.type ?? CONNECTOR_TYPES[0]}
              className={cn(FIELD_CLASS, 'cursor-pointer')}
            >
              {CONNECTOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="Peak power" htmlFor="maxPowerKw" required hint="Kilowatts, e.g. 150">
            <input
              id="maxPowerKw"
              name="maxPowerKw"
              type="number"
              min="1"
              step="any"
              required
              defaultValue={connector?.maxPowerKw ?? 50}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <AdminField label="Total ports" htmlFor="ports" required hint="Physical plugs on this unit.">
            <input
              id="ports"
              name="ports"
              type="number"
              min="1"
              required
              value={ports}
              onChange={(event) => setPorts(Math.max(1, Number(event.target.value) || 1))}
              className={cn(FIELD_CLASS, 'font-mono')}
            />
          </AdminField>

          <AdminField
            label="Ports free now"
            htmlFor="availablePorts"
            required
            hint="Can be adjusted later from the connectors list."
          >
            <input
              id="availablePorts"
              name="availablePorts"
              type="number"
              min="0"
              required
              value={availablePorts}
              onChange={(event) => setAvailablePorts(Math.max(0, Number(event.target.value) || 0))}
              aria-invalid={portsExceeded}
              aria-describedby={portsExceeded ? 'ports-error' : undefined}
              className={cn(
                FIELD_CLASS,
                'font-mono',
                portsExceeded && 'border-red-400 focus-visible:border-red-500',
              )}
            />
            {portsExceeded ? (
              <p id="ports-error" role="alert" className="mt-1.5 text-ui-xs font-medium text-red-600">
                Cannot exceed {ports} total port{ports === 1 ? '' : 's'}. It will be capped on save.
              </p>
            ) : null}
          </AdminField>

          <AdminField label="Status" htmlFor="status" required>
            <select
              id="status"
              name="status"
              defaultValue={connector?.status ?? 'available'}
              className={cn(FIELD_CLASS, 'cursor-pointer capitalize')}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
        <h2 className="mb-5 font-semibold text-slate-900">Pricing</h2>

        <label className="mb-5 flex cursor-pointer items-center gap-3 text-ui text-slate-700">
          <input
            type="checkbox"
            name="isFree"
            checked={isFree}
            onChange={(event) => setIsFree(event.target.checked)}
            className="h-5 w-5 cursor-pointer rounded border-slate-300 text-plug-blue-600 focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          />
          Free to use
        </label>

        <AdminField
          label="Price per kWh"
          htmlFor="pricePerKwh"
          hint="Rupees. Ignored while the connector is marked free."
        >
          <input
            id="pricePerKwh"
            name="pricePerKwh"
            type="number"
            min="0"
            step="0.01"
            disabled={isFree}
            defaultValue={connector?.pricePerKwh ?? 0}
            className={cn(FIELD_CLASS, 'font-mono')}
          />
        </AdminField>
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
          {connector ? 'Save changes' : 'Add connector'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/connectors')}
          className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-ui font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

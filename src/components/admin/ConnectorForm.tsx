// src/components/admin/ConnectorForm.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { CONNECTOR_TYPES } from '@/lib/constants'
import type { Connector } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { FGRID, FieldSelect, Fld, FORM_ACTS, FORM_COL, FormCard, FormError, IN, Ico, btnClass } from './network-kit'
import { runAction } from './run-action'
import { useUnsavedChanges } from './useUnsavedChanges'

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

/**
 * The states a connector can be in. This listed the station statuses
 * (limited, unknown) by mistake; a connector saved as "limited" matched no
 * filter and no alert, so it sat in the table looking healthy.
 */
const STATUSES = ['available', 'in-use', 'offline'] as const

const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  available: 'Available',
  'in-use': 'In use',
  offline: 'Offline',
}

export function ConnectorForm({ connector, stationId, stations, action }: ConnectorFormProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const { markClean, confirmLeave } = useUnsavedChanges(formRef)

  const [selectedStation, setSelectedStation] = React.useState(
    stationId ?? stations[0]?.id ?? '',
  )

  // Kept in state so the free-ports field can be validated against the total
  // as it is typed, rather than only on submit.
  const [ports, setPorts] = React.useState(connector?.ports ?? 1)
  const [availablePorts, setAvailablePorts] = React.useState(connector?.availablePorts ?? 0)

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
      const result = await runAction(() => action(selectedStation, form))
      if (result.ok) {
        markClean()
        toast.success(result.message ?? 'Saved.')
        router.push('/admin/connectors')
        router.refresh()
      } else {
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={cn(FORM_COL, 'max-w-[860px]')}>
      <FormCard title="Placement" sub="Which station this connector physically sits at.">
        <div className={FGRID}>
          <Fld
            label="Station"
            htmlFor="stationId"
            required
            full
            hint={connector ? 'To move this connector, delete it and add it at the other station.' : undefined}
          >
            {connector ? (
              // Reassigning hardware to a different site is a physical move, not
              // an edit, so the field is shown but locked on an existing record.
              <input
                id="stationId"
                readOnly
                value={stations.find((s) => s.id === selectedStation)?.name ?? ''}
                className={cn(IN, 'cursor-not-allowed bg-paper text-muted')}
              />
            ) : (
              <FieldSelect id="stationId" value={selectedStation} onChange={(event) => setSelectedStation(event.target.value)} required>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} — {station.city}
                  </option>
                ))}
              </FieldSelect>
            )}
          </Fld>
        </div>
      </FormCard>

      <FormCard title="Hardware" sub="Peak power and connector type as shown on the public map." i={1}>
        <div className={FGRID}>
          <Fld label="Connector type" htmlFor="type" required>
            <FieldSelect id="type" name="type" defaultValue={connector?.type ?? CONNECTOR_TYPES[0]}>
              {CONNECTOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </FieldSelect>
          </Fld>

          <Fld label="Peak power" htmlFor="maxPowerKw" required hint="Kilowatts, e.g. 150">
            <input
              id="maxPowerKw"
              name="maxPowerKw"
              type="number"
              min="1"
              step="any"
              required
              defaultValue={connector?.maxPowerKw ?? 50}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          <Fld label="Total ports" htmlFor="ports" required hint="Physical plugs on this unit.">
            <input
              id="ports"
              name="ports"
              type="number"
              min="1"
              required
              value={ports}
              onChange={(event) => setPorts(Math.max(1, Number(event.target.value) || 1))}
              className={cn(IN, 'font-mono')}
            />
          </Fld>

          <Fld label="Ports free now" htmlFor="availablePorts" required hint="Can be adjusted later from the connectors list.">
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
              className={cn(IN, 'font-mono')}
            />
            {portsExceeded ? (
              <p id="ports-error" role="alert" className="m-0 text-[13px] text-[#c2410c]">
                Cannot exceed {ports} total port{ports === 1 ? '' : 's'}. It will be capped on save.
              </p>
            ) : null}
          </Fld>

          <Fld label="Status" htmlFor="status" required>
            <FieldSelect id="status" name="status" defaultValue={connector?.status ?? 'available'}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </FieldSelect>
          </Fld>
        </div>
      </FormCard>

      {error ? <FormError>{error}</FormError> : null}

      <div className={FORM_ACTS}>
        <button type="submit" disabled={isPending} className={btnClass('ink')}>
          {isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name={connector ? 'check' : 'plus'} />}
          {connector ? 'Save changes' : 'Add connector'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmLeave()) router.push('/admin/connectors')
          }}
          className={btnClass('line')}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

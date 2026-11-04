// src/app/admin/(protected)/connectors/ConnectorRow.tsx
import Link from 'next/link'

import { DeleteButton } from '@/components/admin/DeleteButton'
import { ACT, CON_TAG, ConIco, Ico, Kw, SNAME, SSUB, StatusPill, T } from '@/components/admin/network-kit'
import { PortStep } from '@/components/admin/network-kit-client'
import { deleteConnector, setConnectorAvailability } from '@/lib/db/actions'
import type { Connector } from '@/lib/types'
import { cn } from '@/lib/utils'

/** One row of the connectors table; the port stepper writes straight to the database. */
export function ConnectorRow({
  connector,
  stationId,
  stationName,
  city,
}: {
  connector: Connector
  stationId: string
  stationName: string
  city: string
}) {
  return (
    <tr className={T.tr}>
      <td data-label="Station" className={cn(T.td, T.lead)}>
        <Link href={`/admin/stations/${stationId}`} className={cn(SNAME, 'transition-colors hover:text-volt-ink')}>
          {stationName}
        </Link>
        <div className={cn(SSUB, 'font-sans')}>{city}</div>
      </td>
      <td data-label="Type" className={T.td}>
        <span className={CON_TAG}>
          <ConIco type={connector.type} />
          {connector.type.replace(/\s/g, '')}
        </span>
      </td>
      <td data-label="Power" className={T.td}>
        <Kw kw={connector.maxPowerKw} />
      </td>
      <td data-label="Status" className={T.td}>
        <StatusPill status={connector.status} />
      </td>
      <td data-label="Ports free" className={cn(T.td, T.full)}>
        <PortStep
          available={connector.availablePorts}
          total={connector.ports}
          label={`${stationName} ${connector.type}`}
          action={async (next: number) => {
            'use server'
            return setConnectorAvailability(connector.id, next)
          }}
        />
      </td>
      <td data-label="Actions" className={cn(T.td, T.acts)}>
        <div className="flex items-start justify-end gap-1">
          <Link
            href={`/admin/connectors/${connector.id}`}
            aria-label={`Edit the ${connector.type} connector at ${stationName}`}
            className={ACT}
          >
            <Ico name="pen" />
          </Link>
          <DeleteButton
            label={`the ${connector.type} connector at ${stationName}`}
            action={async () => {
              'use server'
              return deleteConnector(connector.id)
            }}
          />
        </div>
      </td>
    </tr>
  )
}

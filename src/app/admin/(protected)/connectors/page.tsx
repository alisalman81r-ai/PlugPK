// src/app/admin/(protected)/connectors/page.tsx
import { Pencil, Plus } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { PortStepper } from '@/components/admin/PortStepper'
import { deleteConnector, setConnectorAvailability } from '@/lib/db/actions'
import { getConnectors } from '@/lib/db/queries'
import { formatPricePerKwh } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminConnectorsPage() {
  const rows = await getConnectors()

  const totalPorts = rows.reduce((sum, row) => sum + row.connector.ports, 0)
  const freePorts = rows.reduce((sum, row) => sum + row.connector.availablePorts, 0)

  return (
    <>
      <AdminHeader
        title="Connectors"
        description={`${freePorts} of ${totalPorts} ports free across ${rows.length} connectors.`}
        action={
          <Link
            href="/admin/connectors/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Add connector
          </Link>
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-ui font-semibold text-slate-900">No connectors yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              Add one to publish it to a station.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: a table, because comparing power and price down a
                column is the whole job. */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-ui-xs uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-5 py-3 font-semibold">Station</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Power</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Price</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Ports free</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ connector, stationId, stationName, city }) => (
                    <tr
                      key={connector.id}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/stations/${stationId}`}
                          className="font-medium text-slate-900 hover:text-plug-blue-600"
                        >
                          {stationName}
                        </Link>
                        <p className="mt-0.5 text-ui-xs text-slate-500">{city}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui-sm text-slate-700">
                        {connector.type}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui-sm tabular-nums text-slate-700">
                        {connector.maxPowerKw} kW
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui-sm tabular-nums text-slate-700">
                        {connector.isFree ? 'Free' : formatPricePerKwh(connector.pricePerKwh)}
                      </td>
                      <td className="px-5 py-3.5">
                        <AdminStatusBadge status={connector.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <PortStepper
                          available={connector.availablePorts}
                          total={connector.ports}
                          label={`${stationName} ${connector.type}`}
                          action={async (next: number) => {
                            'use server'
                            return setConnectorAvailability(connector.id, next)
                          }}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/connectors/${connector.id}`}
                            aria-label={`Edit the ${connector.type} connector at ${stationName}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            <Pencil size={15} />
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards. Seven columns squeezed into 320px is unreadable,
                and a horizontal scroll would hide the port control that is the
                reason for opening this screen at all. */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {rows.map(({ connector, stationId, stationName, city }) => (
                <li key={connector.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/stations/${stationId}`}
                        className="block truncate font-semibold text-slate-900"
                      >
                        {stationName}
                      </Link>
                      <p className="mt-0.5 text-ui-xs text-slate-500">{city}</p>
                    </div>
                    <AdminStatusBadge status={connector.status} />
                  </div>

                  <dl className="mb-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-3">
                    <div>
                      <dt className="text-ui-xs text-slate-500">Type</dt>
                      <dd className="mt-0.5 font-mono text-ui-sm text-slate-900">
                        {connector.type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ui-xs text-slate-500">Power</dt>
                      <dd className="mt-0.5 font-mono text-ui-sm tabular-nums text-slate-900">
                        {connector.maxPowerKw} kW
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ui-xs text-slate-500">Price</dt>
                      <dd className="mt-0.5 font-mono text-ui-sm tabular-nums text-slate-900">
                        {connector.isFree ? 'Free' : formatPricePerKwh(connector.pricePerKwh)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mb-3">
                    <PortStepper
                      available={connector.availablePorts}
                      total={connector.ports}
                      label={`${stationName} ${connector.type}`}
                      action={async (next: number) => {
                        'use server'
                        return setConnectorAvailability(connector.id, next)
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/connectors/${connector.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-ui-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit
                    </Link>
                    <DeleteButton
                      label={`the ${connector.type} connector at ${stationName}`}
                      action={async () => {
                        'use server'
                        return deleteConnector(connector.id)
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

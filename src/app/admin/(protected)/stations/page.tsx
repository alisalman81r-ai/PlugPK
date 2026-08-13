// src/app/admin/(protected)/stations/page.tsx
import { ExternalLink, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { StatusDot } from '@/components/ui'
import { deleteStation } from '@/lib/db/actions'
import { getStations } from '@/lib/db/queries'
import { getMaxPower, getPortAvailability } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminStationsPage() {
  const stations = await getStations()

  return (
    <>
      <AdminHeader
        title="Stations"
        description={`${stations.length} published on the live site.`}
        action={
          <Link
            href="/admin/stations/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Add station
          </Link>
        }
      />

      <div className="px-8 py-8">
        {stations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-ui font-semibold text-slate-900">No stations yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              Adding one publishes it to the map immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-5 py-3 font-semibold">Station</th>
                    <th scope="col" className="px-5 py-3 font-semibold">City</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Ports</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Peak</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => {
                    const ports = getPortAvailability(station)
                    const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

                    return (
                      <tr key={station.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{station.name}</p>
                          <p className="mt-0.5 font-mono text-ui-xs text-slate-400">
                            {station.slug}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-ui-sm text-slate-600">
                          {station.address.city}
                        </td>
                        <td className="px-5 py-4">
                          <StatusDot status={station.status} size="sm" showLabel />
                        </td>
                        <td className="px-5 py-4 font-mono text-ui-sm text-slate-600">
                          {ports.available}/{ports.total}
                        </td>
                        <td className="px-5 py-4 font-mono text-ui-sm text-slate-600">
                          {maxPower > 0 ? `${maxPower} kW` : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/station/${station.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View ${station.name} on the live site`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <Link
                              href={`/admin/stations/${station.id}`}
                              aria-label={`Edit ${station.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                            >
                              <Pencil size={15} />
                            </Link>
                            <DeleteButton
                              label={station.name}
                              action={async () => {
                                'use server'
                                return deleteStation(station.id)
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

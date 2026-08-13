// src/app/admin/(protected)/connectors/new/page.tsx
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ConnectorForm } from '@/components/admin/ConnectorForm'
import { saveConnector } from '@/lib/db/actions'
import { getStationOptions } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function NewConnectorPage() {
  const stations = await getStationOptions()

  async function create(stationId: string, form: FormData) {
    'use server'
    return saveConnector(null, stationId, form)
  }

  return (
    <>
      <AdminHeader
        title="Add connector"
        description="Appears on the station's public page and counts toward its ports."
      />

      {stations.length === 0 ? (
        // A connector cannot exist without a station, so send them to the
        // step that has to happen first rather than showing an empty picker.
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <div className="max-w-md rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-ui font-semibold text-slate-900">No stations yet</p>
            <p className="mt-1.5 text-ui-sm leading-relaxed text-slate-500">
              A connector belongs to a station, so there is nothing to attach this to.
            </p>
            <Link
              href="/admin/stations/new"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              Add a station first
            </Link>
          </div>
        </div>
      ) : (
        <ConnectorForm stations={stations} action={create} />
      )}
    </>
  )
}

// src/app/admin/(protected)/connectors/new/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ConnectorForm } from '@/components/admin/ConnectorForm'
import { AddLink, EmptyCard } from '@/components/admin/network-kit'
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
        backHref="/admin/connectors"
        description="Appears on the station's public page and counts toward its ports."
      />

      {stations.length === 0 ? (
        // A connector cannot exist without a station, so send them to the
        // step that has to happen first rather than showing an empty picker.
        <div className="max-w-[560px]">
          <EmptyCard icon="bolt" title="No stations yet." text="A connector belongs to a station, so there is nothing to attach this to.">
            <div className="mt-[18px]">
              <AddLink href="/admin/stations/new">Add a station first</AddLink>
            </div>
          </EmptyCard>
        </div>
      ) : (
        <ConnectorForm stations={stations} action={create} />
      )}
    </>
  )
}

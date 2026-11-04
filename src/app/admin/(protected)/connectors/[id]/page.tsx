// src/app/admin/(protected)/connectors/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ConnectorForm } from '@/components/admin/ConnectorForm'
import { StatusPill } from '@/components/admin/network-kit'
import { saveConnector } from '@/lib/db/actions'
import { getConnectorById, getStationOptions } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditConnectorPage({ params }: { params: { id: string } }) {
  const [detail, stations] = await Promise.all([
    getConnectorById(params.id),
    getStationOptions(),
  ])

  if (!detail) notFound()

  async function update(stationId: string, form: FormData) {
    'use server'
    return saveConnector(params.id, stationId, form)
  }

  return (
    <>
      <AdminHeader
        title={`${detail.connector.type} · ${detail.connector.maxPowerKw} kW`}
        backHref="/admin/connectors"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
            At {detail.stationName}.
            <StatusPill status={detail.connector.status} />
          </span>
        }
      />
      <ConnectorForm
        connector={detail.connector}
        stationId={detail.stationId}
        stations={stations}
        action={update}
      />
    </>
  )
}

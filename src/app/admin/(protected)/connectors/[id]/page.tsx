// src/app/admin/(protected)/connectors/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ConnectorForm } from '@/components/admin/ConnectorForm'
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
        description={`At ${detail.stationName}.`}
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

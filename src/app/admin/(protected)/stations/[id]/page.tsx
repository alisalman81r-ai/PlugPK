// src/app/admin/(protected)/stations/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { StationForm } from '@/components/admin/StationForm'
import { saveStation } from '@/lib/db/actions'
import { getStationById } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditStationPage({ params }: { params: { id: string } }) {
  const station = await getStationById(params.id)
  if (!station) notFound()

  async function update(form: FormData) {
    'use server'
    return saveStation(params.id, form)
  }

  return (
    <>
      <AdminHeader title={station.name} description="Editing a published station." />
      <StationForm station={station} action={update} />
    </>
  )
}

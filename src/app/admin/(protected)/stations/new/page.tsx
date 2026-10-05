// src/app/admin/(protected)/stations/new/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { StationForm } from '@/components/admin/StationForm'
import { saveStation } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'

export default function NewStationPage() {
  async function create(form: FormData) {
    'use server'
    return saveStation(null, form)
  }

  return (
    <>
      <AdminHeader
        title="Add station"
        backHref="/admin/stations"
        description="Appears on the map and in the route planner as soon as it is saved."
      />
      <StationForm action={create} />
    </>
  )
}

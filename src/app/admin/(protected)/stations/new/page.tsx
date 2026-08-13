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
        description="Publishes to the live map as soon as it is saved."
      />
      <StationForm action={create} />
    </>
  )
}

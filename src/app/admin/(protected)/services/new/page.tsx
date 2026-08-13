// src/app/admin/(protected)/services/new/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { saveService } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'

export default function NewServicePage() {
  async function create(form: FormData) {
    'use server'
    return saveService(null, form)
  }

  return (
    <>
      <AdminHeader
        title="Add service"
        description="Publishes to the services directory as soon as it is saved."
      />
      <ServiceForm action={create} />
    </>
  )
}

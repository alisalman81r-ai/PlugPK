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
        backHref="/admin/services"
        description="Approved services appear in the public directory as soon as they are saved."
      />
      <ServiceForm action={create} />
    </>
  )
}

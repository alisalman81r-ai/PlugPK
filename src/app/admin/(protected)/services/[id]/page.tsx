// src/app/admin/(protected)/services/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { saveService } from '@/lib/db/actions'
import { getServiceById } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const service = await getServiceById(params.id)
  if (!service) notFound()

  async function update(form: FormData) {
    'use server'
    return saveService(params.id, form)
  }

  return (
    <>
      <AdminHeader title={service.name} description="Editing a published listing." />
      <ServiceForm service={service} action={update} />
    </>
  )
}

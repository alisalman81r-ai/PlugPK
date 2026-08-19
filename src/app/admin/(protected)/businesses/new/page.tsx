// src/app/admin/(protected)/businesses/new/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessForm } from '@/components/admin/BusinessForm'
import { saveBusiness } from '@/lib/db/business-actions'

export const dynamic = 'force-dynamic'

export default function NewBusinessPage() {
  async function create(form: FormData) {
    'use server'
    return saveBusiness(form)
  }

  return (
    <>
      <AdminHeader
        title="Add business"
        description="Enter a business directly. Set it to approved with coordinates and it appears on the map straight away."
      />
      <BusinessForm action={create} />
    </>
  )
}

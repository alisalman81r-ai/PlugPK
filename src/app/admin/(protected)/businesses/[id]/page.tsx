// src/app/admin/(protected)/businesses/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessForm } from '@/components/admin/BusinessForm'
import { saveBusiness } from '@/lib/db/business-actions'
import { getBusinessById } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function EditBusinessPage({ params }: { params: { id: string } }) {
  const business = await getBusinessById(params.id)
  if (!business) notFound()

  async function update(form: FormData) {
    'use server'
    return saveBusiness(form)
  }

  return (
    <>
      <AdminHeader
        title={business.businessName}
        description={`Submitted by ${business.ownerName} · ${business.email}`}
      />
      <BusinessForm business={business} action={update} />
    </>
  )
}

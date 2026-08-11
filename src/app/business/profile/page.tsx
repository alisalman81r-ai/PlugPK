// src/app/business/profile/page.tsx
'use client'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BusinessProfileEditor } from '@/components/business/BusinessProfileEditor'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

export default function BusinessProfilePage() {
  const { business, updateProfile } = useBusinessDashboard()

  return (
    <BusinessDashboardLayout title="Business Profile" subtitle="Manage your public listing">
      <BusinessProfileEditor business={business} onSave={updateProfile} />
    </BusinessDashboardLayout>
  )
}

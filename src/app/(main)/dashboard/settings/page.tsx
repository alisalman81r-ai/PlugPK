// src/app/(main)/dashboard/settings/page.tsx
'use client'

import { AccountSettings } from '@/components/dashboard/AccountSettings'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useDashboard } from '@/hooks/useDashboard'

export default function SettingsPage() {
  const { user, updateProfile } = useDashboard()

  return (
    <DashboardLayout title="Account Settings" subtitle="Manage your profile and preferences">
      <AccountSettings user={user} onUpdateProfile={updateProfile} />
    </DashboardLayout>
  )
}

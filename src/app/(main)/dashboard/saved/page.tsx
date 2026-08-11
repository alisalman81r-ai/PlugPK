// src/app/(main)/dashboard/saved/page.tsx
'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedStations } from '@/components/dashboard/SavedStations'
import { useDashboard } from '@/hooks/useDashboard'

export default function SavedPage() {
  const { savedStations, unsaveStation } = useDashboard()

  return (
    <DashboardLayout
      title="Saved Stations"
      subtitle={`${savedStations.length} station${savedStations.length === 1 ? '' : 's'} saved`}
    >
      <SavedStations stations={savedStations} onUnsave={unsaveStation} />
    </DashboardLayout>
  )
}

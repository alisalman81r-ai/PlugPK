// src/app/(main)/dashboard/page.tsx
'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const dashboard = useDashboard()

  return (
    <DashboardLayout title="Overview" subtitle={`Welcome back, ${dashboard.user.name}`}>
      <DashboardOverview
        user={dashboard.user}
        stats={dashboard.stats}
        savedStations={dashboard.savedStations}
        userReviews={dashboard.userReviews}
        activity={dashboard.activity}
        vehicles={dashboard.vehicles}
      />
    </DashboardLayout>
  )
}

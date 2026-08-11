// src/app/(main)/dashboard/routes/page.tsx
'use client'

import { useState } from 'react'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedRoutes } from '@/components/dashboard/SavedRoutes'
import { useDashboard } from '@/hooks/useDashboard'
import type { PlannedRoute } from '@/lib/types'

export default function DashboardRoutesPage() {
  const { user } = useDashboard()
  const [routes, setRoutes] = useState<PlannedRoute[]>(user.savedRoutes)

  const handleDelete = (routeId: string) => {
    setRoutes((current) => current.filter((route) => route.id !== routeId))
  }

  return (
    <DashboardLayout
      title="Saved Routes"
      subtitle={`${routes.length} route${routes.length === 1 ? '' : 's'} saved`}
    >
      <SavedRoutes routes={routes} onDelete={handleDelete} />
    </DashboardLayout>
  )
}

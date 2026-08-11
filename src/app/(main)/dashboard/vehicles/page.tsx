// src/app/(main)/dashboard/vehicles/page.tsx
'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VehicleManager } from '@/components/dashboard/VehicleManager'
import { useDashboard } from '@/hooks/useDashboard'

export default function VehiclesPage() {
  const { vehicles, addVehicle, removeVehicle, setDefaultVehicle } = useDashboard()

  return (
    <DashboardLayout title="My Vehicles" subtitle="Manage your EV fleet">
      <VehicleManager
        vehicles={vehicles}
        onAdd={addVehicle}
        onRemove={removeVehicle}
        onSetDefault={setDefaultVehicle}
      />
    </DashboardLayout>
  )
}

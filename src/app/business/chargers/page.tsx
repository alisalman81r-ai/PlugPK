// src/app/business/chargers/page.tsx
'use client'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ChargerManager } from '@/components/business/ChargerManager'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'

export default function BusinessChargersPage() {
  const { chargers, addCharger, updateCharger, removeCharger, toggleChargerStatus } =
    useBusinessDashboard()

  return (
    <BusinessDashboardLayout
      title="Charger Management"
      subtitle="Manage your EV charging equipment"
    >
      <ChargerManager
        chargers={chargers}
        onAdd={addCharger}
        onUpdate={updateCharger}
        onRemove={removeCharger}
        onToggleStatus={toggleChargerStatus}
      />
    </BusinessDashboardLayout>
  )
}

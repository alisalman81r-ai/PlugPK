// src/app/(main)/dashboard/vehicles/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VehicleManager, type VehicleCatalogueCar } from '@/components/dashboard/VehicleManager'
import { prisma } from '@/lib/db/client'
import { getGarage } from '@/lib/db/garage'
import { getDashboardShell } from '@/lib/db/queries'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Gated on the server. This page used to render for anyone who opened it,
 * showing MOCK_USER — a fixture person's name, saved stations and reviews —
 * which is why a real account never saw its own data here.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Vehicles' }

/**
 * The garage catalogue plus what the car card shows: the photo, battery,
 * power and price. A read only — the same table getGarageCatalogue reads,
 * with five more columns.
 */
async function getVehicleCatalogue(): Promise<VehicleCatalogueCar[]> {
  const rows = await prisma.car.findMany({
    select: {
      id: true,
      slug: true,
      brand: true,
      model: true,
      fullName: true,
      category: true,
      range: true,
      connectors: true,
      image: true,
      batteryCapacity: true,
      motorPowerKw: true,
      power: true,
      priceDisplay: true,
    },
  })
  return rows.map(({ connectors, batteryCapacity, motorPowerKw, power, ...car }) => ({
    ...car,
    connector: connectors ? connectors.split(',').map((c) => c.trim()).filter(Boolean) : null,
    batteryKwh: batteryCapacity,
    powerKw: motorPowerKw,
    powerHp: power,
  }))
}

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/dashboard/vehicles')

  // Everything at once: one round trip's wait, not three in a row.
  const catalogue = getVehicleCatalogue()
  const [shellData, cars, garage] = await Promise.all([
    getDashboardShell(profile),
    catalogue,
    getGarage(profile.id, profile.vehicle, catalogue),
  ])

  return (
    <DashboardLayout title="My vehicles." subtitle="What you drive" user={shellData.user} stats={shellData.stats}>
      <VehicleManager garage={garage} cars={cars} />
    </DashboardLayout>
  )
}

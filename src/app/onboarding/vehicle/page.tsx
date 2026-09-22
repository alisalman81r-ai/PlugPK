// src/app/onboarding/vehicle/page.tsx
import { OnboardingVehicleClient } from '@/components/auth/OnboardingVehicleClient'
import { listCars } from '@/lib/db/car-queries'

export const dynamic = 'force-dynamic'

export default async function OnboardingVehiclePage() {
  return <OnboardingVehicleClient cars={await listCars()} />
}

// src/app/onboarding/vehicle/page.tsx
import { redirect } from 'next/navigation'

import { OnboardingVehicleClient } from '@/components/auth/OnboardingVehicleClient'
import { getGarageCatalogue } from '@/lib/db/garage'
import { getSessionUserId } from '@/lib/db/session'

export const dynamic = 'force-dynamic'

/**
 * The car picker shown straight after sign-up.
 *
 * Signed-out visitors are sent to sign in first. The page used to render for
 * anyone, and the save then failed on the server with nothing on screen to say
 * so — the spinner stopped and the dashboard bounced them to login anyway.
 *
 * Reads the garage's slim catalogue (id, names, category, range, connectors)
 * rather than every column of every car: the picker shows a name and a line
 * of detail, and the full spec sheet was most of the page's payload.
 */
export default async function OnboardingVehiclePage() {
  if (!(await getSessionUserId())) redirect('/login?redirect=/onboarding/vehicle')

  const cars = await getGarageCatalogue()
  cars.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))

  return <OnboardingVehicleClient cars={cars} />
}

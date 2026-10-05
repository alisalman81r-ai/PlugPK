// src/app/onboarding/error.tsx
'use client'

import { RouteError } from '@/components/shared/RouteError'

/*
  The car picker reads the catalogue on the server. If that fails, the account
  already exists, so the way out is the dashboard — adding a car can be done
  later from My Vehicles.
*/
export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      area="Onboarding"
      title="The car list did not load"
      body="Your account is created and ready. Try again, or skip this and add your car later from My Vehicles."
      exit={{ href: '/dashboard', label: 'Go to your dashboard' }}
    />
  )
}

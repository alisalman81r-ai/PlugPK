// src/app/(main)/dashboard/error.tsx
'use client'

import { RouteError } from '@/components/shared/RouteError'

/*
  Every dashboard page reads the account and several of its tables on the
  server. When one of those reads fails, this keeps the visitor inside the
  site chrome with a retry, rather than the generic public-page message that
  talks about "this page" without saying it was their account.
*/
export default function DashboardError({
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
      area="Dashboard"
      title="Your account did not load"
      body="Nothing has been lost — your saved stations, routes and cars are still on your account. Trying again usually clears it."
      exit={{ href: '/', label: 'Back to the home page' }}
    />
  )
}

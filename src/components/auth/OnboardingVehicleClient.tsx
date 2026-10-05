'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { VehicleOnboarding } from '@/components/auth/VehicleOnboarding'
import { Button } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'
import { setPrimaryCatalogueCar } from '@/lib/db/garage-actions'
import type { GarageCatalogueCar } from '@/lib/db/garage'

interface OnboardingVehicleClientProps {
  cars: GarageCatalogueCar[]
}

/**
 * The header no longer says "Step 1 of 1" over a full progress bar. A
 * one-step flow has no progress to show, and a bar that starts full reads as
 * "you are done" on the screen that is asking you to do something.
 */
export function OnboardingVehicleClient({ cars }: OnboardingVehicleClientProps) {
  const router = useRouter()

  /*
    Returns an error message for the picker to show, or navigates away.

    It used to await the save and push to /dashboard whatever came back, so a
    refused save ({ ok: false }) or a thrown one (a dropped connection) looked
    exactly like success — the car simply was not there on the dashboard.
  */
  const handleComplete = async (car: GarageCatalogueCar | null): Promise<string | null> => {
    if (car) {
      try {
        // Into the garage, as the primary car — not only the account's string.
        const result = await setPrimaryCatalogueCar(car.id)
        if (!result.ok) return result.message ?? 'Your car could not be saved. Please try again.'
      } catch {
        return 'We could not reach the server, so your car was not saved. Check your connection and try again.'
      }
    }
    router.push('/dashboard')
    router.refresh()
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
          <Logo tone="light" size="text-xl" />
        </Link>

        <Button variant="ghost" size="md" href="/dashboard">
          Skip for now &rarr;
        </Button>
      </header>

      <div className="mx-auto w-full max-w-[600px] px-4 py-10 sm:py-16">
        <VehicleOnboarding cars={cars} onComplete={handleComplete} onSkip={() => router.push('/dashboard')} />
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { VehicleOnboarding } from '@/components/auth/VehicleOnboarding'
import { SHELL_BAR_LINK, StandaloneShell } from '@/components/auth/StandaloneShell'
import { ArrowRight } from '@/components/ui/icons'
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
    <StandaloneShell
      width="max-w-[680px]"
      aside={
        <Link href="/dashboard" className={SHELL_BAR_LINK}>
          Skip for now
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <div className="rounded-[22px] border border-ink/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,12,14,.05),0_40px_80px_-40px_rgba(11,12,14,.35)] sm:rounded-[28px] sm:p-[clamp(28px,4vw,44px)]">
        <VehicleOnboarding cars={cars} onComplete={handleComplete} onSkip={() => router.push('/dashboard')} />
      </div>
    </StandaloneShell>
  )
}

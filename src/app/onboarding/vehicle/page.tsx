// src/app/onboarding/vehicle/page.tsx
'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { VehicleOnboarding } from '@/components/auth/VehicleOnboarding'
import { saveMyVehicle } from '@/lib/db/session-actions'
import type { EVModel } from '@/lib/types'

export default function OnboardingVehiclePage() {
  const router = useRouter()

  // Accounts exist now, so the chosen vehicle is saved against the one that
  // just signed up rather than discarded. Stored as "Make Model" — the User
  // row holds a single vehicle string, not a garage.
  const handleComplete = async (vehicle: EVModel | null) => {
    if (vehicle) await saveMyVehicle(`${vehicle.make} ${vehicle.model}`)
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-8 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
          aria-label="Plug.pk home"
        >
          <Zap
            size={22}
            className="shrink-0 fill-plug-blue-600 text-plug-blue-600"
            aria-hidden="true"
          />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-slate-900">plug</span>
            <span className="text-plug-blue-600">.pk</span>
          </span>
        </Link>

        <div className="hidden text-center sm:block">
          <p className="text-sm text-slate-500">Step 1 of 1</p>
          <span
            aria-hidden="true"
            className="mt-1.5 block h-1.5 w-[200px] overflow-hidden rounded-full bg-slate-200"
          >
            <span className="block h-full w-full rounded-full bg-gradient-brand" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          Skip for now &rarr;
        </button>
      </header>

      <div className="mx-auto w-full max-w-[600px] px-4 py-16">
        <VehicleOnboarding
          onComplete={handleComplete}
          onSkip={() => router.push('/dashboard')}
        />
      </div>
    </div>
  )
}

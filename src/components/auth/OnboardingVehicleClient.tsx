'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { Car } from '@/data/cars'
import { VehicleOnboarding } from '@/components/auth/VehicleOnboarding'
import { saveMyVehicle } from '@/lib/db/session-actions'
import { Logo } from '@/components/ui/Logo'

interface OnboardingVehicleClientProps {
  cars: Car[]
}

export function OnboardingVehicleClient({ cars }: OnboardingVehicleClientProps) {
  const router = useRouter()

  const handleComplete = async (car: Car | null) => {
    if (car) await saveMyVehicle(`${car.brand} ${car.model}`)
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-8 py-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
          <Logo tone="light" size="text-xl" />
        </Link>

        <div className="hidden text-center sm:block">
          <p className="text-sm text-slate-500">Step 1 of 1</p>
          <span aria-hidden="true" className="mt-1.5 block h-1.5 w-[200px] overflow-hidden rounded-full bg-slate-200">
            <span className="block h-full w-full rounded-full bg-gradient-accent" />
          </span>
        </div>

        <button type="button" onClick={() => router.push('/dashboard')} className="text-sm text-slate-400 transition-colors hover:text-slate-600">
          Skip for now &rarr;
        </button>
      </header>

      <div className="mx-auto w-full max-w-[600px] px-4 py-16">
        <VehicleOnboarding cars={cars} onComplete={handleComplete} onSkip={() => router.push('/dashboard')} />
      </div>
    </div>
  )
}
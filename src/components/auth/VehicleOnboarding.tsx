// src/components/auth/VehicleOnboarding.tsx
'use client'

import { AlertCircle, ArrowRight, Car as CarIcon, Check, ChevronLeft } from '@/components/ui/icons'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { GarageCatalogueCar } from '@/lib/db/garage'
import { cn } from '@/lib/utils'

type OnboardingCar = GarageCatalogueCar

export interface VehicleOnboardingProps {
  cars: OnboardingCar[]
  /** Resolves to an error message to show, or null once it has moved on. */
  onComplete: (vehicle: OnboardingCar | null) => Promise<string | null>
  onSkip: () => void
}

/** The catalogue grouped by brand, in the order the cars arrive. */
function groupByMake(cars: OnboardingCar[]): { make: string; cars: OnboardingCar[] }[] {
  const byMake = new Map<string, OnboardingCar[]>()
  for (const car of cars) {
    const existing = byMake.get(car.brand)
    if (existing) existing.push(car)
    else byMake.set(car.brand, [car])
  }
  return Array.from(byMake.entries()).map(([make, items]) => ({ make, cars: items }))
}

export function VehicleOnboarding({ cars, onComplete, onSkip }: VehicleOnboardingProps) {
  const makes = groupByMake(cars)
  const [selectedMake, setSelectedMake] = React.useState<string | null>(null)
  const [selectedCar, setSelectedCar] = React.useState<OnboardingCar | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)
    // onComplete writes the car to the account before navigating, and hands
    // back a message when it could not — which stops the spinner here and is
    // shown under the button rather than lost.
    const message = await onComplete(selectedCar)
    if (message) {
      setError(message)
      setIsLoading(false)
    }
  }

  /* ── Step 2 — model ──────────────────────────────────────── */
  if (selectedMake) {
    const models = makes.find((group) => group.make === selectedMake)?.cars ?? []

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedMake(null)
            setSelectedCar(null)
            setError(null)
          }}
          className="group/back mb-6 flex min-h-11 items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft
            size={16}
            className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
            aria-hidden="true"
          />
          {selectedMake}
        </button>

        <h2 className="mb-8 text-2xl font-black text-slate-900">Which {selectedMake} model?</h2>

        <div className="flex flex-col gap-3">
          {models.map((model) => {
            const isSelected = selectedCar?.id === model.id

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedCar(model)}
                aria-pressed={isSelected}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-xl border-[1.5px] bg-white px-5 py-4 text-left transition-all duration-150',
                  isSelected
                    ? 'border-plug-blue-500 bg-plug-blue-50'
                    : 'border-slate-200 hover:border-plug-blue-300 hover:bg-plug-blue-50/50',
                )}
              >
                <span className="min-w-0">
                  <span className="block font-bold text-slate-900">{model.model}</span>
                  {/* The range column is the full-charge EV range; for a hybrid it
                      would be a combined figure, so it is only quoted for an EV. */}
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {model.category}
                    {model.category === 'EV' && model.range ? ` · ${model.range} km range` : ''}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {model.connector?.[0] ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-ui-xs font-semibold text-slate-600">
                      {model.connector[0]}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <Check size={20} className="text-plug-blue-600" aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        {selectedCar ? (
          <Button
            size="lg"
            fullWidth
            onClick={handleConfirm}
            isLoading={isLoading}
            rightIcon={<ArrowRight size={18} aria-hidden="true" />}
            className="mt-6"
          >
            This is my EV
          </Button>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  /* ── Step 1 — make ───────────────────────────────────────── */
  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-slate-900">What EV do you drive?</h2>
      <p className="mb-8 text-slate-500">
        Choose from {cars.length} cars in our catalogue. This helps us show compatible chargers.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {makes.map((group) => (
          <button
            key={group.make}
            type="button"
            onClick={() => setSelectedMake(group.make)}
            className="rounded-2xl border-[1.5px] border-slate-200 bg-white p-4 text-center transition-all duration-150 hover:border-plug-blue-300 hover:bg-plug-blue-50/50"
          >
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <CarIcon size={24} className="text-slate-400" aria-hidden="true" />
            </span>
            <span className="block text-sm font-bold text-slate-900">{group.make}</span>
            <span className="block text-ui-xs text-slate-500">
              {group.cars.length} model{group.cars.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 min-h-11 w-full text-center text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        I&apos;ll add my vehicle later &rarr;
      </button>
    </div>
  )
}

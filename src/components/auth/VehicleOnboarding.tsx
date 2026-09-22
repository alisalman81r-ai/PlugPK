// src/components/auth/VehicleOnboarding.tsx
'use client'

import { ArrowRight, Car as CarIcon, Check, ChevronLeft } from 'lucide-react'
import * as React from 'react'

import type { Car } from '@/data/cars'
import { cn } from '@/lib/utils'

export interface VehicleOnboardingProps {
  cars: Car[]
  onComplete: (vehicle: Car | null) => void | Promise<void>
  onSkip: () => void
}

/**
 * Makes are derived from MOCK_EV_MODELS rather than EV_MAKES so the model list
 * in step 2 is a fully typed EVModel — EV_MAKES stores `connector` as a plain
 * string and carries no battery or charging-speed data.
 */
function groupByMake(cars: Car[]): { make: string; cars: Car[] }[] {
  const byMake = new Map<string, Car[]>()
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
  const [selectedCar, setSelectedCar] = React.useState<Car | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    // The timer that used to sit here stood in for a save that never happened.
    // onComplete now writes the vehicle to the account before navigating.
    await onComplete(selectedCar)
    setIsLoading(false)
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
          }}
          className="group/back mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
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
                  <span className="mt-0.5 block text-sm text-slate-400">
                    {model.category} · {model.range ? `${model.range} km range` : 'Range not listed'}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {model.connector?.[0] ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
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
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-70"
          >
            {isLoading ? (
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : (
              <>
                This is my EV
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
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
            <span className="block text-xs text-slate-400">
              {group.cars.length} model{group.cars.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600"
      >
        I&apos;ll add my vehicle later &rarr;
      </button>
    </div>
  )
}

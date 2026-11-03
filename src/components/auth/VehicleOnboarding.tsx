// src/components/auth/VehicleOnboarding.tsx
'use client'

import { AlertCircle, Car as CarIcon, Check, ChevronLeft } from '@/components/ui/icons'
import * as React from 'react'

import { ActionButton, ArrowEnd, Notice } from './form-ui'
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
          className="group/back -ml-2 mb-5 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <ChevronLeft
            size={16}
            className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
            aria-hidden="true"
          />
          {selectedMake}
        </button>

        <p className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">Your car</p>
        <h1 className="mb-8 font-display text-[clamp(32px,4vw,44px)] leading-none text-ink">Which {selectedMake} model?</h1>

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
                  'flex min-h-[64px] items-center justify-between gap-4 rounded-[18px] border-[1.5px] px-5 py-4 text-left transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:shadow-focus',
                  isSelected
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/10 bg-white text-ink hover:border-ink/30',
                )}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{model.model}</span>
                  {/* The range column is the full-charge EV range; for a hybrid it
                      would be a combined figure, so it is only quoted for an EV. */}
                  <span className={cn('mt-0.5 block font-mono text-xs', isSelected ? 'text-fog' : 'text-muted')}>
                    {model.category}
                    {model.category === 'EV' && model.range ? ` · ${model.range} km range` : ''}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {model.connector?.[0] ? (
                    <span className={cn('rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold', isSelected ? 'bg-volt text-ink' : 'bg-chalk text-muted')}>
                      {model.connector[0]}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <Check size={20} className="text-volt" aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        {selectedCar ? (
          <ActionButton size="lg" fullWidth onClick={handleConfirm} isLoading={isLoading} className="mt-6">
            This is my EV
            {isLoading ? null : <ArrowEnd />}
          </ActionButton>
        ) : null}
        {error ? (
          <Notice tone="error" className="mt-4 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </Notice>
        ) : null}
      </div>
    )
  }

  /* ── Step 1 — make ───────────────────────────────────────── */
  return (
    <div>
      <p className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">One last step</p>
      <h1 className="font-display text-[clamp(34px,4vw,48px)] leading-none text-ink">What EV do you drive?</h1>
      <p className="mb-8 mt-3 text-base leading-relaxed text-muted">
        Choose from {cars.length} cars in our catalogue. This helps us show compatible chargers.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {makes.map((group) => (
          <button
            key={group.make}
            type="button"
            onClick={() => setSelectedMake(group.make)}
            className="group/make rounded-[22px] border-[1.5px] border-ink/10 bg-white p-4 text-center transition-[border-color,translate,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-e1 focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-chalk transition-colors group-hover/make:bg-ink">
              <CarIcon size={24} className="text-ink transition-colors group-hover/make:text-volt" aria-hidden="true" />
            </span>
            <span className="block text-sm font-semibold text-ink">{group.make}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted">
              {group.cars.length} model{group.cars.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 min-h-11 w-full rounded-full text-center text-sm font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
      >
        I&apos;ll add my vehicle later &rarr;
      </button>
    </div>
  )
}

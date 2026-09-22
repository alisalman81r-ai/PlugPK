// src/components/dashboard/VehicleManager.tsx
'use client'

import { Car, Check, ChevronDown, Loader2, Zap } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { Car as CatalogueCar } from '@/data/cars'
import { saveMyVehicle } from '@/lib/db/session-actions'

/**
 * The vehicle on the signed-in account.
 *
 * This managed a list of up to three vehicles with default-selection, licence
 * plates and colours, held in React state seeded from a fixture — none of it
 * stored, and the same imaginary BYD Atto 3 shown to everybody.
 *
 * An account holds one vehicle, as a string, so that is what this edits. A
 * proper garage needs a table of its own; offering the fuller interface while
 * nothing persists is what made the old page misleading.
 *
 * The model list is a catalogue of what exists on the market, not user data,
 * which is why it can stay a fixture.
 */

export interface VehicleManagerProps {
  vehicle: string | null
  cars: CatalogueCar[]
}

export function VehicleManager({ vehicle, cars }: VehicleManagerProps) {
  const [value, setValue] = React.useState(vehicle ?? '')
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(vehicle ?? '')
  const [expandedBrands, setExpandedBrands] = React.useState<Set<string>>(new Set())

  const carsByBrand = React.useMemo(() => {
    const groups = new Map<string, CatalogueCar[]>()
    for (const car of cars) {
      const group = groups.get(car.brand)
      if (group) group.push(car)
      else groups.set(car.brand, [car])
    }
    return Array.from(groups.entries()).sort(([first], [second]) => first.localeCompare(second))
  }, [cars])

  const handleSave = async (next: string) => {
    setIsSaving(true)
    setError(null)

    const result = await saveMyVehicle(next)
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message ?? 'Could not save your vehicle.')
      return
    }

    setSaved(next)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Your vehicle</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Used to suggest chargers that fit your connector.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50"
          >
            <Car size={22} className="text-plug-blue-600" />
          </span>
          <p className="text-ui-lg font-semibold text-slate-900">
            {saved || <span className="font-normal text-slate-400">None saved yet</span>}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Change it</h2>

        <label htmlFor="vehicle-input" className="mb-2 block text-sm font-semibold text-slate-700">
          Make and model
        </label>
        <input
          id="vehicle-input"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. BYD Atto 3"
          className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500"
        />

        <p className="mb-2 mt-5 text-ui-xs font-semibold uppercase tracking-wide text-slate-400">
          Or pick from the catalogue ({cars.length} cars)
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {carsByBrand.map(([brand, brandCars]) => {
            const isExpanded = expandedBrands.has(brand)

            return (
              <div key={brand} className="border-b border-slate-200 last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setExpandedBrands((current) => {
                      const next = new Set(current)
                      if (next.has(brand)) next.delete(brand)
                      else next.add(brand)
                      return next
                    })
                  }}
                  className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-plug-blue-50"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{brand}</span>
                    <span className="text-ui-xs text-slate-400">
                      {brandCars.length} model{brandCars.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isExpanded ? (
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-3">
                    {brandCars.map((car) => {
                      const label = `${car.brand} ${car.model}`
                      return (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => setValue(label)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-ui-sm text-slate-700 transition-colors hover:border-plug-blue-300 hover:bg-plug-blue-50"
                        >
                          <Zap size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                          {car.model}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => handleSave(value)} disabled={isSaving || value === saved}>
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Saving
              </>
            ) : (
              'Save vehicle'
            )}
          </Button>

          {saved ? (
            <Button
              variant="ghost"
              onClick={() => {
                setValue('')
                void handleSave('')
              }}
              disabled={isSaving}
            >
              Remove
            </Button>
          ) : null}

          {isSaved ? (
            <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
              <Check size={16} aria-hidden="true" />
              Saved
            </span>
          ) : null}
        </div>
      </section>
    </div>
  )
}

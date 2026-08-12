// src/components/business/ChargerForm.tsx
'use client'

import { Minus, Plus } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { CONNECTOR_TYPES, EV_MAKES } from '@/lib/constants'
import type { Connector, ConnectorType } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ChargerFormProps {
  initialData?: Partial<Connector>
  onSubmit: (data: Omit<Connector, 'id'>) => void
  onCancel: () => void
  isLoading?: boolean
}

const POWER_PRESETS = [7, 22, 50, 150, 350]

const ALL_VEHICLES = EV_MAKES.flatMap((make) =>
  make.models.map((model) => `${make.make} ${model.model}`),
)

const FIELD =
  'h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-plug-blue-500 focus:shadow-focus'

export function ChargerForm({ initialData, onSubmit, onCancel, isLoading }: ChargerFormProps) {
  const [type, setType] = React.useState<ConnectorType>(initialData?.type ?? 'CCS2')
  const [maxPowerKw, setMaxPowerKw] = React.useState(initialData?.maxPowerKw ?? 50)
  const [ports, setPorts] = React.useState(initialData?.ports ?? 1)
  const [isFree, setIsFree] = React.useState(initialData?.isFree ?? false)
  const [pricePerKwh, setPricePerKwh] = React.useState(initialData?.pricePerKwh ?? 70)
  const [pricePerHour, setPricePerHour] = React.useState(initialData?.pricePerHour ?? 0)
  const [vehicles, setVehicles] = React.useState<string[]>(
    initialData?.compatibleVehicles ?? [],
  )
  const [allVehicles, setAllVehicles] = React.useState(
    (initialData?.compatibleVehicles ?? []).length === 0,
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    onSubmit({
      type,
      maxPowerKw,
      ports,
      availablePorts: ports,
      pricePerKwh: isFree ? 0 : pricePerKwh,
      pricePerHour: isFree || pricePerHour === 0 ? undefined : pricePerHour,
      isFree,
      status: 'available',
      compatibleVehicles: allVehicles ? ALL_VEHICLES : vehicles,
    })
  }

  const toggleVehicle = (vehicle: string) => {
    setVehicles((current) =>
      current.includes(vehicle)
        ? current.filter((item) => item !== vehicle)
        : [...current, vehicle],
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold text-slate-700">Connector Type *</legend>
        <div className="flex flex-wrap gap-2">
          {CONNECTOR_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              aria-pressed={type === option}
              className={cn(
                'h-9 rounded-full border-[1.5px] px-4 text-sm font-medium transition-all duration-150',
                type === option
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-6">
        <label htmlFor="charger-power" className="mb-2 block text-sm font-semibold text-slate-700">
          Maximum Power *
        </label>
        <div className="flex items-center gap-2">
          <input
            id="charger-power"
            type="number"
            min={1}
            max={400}
            value={maxPowerKw}
            onChange={(event) => setMaxPowerKw(Number(event.target.value))}
            className={cn(FIELD, 'max-w-[140px]')}
          />
          <span className="text-sm text-slate-500">kW</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {POWER_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMaxPowerKw(preset)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="charger-ports" className="mb-2 block text-sm font-semibold text-slate-700">
          Number of Ports *
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPorts((value) => Math.max(1, value - 1))}
            aria-label="Decrease ports"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <Minus size={16} />
          </button>
          <input
            id="charger-ports"
            type="number"
            min={1}
            max={20}
            value={ports}
            onChange={(event) => setPorts(Number(event.target.value))}
            className={cn(FIELD, 'max-w-[80px] text-center')}
          />
          <button
            type="button"
            onClick={() => setPorts((value) => Math.min(20, value + 1))}
            aria-label="Increase ports"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Pricing</span>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setIsFree(true)}
            aria-pressed={isFree}
            className={cn(
              'h-9 flex-1 rounded-xl border-[1.5px] text-sm font-medium transition-all',
              isFree ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            Free to use
          </button>
          <button
            type="button"
            onClick={() => setIsFree(false)}
            aria-pressed={!isFree}
            className={cn(
              'h-9 flex-1 rounded-xl border-[1.5px] text-sm font-medium transition-all',
              !isFree ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            Paid
          </button>
        </div>

        {!isFree ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="price-kwh" className="mb-1.5 block text-xs text-slate-500">
                Price per kWh (PKR)
              </label>
              <input
                id="price-kwh"
                type="number"
                min={0}
                value={pricePerKwh}
                onChange={(event) => setPricePerKwh(Number(event.target.value))}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="price-hour" className="mb-1.5 block text-xs text-slate-500">
                Price per hour (PKR, optional)
              </label>
              <input
                id="price-hour"
                type="number"
                min={0}
                value={pricePerHour}
                onChange={(event) => setPricePerHour(Number(event.target.value))}
                className={FIELD}
              />
            </div>
          </div>
        ) : null}
      </div>

      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold text-slate-700">Compatible Vehicles</legend>

        <label className="mb-3 flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={allVehicles}
            onChange={(event) => setAllVehicles(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          <span className="text-sm text-slate-700">All EVs</span>
        </label>

        {!allVehicles ? (
          <div className="scrollbar-hide grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
            {ALL_VEHICLES.map((vehicle) => (
              <label key={vehicle} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vehicles.includes(vehicle)}
                  onChange={() => toggleVehicle(vehicle)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="truncate text-xs text-slate-600">{vehicle}</span>
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>

      <div className="mb-6">
        <label htmlFor="charger-notes" className="mb-2 block text-sm font-semibold text-slate-700">
          Notes (optional)
        </label>
        <textarea
          id="charger-notes"
          placeholder="Additional notes for users"
          className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all focus:border-plug-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Save Charger
        </Button>
      </div>
    </form>
  )
}

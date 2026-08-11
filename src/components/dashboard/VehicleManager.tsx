// src/components/dashboard/VehicleManager.tsx
'use client'

import { Car, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'

import { VehicleOnboarding } from '@/components/auth/VehicleOnboarding'
import { Button, ConnectorBadge } from '@/components/ui'
import type { EVModel, UserVehicle } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface VehicleManagerProps {
  vehicles: UserVehicle[]
  onAdd: (model: EVModel) => void
  onRemove: (vehicleId: string) => void
  onSetDefault: (vehicleId: string) => void
}

const MAX_VEHICLES = 3

export function VehicleManager({ vehicles, onAdd, onRemove, onSetDefault }: VehicleManagerProps) {
  const [isAddingVehicle, setIsAddingVehicle] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)

  if (isAddingVehicle) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <VehicleOnboarding
          onComplete={(model) => {
            if (model) onAdd(model)
            setIsAddingVehicle(false)
          }}
          onSkip={() => setIsAddingVehicle(false)}
        />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        {vehicles.map((vehicle) => {
          const model = vehicle.evModel

          return (
            <div
              key={vehicle.id}
              className={cn(
                'relative overflow-hidden rounded-2xl border-[1.5px] bg-white p-6 transition-all duration-200',
                vehicle.isDefault ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200',
              )}
            >
              {vehicle.isDefault ? (
                <span className="absolute right-4 top-4 rounded-full bg-plug-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Default
                </span>
              ) : null}

              <div className="mb-5 flex items-center gap-4 pr-16">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand">
                  <Car size={28} className="text-white" aria-hidden="true" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold text-slate-900">
                    {model.make} {model.model}
                  </span>
                  {vehicle.customName ? (
                    <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <Pencil size={12} className="shrink-0" aria-hidden="true" />
                      {vehicle.customName}
                    </span>
                  ) : null}
                  <span className="block text-sm text-slate-400">{model.year}</span>
                </span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-slate-900">{model.rangeKm}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Range</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-slate-900">
                    {model.batteryCapacityKwh}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Battery</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-slate-900">
                    {model.chargingSpeedKw}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                    Max Charge
                  </p>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {model.connectorTypes.map((type) => (
                  <ConnectorBadge key={type} type={type} size="sm" />
                ))}
              </div>

              <div className="flex gap-3">
                {!vehicle.isDefault ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 flex-1"
                    onClick={() => onSetDefault(vehicle.id)}
                  >
                    Set as Default
                  </Button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setConfirmDelete(vehicle.id)}
                  aria-label={`Remove ${model.make} ${model.model}`}
                  className={cn(
                    'flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100',
                    vehicle.isDefault && 'flex-1',
                  )}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          )
        })}

        {vehicles.length < MAX_VEHICLES ? (
          <button
            type="button"
            onClick={() => setIsAddingVehicle(true)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-10 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
          >
            <Plus size={48} className="text-slate-300" aria-hidden="true" />
            <span className="mt-4 font-medium text-slate-500">Add Another Vehicle</span>
            <span className="mt-1 text-sm text-slate-400">Track multiple EVs</span>
          </button>
        ) : null}
      </div>

      {vehicles.length === 0 && !isAddingVehicle ? (
        <p className="text-center text-sm text-slate-400">
          No vehicles yet — add one to see compatible chargers.
        </p>
      ) : null}

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-vehicle-title"
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-modal"
          >
            <h2 id="remove-vehicle-title" className="mb-2 text-xl font-bold text-slate-900">
              Remove this vehicle?
            </h2>
            <p className="mb-8 text-slate-500">
              This will remove the vehicle from your profile.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onRemove(confirmDelete)
                  setConfirmDelete(null)
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

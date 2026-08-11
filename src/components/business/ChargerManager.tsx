// src/components/business/ChargerManager.tsx
'use client'

import { Pencil, Plus, Trash2, Zap } from 'lucide-react'
import * as React from 'react'

import { Button, ConnectorBadge } from '@/components/ui'
import type { Connector, ConnectorStatus } from '@/lib/types'
import { cn, getConnectorConfig } from '@/lib/utils'
import { ChargerForm } from './ChargerForm'

export interface ChargerManagerProps {
  chargers: Connector[]
  onAdd: (charger: Omit<Connector, 'id'>) => void
  onUpdate: (id: string, data: Partial<Connector>) => void
  onRemove: (id: string) => void
  onToggleStatus: (id: string) => void
}

const BORDER_BY_STATUS: Record<ConnectorStatus, string> = {
  available: 'border-slate-200',
  'in-use': 'border-amber-200',
  offline: 'border-red-200',
}

export function ChargerManager({
  chargers,
  onAdd,
  onUpdate,
  onRemove,
  onToggleStatus,
}: ChargerManagerProps) {
  const [isAddingCharger, setIsAddingCharger] = React.useState(false)
  const [editingChargerId, setEditingChargerId] = React.useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)

  if (chargers.length === 0 && !isAddingCharger) {
    return (
      <div className="py-20 text-center">
        <Zap size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No chargers added yet</p>
        <p className="text-slate-500">Add your first charger to appear on the map</p>
        <div className="mt-6">
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsAddingCharger(true)}>
            Add First Charger
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {chargers.length} charger{chargers.length === 1 ? '' : 's'} listed
        </p>

        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddingCharger(true)}>
          Add Charger
        </Button>
      </div>

      {isAddingCharger ? (
        <div className="mb-6 animate-fade-up">
          <ChargerForm
            onSubmit={(charger) => {
              onAdd(charger)
              setIsAddingCharger(false)
            }}
            onCancel={() => setIsAddingCharger(false)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {chargers.map((charger) => {
          if (editingChargerId === charger.id) {
            return (
              <ChargerForm
                key={charger.id}
                initialData={charger}
                onSubmit={(data) => {
                  onUpdate(charger.id, data)
                  setEditingChargerId(null)
                }}
                onCancel={() => setEditingChargerId(null)}
              />
            )
          }

          const config = getConnectorConfig(charger.type)
          const isOnline = charger.status !== 'offline'

          return (
            <div
              key={charger.id}
              className={cn(
                'rounded-2xl border-[1.5px] bg-white p-6 transition-all duration-200',
                BORDER_BY_STATUS[charger.status],
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <ConnectorBadge type={charger.type} size="md" />
                  <p className="mt-1.5 text-sm text-slate-500">{config.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOnline}
                      aria-label={`${charger.type} availability`}
                      onClick={() => onToggleStatus(charger.id)}
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                        isOnline ? 'bg-green-500' : 'bg-slate-200',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200',
                          isOnline ? 'translate-x-[23px]' : 'translate-x-[3px]',
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isOnline ? 'text-green-700' : 'text-slate-500',
                      )}
                    >
                      {isOnline ? 'Available' : 'Offline'}
                    </span>
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Pencil size={16} />}
                    onClick={() => setEditingChargerId(charger.id)}
                  >
                    Edit
                  </Button>

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(charger.id)}
                    aria-label={`Delete ${charger.type} charger`}
                    className="flex h-9 items-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="font-mono text-xl font-bold text-slate-900">{charger.maxPowerKw}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">kW</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="font-mono text-xl font-bold text-slate-900">{charger.ports}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Ports</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="font-mono text-xl font-bold text-slate-900">
                    {charger.isFree ? 'Free' : charger.pricePerKwh}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                    {charger.isFree ? 'To use' : 'PKR per kWh'}
                  </p>
                </div>
              </div>

              {charger.compatibleVehicles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {charger.compatibleVehicles.slice(0, 6).map((vehicle) => (
                    <span
                      key={vehicle}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {vehicle}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-charger-title"
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-modal"
          >
            <h2 id="delete-charger-title" className="mb-2 text-xl font-bold text-slate-900">
              Delete this charger?
            </h2>
            <p className="mb-8 text-slate-500">
              It will be removed from your listing and stop appearing on the map.
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
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

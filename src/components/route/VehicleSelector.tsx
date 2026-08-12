// src/components/route/VehicleSelector.tsx
'use client'

import { Car, Check, ChevronDown, Search, X } from 'lucide-react'
import * as React from 'react'

import { ROUTE_VEHICLES } from '@/hooks/useRoutePlanner'
import type { EVModel } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface VehicleSelectorProps {
  selectedVehicle: EVModel | null
  onSelect: (vehicle: EVModel | null) => void
  className?: string
}

export function VehicleSelector({ selectedVehicle, onSelect, className }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const grouped = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matches = ROUTE_VEHICLES.filter((vehicle) =>
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(query),
    )

    const byMake = new Map<string, EVModel[]>()
    for (const vehicle of matches) {
      const existing = byMake.get(vehicle.make)
      if (existing) existing.push(vehicle)
      else byMake.set(vehicle.make, [vehicle])
    }

    return Array.from(byMake.entries())
  }, [searchQuery])

  const hasResults = grouped.length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex h-[52px] w-full items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 text-left transition-all duration-150',
          isOpen
            ? 'border-blue-500 shadow-focus'
            : 'border-slate-200 hover:border-slate-300',
        )}
      >
        <Car size={20} className="shrink-0 text-slate-400" aria-hidden="true" />

        <span className="min-w-0 flex-1">
          {selectedVehicle ? (
            <>
              <span className="block truncate text-ui font-medium text-slate-900">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </span>
              <span className="block text-xs text-slate-400">
                {selectedVehicle.rangeKm}km range
              </span>
            </>
          ) : (
            <span className="text-ui text-slate-400">Select your EV</span>
          )}
        </span>

        <ChevronDown
          size={18}
          className={cn(
            'shrink-0 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e3">
          <div className="border-b border-slate-100 p-3">
            {/* The input clears its own outline, so the ring lives on the
                container that visually reads as the field. */}
            <div className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-blue-500/40 transition-shadow focus-within:ring-2">
              <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your EV..."
                aria-label="Search vehicles"
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="scrollbar-hide max-h-[260px] overflow-y-auto" role="listbox">
            {hasResults ? (
              grouped.map(([make, vehicles]) => (
                <div key={make}>
                  <p className="sticky top-0 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {make}
                  </p>

                  {vehicles.map((vehicle) => {
                    const isSelected = selectedVehicle?.id === vehicle.id

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelect(vehicle)
                          setIsOpen(false)
                        }}
                        className="flex w-full items-center justify-between border-b border-slate-50 px-4 py-3 text-left transition-colors duration-100 hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {vehicle.model}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {vehicle.year} · {vehicle.rangeKm}km · {vehicle.connectorTypes[0]}
                          </span>
                        </span>

                        {isSelected ? (
                          <span className="shrink-0 rounded-full bg-blue-50 p-1">
                            <Check size={16} className="text-plug-blue-600" aria-hidden="true" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Car size={32} className="mx-auto text-slate-200" aria-hidden="true" />
                <p className="mt-2 text-sm text-slate-400">No vehicles found</p>
              </div>
            )}
          </div>

          {selectedVehicle ? (
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <X size={16} aria-hidden="true" />
              Clear selection
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

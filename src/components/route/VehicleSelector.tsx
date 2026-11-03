// src/components/route/VehicleSelector.tsx
'use client'

import { Car, Check, ChevronDown, Search, X } from '@/components/ui/icons'
import * as React from 'react'

import { TurnIcon } from '@/components/ui'
import { useListKeyboard } from '@/hooks/useListKeyboard'
import type { RouteVehicle } from '@/lib/route-plan'
import { cn } from '@/lib/utils'

export interface VehicleSelectorProps {
  vehicles: RouteVehicle[]
  selectedVehicle: RouteVehicle | null
  onSelect: (vehicle: RouteVehicle | null) => void
  className?: string
}

/**
 * Cars a Pakistani driver is most likely to be planning in, offered first.
 *
 * The list used to open on an alphabetical wall starting at "Alektra", so the
 * BYD Atto 3 or an MG ZS EV — the cars most people asking this question
 * actually drive — sat several screens down. This is an editorial shortlist,
 * not a sales ranking (there is no published one to cite): mainstream models
 * the catalogue records as sold new through an official local distributor or
 * assembled here. Slugs that are not in the catalogue are simply skipped.
 */
const POPULAR_SLUGS = [
  'byd-atto-3-advanced',
  'mg-zs-ev',
  'byd-seal',
  'byd-atto-2',
  'mg-4-urban',
  'honri-ve-2',
  'dfsk-seres-3',
  'deepal-s07',
  'deepal-l07',
  'kia-ev5',
  'gwm-ora-03',
  'byd-sealion-7-advanced',
]

const POPULAR_LABEL = 'Popular picks'

export function VehicleSelector({ vehicles, selectedVehicle, onSelect, className }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Opening puts the cursor in the search box, so typing filters at once
  // instead of first needing a second click into the field.
  React.useEffect(() => {
    if (isOpen) searchRef.current?.focus()
  }, [isOpen])

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
    const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

    // Every word must match, so "byd seal" narrows rather than widening.
    const matches = vehicles.filter((vehicle) => {
      const haystack = `${vehicle.make} ${vehicle.model}`.toLowerCase()
      return terms.every((term) => haystack.includes(term))
    })

    const byMake = new Map<string, RouteVehicle[]>()

    // With nothing typed, the shortlist comes first; the full catalogue,
    // by make, follows it.
    if (terms.length === 0) {
      const popular = POPULAR_SLUGS.map((slug) => vehicles.find((vehicle) => vehicle.id === slug)).filter(
        (vehicle): vehicle is RouteVehicle => vehicle !== undefined,
      )
      if (popular.length > 0) byMake.set(POPULAR_LABEL, popular)
    }

    for (const vehicle of matches) {
      const existing = byMake.get(vehicle.make)
      if (existing) existing.push(vehicle)
      else byMake.set(vehicle.make, [vehicle])
    }

    return Array.from(byMake.entries())
  }, [searchQuery, vehicles])

  const hasResults = grouped.length > 0

  // The groups flattened into one list, which is the order ↓/↑ walk in;
  // `offsets` maps each group's first option to its place in that list.
  const { flat, offsets } = React.useMemo(() => {
    const offsets: number[] = []
    const flat: RouteVehicle[] = []
    for (const [, groupVehicles] of grouped) {
      offsets.push(flat.length)
      flat.push(...groupVehicles)
    }
    return { flat, offsets }
  }, [grouped])

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const close = () => {
    setIsOpen(false)
    // Back to the trigger, so Tab carries on from the picker, not the page top.
    triggerRef.current?.focus()
  }
  const choose = (vehicle: RouteVehicle | null) => {
    onSelect(vehicle)
    close()
  }

  // ↓/↑ move through the cars, Enter picks, Escape closes.
  const keys = useListKeyboard({
    count: flat.length,
    open: isOpen,
    onPick: (index) => {
      const vehicle = flat[index]
      if (vehicle) choose(vehicle)
    },
    onClose: close,
    onOpen: () => setIsOpen(true),
    resetKey: searchQuery,
  })

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        // Typing on the closed picker opens it with that letter already in
        // the search, the way a native select jumps to a match. ↓ opens it.
        onKeyDown={(event) => {
          if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            setIsOpen(true)
            return
          }
          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey && event.key !== ' ') {
            event.preventDefault()
            setSearchQuery(event.key)
            setIsOpen(true)
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex h-[54px] w-full items-center gap-3 rounded-[14px] border-[1.5px] bg-white px-4 text-left transition-[border-color,box-shadow] duration-200 focus-visible:border-ink focus-visible:shadow-focus focus-visible:outline-none',
          isOpen ? 'border-ink shadow-focus' : 'border-ink/10 hover:border-ink/30',
        )}
      >
        <Car size={18} className="shrink-0 text-fog" aria-hidden="true" />

        <span className="min-w-0 flex-1">
          {selectedVehicle ? (
            <>
              <span className="block truncate text-[15px] font-medium leading-tight text-ink">
                {selectedVehicle.make} {selectedVehicle.model}
                {selectedVehicle.year ? ` (${selectedVehicle.year})` : ''}
              </span>
              <span className="mt-0.5 block font-mono text-[11.5px] text-muted">
                {selectedVehicle.rangeKm} km range
              </span>
            </>
          ) : (
            <span className="text-base text-fog">Select your EV</span>
          )}
        </span>

        <TurnIcon active={isOpen} className="text-muted">
          <ChevronDown size={18} aria-hidden="true" />
        </TurnIcon>
      </button>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-80 overflow-hidden rounded-[18px] border border-ink/10 bg-white shadow-e2">
          <div className="border-b border-ink/10 p-2">
            {/* The input clears its own outline, so the halo lives on the
                container that visually reads as the field. */}
            <div className="flex h-11 items-center gap-2 rounded-xl bg-chalk px-3 transition-shadow focus-within:shadow-focus">
              <Search size={16} className="shrink-0 text-muted" aria-hidden="true" />
              <input
                type="text"
                ref={searchRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={keys.onKeyDown}
                placeholder="Search your EV..."
                aria-label="Search vehicles"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={keys.listId}
                aria-activedescendant={keys.activeId}
                className="w-full border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-fog"
              />
            </div>
          </div>

          <div id={keys.listId} className="scrollbar-hide max-h-[260px] overflow-y-auto p-1.5" role="listbox">
            {hasResults ? (
              grouped.map(([make, vehicles], groupIndex) => (
                <div key={make}>
                  <p className="sticky top-0 z-[1] bg-white px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {make}
                  </p>

                  {vehicles.map((vehicle, indexInGroup) => {
                    const isSelected = selectedVehicle?.id === vehicle.id
                    const index = (offsets[groupIndex] ?? 0) + indexInGroup

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        {...keys.optionProps(index)}
                        aria-selected={keys.active === index}
                        // The checkmark marks the chosen car; aria-selected
                        // follows the keyboard highlight, as the pattern expects.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(vehicle)}
                        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100 hover:bg-chalk data-[active]:bg-chalk"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-ink">
                            {vehicle.model}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11.5px] text-muted">
                            {/* Year and plug are optional in the catalogue; show what is known. */}
                            {[vehicle.year || null, `${vehicle.rangeKm} km`, vehicle.connectorTypes[0]].filter(Boolean).join(' · ')}
                          </span>
                        </span>

                        {isSelected ? (
                          <span className="shrink-0 rounded-full bg-ink p-1">
                            <Check size={14} className="text-volt" aria-hidden="true" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Car size={32} className="mx-auto text-fog" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted">No vehicles found</p>
              </div>
            )}
          </div>

          {selectedVehicle ? (
            <button
              type="button"
              onClick={() => choose(null)}
              className="flex min-h-[46px] w-full items-center gap-2 border-t border-ink/10 px-4 py-3 text-sm font-semibold text-[#B42E05] transition-colors hover:bg-[#FFECE6]"
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

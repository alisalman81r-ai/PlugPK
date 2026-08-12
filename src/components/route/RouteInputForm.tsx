// src/components/route/RouteInputForm.tsx
'use client'

import { ArrowUpDown, BatteryCharging, Car, MapPin, Route } from 'lucide-react'
import * as React from 'react'

import { PAKISTAN_CITIES } from '@/lib/constants'
import type { EVModel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { BatterySlider } from './BatterySlider'
import { VehicleSelector } from './VehicleSelector'

export interface RouteInputFormProps {
  origin: string
  destination: string
  selectedVehicle: EVModel | null
  batteryPercent: number
  isCalculating: boolean
  canCalculate: boolean
  onOriginChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onVehicleSelect: (value: EVModel | null) => void
  onBatteryChange: (value: number) => void
  onSwapLocations: () => void
  onCalculate: () => void
}

interface CityFieldProps {
  id: string
  label: string
  dotClass: string
  pinClass: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function CityField({
  id,
  label,
  dotClass,
  pinClass,
  placeholder,
  value,
  onChange,
}: CityFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isFocused) return

    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isFocused])

  const suggestions = React.useMemo(() => {
    const query = value.trim().toLowerCase()
    if (query.length < 2) return []
    return PAKISTAN_CITIES.filter((city) => city.toLowerCase().includes(query)).slice(0, 6)
  }, [value])

  const showSuggestions = isFocused && suggestions.length > 0 && !suggestions.includes(value)

  return (
    <div ref={wrapperRef}>
      <label htmlFor={id} className="mb-2 flex items-center gap-2">
        <span aria-hidden="true" className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </label>

      <div className="relative">
        <MapPin
          size={18}
          className={cn('pointer-events-none absolute left-4 top-1/2 -translate-y-1/2', pinClass)}
          aria-hidden="true"
        />

        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-[52px] w-full rounded-xl border-[1.5px] border-slate-200 pl-12 pr-4 text-ui text-slate-900 transition-all duration-150 placeholder:text-slate-400 focus:border-blue-500 focus:shadow-focus focus:outline-none"
        />

        {showSuggestions ? (
          <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[220px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-e3">
            {suggestions.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onChange(city)
                  setIsFocused(false)
                }}
                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-slate-50"
              >
                <span className="shrink-0 rounded-lg bg-blue-50 p-1.5">
                  <MapPin size={16} className="text-plug-blue-600" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-900">{city}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RouteInputForm({
  origin,
  destination,
  selectedVehicle,
  batteryPercent,
  isCalculating,
  canCalculate,
  onOriginChange,
  onDestinationChange,
  onVehicleSelect,
  onBatteryChange,
  onSwapLocations,
  onCalculate,
}: RouteInputFormProps) {
  const [attempted, setAttempted] = React.useState(false)
  const [swapSpin, setSwapSpin] = React.useState(false)

  const handleCalculate = () => {
    setAttempted(true)
    onCalculate()
  }

  const hints: string[] = []
  if (attempted && !origin.trim()) hints.push('Add a starting location')
  if (attempted && !destination.trim()) hints.push('Add a destination')
  if (attempted && !selectedVehicle) hints.push('Select your EV')

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card lg:p-10">
      <h2 className="mb-8 text-2xl font-bold text-slate-900">Plan your route</h2>

      <div className="relative flex flex-col gap-5">
        <CityField
          id="route-origin"
          label="From"
          dotClass="bg-green-500"
          pinClass="text-slate-400"
          placeholder="Starting location..."
          value={origin}
          onChange={onOriginChange}
        />

        {/* Both fields are the same height, so the container's vertical centre
            is always the gap between them — no pixel offsets to keep in sync. */}
        <span
          aria-hidden="true"
          className="absolute left-[22px] top-1/2 h-6 -translate-y-1/2 border-l-2 border-dashed border-slate-200"
        />

        <button
          type="button"
          onClick={() => {
            setSwapSpin((spin) => !spin)
            onSwapLocations()
          }}
          aria-label="Swap origin and destination"
          className="absolute right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border-[1.5px] border-slate-200 bg-white shadow-sm transition-all duration-150 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowUpDown
            size={16}
            className={cn(
              'text-slate-500 transition-transform duration-200',
              swapSpin && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        <CityField
          id="route-destination"
          label="To"
          dotClass="bg-red-500"
          pinClass="text-plug-blue-600"
          placeholder="Destination..."
          value={destination}
          onChange={onDestinationChange}
        />
      </div>

      <hr className="my-8 border-slate-100" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <span className="mb-2 flex items-center gap-2">
            <Car size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Your EV
            </span>
          </span>
          <VehicleSelector selectedVehicle={selectedVehicle} onSelect={onVehicleSelect} />
        </div>

        <div>
          <span className="mb-2 flex items-center gap-2">
            <BatteryCharging size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Current Battery
            </span>
          </span>
          <BatterySlider
            value={batteryPercent}
            onChange={onBatteryChange}
            vehicle={selectedVehicle}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalculate}
        disabled={isCalculating}
        className={cn(
          'mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold text-white transition-all duration-200',
          canCalculate && !isCalculating
            ? 'bg-gradient-brand hover:-translate-y-0.5 hover:shadow-blue-lg hover:brightness-110'
            : 'cursor-not-allowed bg-slate-300 opacity-60',
        )}
      >
        {isCalculating ? (
          <>
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Calculating your route...
          </>
        ) : (
          <>
            <Route size={20} aria-hidden="true" />
            Calculate Route
          </>
        )}
      </button>

      {hints.length > 0 ? (
        <p className="mt-3 text-center text-xs text-slate-400">{hints.join(' · ')}</p>
      ) : null}
    </div>
  )
}

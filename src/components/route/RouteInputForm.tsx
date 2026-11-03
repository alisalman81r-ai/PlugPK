// src/components/route/RouteInputForm.tsx
'use client'

import { ArrowUpDown, BatteryCharging, Car, MapPin, Route } from '@/components/ui/icons'
import * as React from 'react'

import { MyCarHint } from '@/components/tools/MyCarHint'
import { btnClass, Eyebrow, INPUT } from '@/components/v2/ui'
import { useListKeyboard } from '@/hooks/useListKeyboard'
import { useMyCar } from '@/hooks/useMyCar'
import { PAKISTAN_CITIES } from '@/lib/constants'
import type { RouteVehicle } from '@/lib/route-plan'
import { cn } from '@/lib/utils'
import { BatterySlider } from './BatterySlider'
import { VehicleSelector } from './VehicleSelector'

export interface RouteInputFormProps {
  /** What the EV picker offers. */
  vehicles: RouteVehicle[]
  origin: string
  destination: string
  selectedVehicle: RouteVehicle | null
  batteryPercent: number
  isCalculating: boolean
  canCalculate: boolean
  onOriginChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onVehicleSelect: (value: RouteVehicle | null) => void
  onBatteryChange: (value: number) => void
  onSwapLocations: () => void
  onCalculate: () => void
}

/** The mono field label (.rt-lbl). */
const LBL =
  'flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted [&_svg]:h-4 [&_svg]:w-4'

const DOT_A = 'bg-[#35D07F] shadow-[0_0_0_3px_rgba(53,208,127,.2)]'
const DOT_B = 'bg-ember shadow-[0_0_0_3px_rgba(255,90,31,.18)]'

interface CityFieldProps {
  id: string
  label: string
  dotClass: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function CityField({ id, label, dotClass, placeholder, value, onChange }: CityFieldProps) {
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
  const isKnown = PAKISTAN_CITIES.includes(value)

  const pick = (city: string) => {
    onChange(city)
    setIsFocused(false)
  }

  // ↓/↑ move through the suggestions, Enter picks, Escape closes.
  const keys = useListKeyboard({
    count: suggestions.length,
    open: showSuggestions,
    onPick: (index) => {
      const city = suggestions[index]
      if (city) pick(city)
    },
    onClose: () => setIsFocused(false),
    onOpen: () => setIsFocused(true),
    resetKey: value,
  })

  /** The typed part of a suggestion, marked with the volt highlighter. */
  const marked = (city: string) => {
    const q = value.trim()
    const at = city.toLowerCase().indexOf(q.toLowerCase())
    if (!q || at < 0) return city
    return (
      <>
        {city.slice(0, at)}
        <mark className="bg-[linear-gradient(transparent_58%,#D4FF3A_58%,#D4FF3A_92%,transparent_92%)] font-semibold text-inherit">
          {city.slice(at, at + q.length)}
        </mark>
        {city.slice(at + q.length)}
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="grid gap-2">
      <label htmlFor={id} className={LBL}>
        <span aria-hidden="true" className={cn('h-[9px] w-[9px] shrink-0 rounded-full', dotClass)} />
        {label}
      </label>

      <div className="relative">
        <MapPin
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog"
          aria-hidden="true"
        />

        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            // Typing after Escape brings the suggestions back.
            setIsFocused(true)
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={keys.onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={keys.listId}
          aria-activedescendant={showSuggestions ? keys.activeId : undefined}
          className={cn(INPUT, 'pl-12 pr-16', isKnown && 'border-ink/30')}
        />

        {showSuggestions ? (
          <div
            id={keys.listId}
            role="listbox"
            aria-label="Cities"
            className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[300px] overflow-y-auto rounded-[18px] border border-ink/10 bg-white p-1.5 shadow-e2"
          >
            {suggestions.map((city, index) => (
              <button
                key={city}
                type="button"
                role="option"
                tabIndex={-1}
                {...keys.optionProps(index)}
                aria-selected={keys.active === index}
                // mousedown, not click: keeps focus in the input so the list
                // does not close before the pick lands.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(city)}
                className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-ink transition-colors duration-150 hover:bg-chalk data-[active]:bg-chalk"
              >
                <MapPin size={17} className="shrink-0 text-fog" aria-hidden="true" />
                <span>{marked(city)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The planner card (landing-v2 .planner): two cities on a dashed rail with a
 * swap button between them, then the car and the battery side by side, then
 * the one big ink button.
 */
export function RouteInputForm({
  vehicles,
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
  const myCar = useMyCar()
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
    <div className="mx-auto w-full max-w-[880px] rounded-[26px] border border-ink/10 bg-white px-4 pb-6 pt-[22px] shadow-e2 sm:rounded-[32px] sm:p-[clamp(24px,4vw,44px)]">
      <Eyebrow className="mb-3">
        <Route size={15} aria-hidden="true" />
        Or plan your own
      </Eyebrow>
      <h2 className="m-0 font-display text-[clamp(30px,3.2vw,42px)] leading-[1.05] text-ink">Plan your route</h2>
      <p className="mt-2.5 text-[15px] text-muted">
        Two cities, your car and its current charge — that is everything we need.
      </p>

      <div className="relative mt-8 grid gap-3.5">
        {/* The dashed rail from the From dot down to the To dot. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[76px] left-1 top-[22px] border-l-[1.5px] border-dashed border-ink/20"
        />

        <CityField
          id="route-origin"
          label="From"
          dotClass={DOT_A}
          placeholder="Starting location..."
          value={origin}
          onChange={onOriginChange}
        />

        {/* Both fields are the same height, so the vertical centre is always
            the gap between them. */}
        <button
          type="button"
          onClick={() => {
            setSwapSpin((spin) => !spin)
            onSwapLocations()
          }}
          aria-label="Swap origin and destination"
          className={cn(
            'absolute right-2 top-1/2 z-[4] grid h-11 w-11 -translate-y-0.5 place-items-center rounded-[14px] border-[1.5px] border-ink/10 bg-white text-ink shadow-e1 sm:right-3',
            'transition-[background-color,border-color,color,rotate] duration-500 ease-spring hover:border-ink hover:bg-ink hover:text-volt',
            'focus-visible:outline-none focus-visible:shadow-focus',
            swapSpin && 'rotate-180',
          )}
        >
          <ArrowUpDown size={20} aria-hidden="true" />
        </button>

        <CityField
          id="route-destination"
          label="To"
          dotClass={DOT_B}
          placeholder="Destination..."
          value={destination}
          onChange={onDestinationChange}
        />
      </div>

      <div className="mt-[30px] grid gap-7 border-t border-dashed border-ink/10 pt-7 md:grid-cols-[1fr_1.15fr] md:gap-9">
        <div className="grid content-start gap-2">
          <span className={LBL}>
            <Car aria-hidden="true" />
            Your EV
          </span>
          <VehicleSelector vehicles={vehicles} selectedVehicle={selectedVehicle} onSelect={onVehicleSelect} />
          {myCar && vehicles.some((v) => v.id === myCar.slug) ? (
            <div className="mt-1">
              <MyCarHint
                car={myCar}
                selected={selectedVehicle?.id ?? ''}
                onUse={(slug) => onVehicleSelect(vehicles.find((v) => v.id === slug) ?? null)}
              />
            </div>
          ) : null}
        </div>

        <div className="grid content-start gap-2">
          <span className={LBL}>
            <BatteryCharging aria-hidden="true" />
            Current battery
          </span>
          <BatterySlider value={batteryPercent} onChange={onBatteryChange} vehicle={selectedVehicle} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalculate}
        disabled={isCalculating}
        aria-describedby={hints.length > 0 ? 'route-hints' : undefined}
        className={cn(
          btnClass('ink', 'lg', 'mt-[26px] w-full'),
          !canCalculate && !isCalculating && 'bg-stone text-[#8a8e95] shadow-none hover:bg-stone hover:text-[#8a8e95]',
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
            <Route aria-hidden="true" />
            Calculate route
          </>
        )}
      </button>

      {hints.length > 0 ? (
        <p id="route-hints" aria-live="polite" className="mt-3 text-center text-[13px] text-muted">
          {hints.join(' · ')}
        </p>
      ) : null}
    </div>
  )
}

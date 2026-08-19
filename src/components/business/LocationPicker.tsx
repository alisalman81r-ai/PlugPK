// src/components/business/LocationPicker.tsx
'use client'

import { Crosshair, Loader2, MapPin } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange: (next: { lat: number | null; lng: number | null }) => void
  className?: string
  /** Ids must be unique per page — the admin form and the wizard differ. */
  idPrefix?: string
}

/** Roughly the bounding box of Pakistan, used only to catch obvious mistakes. */
const BOUNDS = { minLat: 23.5, maxLat: 37.2, minLng: 60.8, maxLng: 77.9 }

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500'

/**
 * Captures the position of a business, either from the device or by hand.
 *
 * A city and a street line are not a location — two businesses on the same
 * road share both, and nothing can put a pin from them. This asks for the one
 * thing a map actually needs, and offers the browser's own geolocation so the
 * common case is a single tap rather than hunting for coordinates.
 *
 * Geolocation is requested only on that tap, never on mount: a permission
 * prompt that appears because a page loaded is one people dismiss out of
 * reflex, and a dismissed prompt is hard to get back.
 */
export function LocationPicker({
  lat,
  lng,
  onChange,
  className,
  idPrefix = 'loc',
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const outOfBounds =
    lat !== null &&
    lng !== null &&
    (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng)

  const useCurrentLocation = () => {
    setError(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('This browser cannot share a location. Enter the coordinates below instead.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        onChange({
          // Six decimals is about 0.1m — beyond that is noise, and the extra
          // digits only make the field harder to read.
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        })
      },
      (positionError) => {
        setIsLocating(false)
        // Each case needs a different action from the person, so they get
        // different sentences rather than one generic failure.
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser, or type the coordinates below.'
            : positionError.code === positionError.TIMEOUT
              ? 'Locating took too long. Try again, or type the coordinates below.'
              : 'Could not get your location. Type the coordinates below instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  const setPart = (part: 'lat' | 'lng', raw: string) => {
    setError(null)
    const trimmed = raw.trim()
    if (trimmed === '') {
      onChange({ lat: part === 'lat' ? null : lat, lng: part === 'lng' ? null : lng })
      return
    }
    const value = Number(trimmed)
    if (Number.isNaN(value)) return
    onChange({ lat: part === 'lat' ? value : lat, lng: part === 'lng' ? value : lng })
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={isLocating}
        className={cn(
          'inline-flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-plug-blue-200 bg-plug-blue-50 px-5 text-ui font-semibold text-plug-blue-700',
          'transition-colors duration-150 hover:border-plug-blue-300 hover:bg-plug-blue-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
          'disabled:opacity-60',
        )}
      >
        {isLocating ? (
          <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Crosshair size={16} className="shrink-0" aria-hidden="true" />
        )}
        {isLocating ? 'Getting your location…' : 'Use my current location'}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-lat`}
            className="mb-1.5 block text-ui-sm font-semibold text-slate-700"
          >
            Latitude
          </label>
          <input
            id={`${idPrefix}-lat`}
            type="number"
            step="any"
            inputMode="decimal"
            value={lat ?? ''}
            onChange={(event) => setPart('lat', event.target.value)}
            placeholder="33.684422"
            className={FIELD}
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-lng`}
            className="mb-1.5 block text-ui-sm font-semibold text-slate-700"
          >
            Longitude
          </label>
          <input
            id={`${idPrefix}-lng`}
            type="number"
            step="any"
            inputMode="decimal"
            value={lng ?? ''}
            onChange={(event) => setPart('lng', event.target.value)}
            placeholder="73.047882"
            className={FIELD}
          />
        </div>
      </div>

      {lat !== null && lng !== null && !outOfBounds ? (
        <p className="inline-flex items-center gap-1.5 text-ui-sm text-emerald-700">
          <MapPin size={14} className="shrink-0" aria-hidden="true" />
          Pin set at {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}

      {outOfBounds ? (
        <p role="alert" className="text-ui-sm text-amber-700">
          Those coordinates are outside Pakistan. Check they are the right way round —
          latitude first, then longitude.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-ui-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

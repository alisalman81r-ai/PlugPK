// src/components/business/LocationPicker.tsx
'use client'

import { Check, Crosshair, Loader2, MapPin, Undo2 } from 'lucide-react'
import * as React from 'react'

import { reverseGeocode } from '@/lib/geocode-actions'
import { cn } from '@/lib/utils'

export interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange: (next: { lat: number | null; lng: number | null }) => void
  className?: string
  /** Ids must be unique per page — the admin form and the wizard differ. */
  idPrefix?: string
  /**
   * Fills the address and city fields from the pin.
   *
   * Optional: the admin form has its own address inputs that an operator is
   * typing deliberately, so it can leave this out and keep coordinates-only
   * behaviour. When it is supplied, finding a location also proposes an
   * address, which the person can keep or undo.
   */
  onAddressFound?: (next: { address: string; city: string | null }) => void
  /** The address currently in the form, so Undo can put it back. */
  currentAddress?: string
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
  onAddressFound,
  currentAddress = '',
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // The suggestion that was applied, and what the field held before it, so the
  // fill can be taken back rather than only apologised for.
  const [filled, setFilled] = React.useState<{ address: string; previous: string } | null>(null)
  const [isLookingUp, setIsLookingUp] = React.useState(false)
  const [lookupNote, setLookupNote] = React.useState<string | null>(null)

  /**
   * Fills the address from a pin, then says so.
   *
   * The address is written into the form rather than held back behind a
   * "use this?" prompt, because the common case is that it is right and the
   * person wanted it filled. The panel that appears afterwards is the asking
   * part: keep it, or undo and type your own.
   */
  const fillAddressFrom = async (position: { lat: number; lng: number }) => {
    if (!onAddressFound) return

    setIsLookingUp(true)
    setLookupNote(null)

    const result = await reverseGeocode(position.lat, position.lng)
    setIsLookingUp(false)

    if (!result.ok || !result.address) {
      // Not an error worth blocking on — the pin is set, which is the part that
      // matters, and the address can be typed.
      setLookupNote(`${result.message ?? 'No address found for that spot.'} Type your address below.`)
      return
    }

    setFilled({ address: result.address, previous: currentAddress })
    onAddressFound({ address: result.address, city: result.city ?? null })
  }

  const undoFill = () => {
    if (!filled || !onAddressFound) return
    onAddressFound({ address: filled.previous, city: null })
    setFilled(null)
  }

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
        const next = {
          // Six decimals is about 0.1m — beyond that is noise, and the extra
          // digits only make the field harder to read.
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }
        onChange(next)
        void fillAddressFrom(next)
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

      {isLookingUp ? (
        <p className="inline-flex items-center gap-1.5 text-ui-sm text-slate-500">
          <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />
          Looking up your address…
        </p>
      ) : null}

      {/*
        The asking part of "fill it, then ask".

        It names the address that went into the field rather than just saying
        something was filled, because the whole question is whether that
        particular line is right — and a reverse-geocoded address in Pakistan
        often lands on the housing society rather than the house.
      */}
      {filled && !isLookingUp ? (
        <div
          role="status"
          className="rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="flex items-start gap-2 text-ui-sm font-semibold text-emerald-900">
            <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            We filled your address from your location
          </p>

          <p className="mt-2 rounded-lg bg-white px-3 py-2 text-ui-sm text-slate-700">
            {filled.address}
          </p>

          <p className="mt-2.5 text-ui-sm text-emerald-900/80">
            Keep it if that is right, or undo and write it yourself — the address field stays
            editable either way.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilled(null)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Check size={14} aria-hidden="true" />
              Keep this address
            </button>

            <button
              type="button"
              onClick={undoFill}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-ui-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Undo2 size={14} aria-hidden="true" />
              Undo, I&apos;ll type it
            </button>
          </div>
        </div>
      ) : null}

      {lookupNote && !isLookingUp ? (
        <p role="status" className="text-ui-sm text-slate-500">
          {lookupNote}
        </p>
      ) : null}

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

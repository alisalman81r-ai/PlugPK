// src/components/business/LocationPicker.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import { btnClass, Ico, IN } from '@/components/admin/network-kit'
import { reverseGeocode } from '@/lib/geocode-actions'
import { cn } from '@/lib/utils'

import { Reveal } from './host/biz-kit'

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

    const found = (position: GeolocationPosition) => {
      setIsLocating(false)
      const next = {
        // Six decimals is about 0.1m — beyond that is noise, and the extra
        // digits only make the field harder to read.
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      }
      onChange(next)
      void fillAddressFrom(next)
    }

    const failed = (positionError: GeolocationPositionError) => {
      setIsLocating(false)
      // Each case needs a different action from the person, so they get
      // different sentences rather than one generic failure.
      setError(
        positionError.code === positionError.PERMISSION_DENIED
          ? 'Location permission was denied. Allow it in your browser, or type the coordinates below.'
          : positionError.code === positionError.TIMEOUT
            ? 'Locating took too long. Check that location is turned on for this device, try again, or type the coordinates below.'
            : 'Could not get your location. Check that location is turned on for this device, or type the coordinates below.',
      )
    }

    /*
      GPS first, then the network.

      High accuracy alone used to be the only attempt, with a 12 second limit.
      A laptop or desktop has no GPS, so it waited for a fix that never came and
      always ended in "took too long" — on exactly the machines a business is
      most likely to fill this form in on. A phone still gets its GPS fix in
      the first attempt; anything else falls back to the Wi-Fi / network
      position the device already has, which is quick and usually within a
      few dozen metres. A refused permission is final, so it is not retried.
    */
    navigator.geolocation.getCurrentPosition(
      found,
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          failed(positionError)
          return
        }
        navigator.geolocation.getCurrentPosition(found, failed, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
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
    <div className={cn('flex flex-col gap-3.5', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={useCurrentLocation} disabled={isLocating} className={btnClass('ink')}>
          {isLocating ? <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" /> : <Ico name="pinl" />}
          {isLocating ? 'Getting your location…' : 'Use my current location'}
        </button>
        <span className="text-[13px] text-muted">or type the coordinates.</span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor={`${idPrefix}-lat`} className="text-sm font-medium text-ink">
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
            className={cn(IN, 'font-mono')}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor={`${idPrefix}-lng`} className="text-sm font-medium text-ink">
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
            className={cn(IN, 'font-mono')}
          />
        </div>
      </div>

      {isLookingUp ? (
        <p className="m-0 inline-flex items-center gap-1.5 text-[13px] text-muted">
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
        <Reveal role="status">
          <div className="rounded-[18px] border border-[rgba(63,82,0,.15)] bg-[linear-gradient(120deg,rgba(212,255,58,.3),rgba(212,255,58,.08))] p-4">
            <p className="m-0 flex items-start gap-2 text-sm font-semibold text-ink [&_svg]:mt-px [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:text-volt-ink">
              <Ico name="okc" />
              We filled your address from your location
            </p>

            <p className="mb-0 mt-2.5 rounded-xl border border-ink/[.09] bg-white px-3.5 py-2.5 text-sm text-ink">{filled.address}</p>

            <p className="mb-0 mt-2.5 text-[13px] text-muted">
              Keep it if that is right, or undo and write it yourself — the address field stays editable either way.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setFilled(null)} className={btnClass('ink', 'sm')}>
                <Ico name="check" />
                Keep this address
              </button>

              <button type="button" onClick={undoFill} className={btnClass('line', 'sm')}>
                <Ico name="undo" />
                Undo, I&apos;ll type it
              </button>
            </div>
          </div>
        </Reveal>
      ) : null}

      {lookupNote && !isLookingUp ? (
        <p role="status" className="m-0 text-[13px] text-muted">
          {lookupNote}
        </p>
      ) : null}

      {lat !== null && lng !== null && !outOfBounds ? (
        <p className="m-0 inline-flex items-center gap-2 self-start rounded-full bg-[rgba(53,208,127,.12)] px-3 py-1.5 font-mono text-xs font-semibold text-[#12804a] [&_svg]:h-3.5 [&_svg]:w-3.5">
          <Ico name="pinl" />
          Pin set at {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}

      {outOfBounds ? (
        <p role="alert" className="m-0 rounded-xl border border-[rgba(255,176,32,.3)] bg-[rgba(255,176,32,.1)] px-3.5 py-2.5 text-sm text-[#6b4600]">
          Those coordinates are outside Pakistan. Check they are the right way round — latitude first, then longitude.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="m-0 rounded-xl border border-[rgba(255,90,31,.25)] bg-[rgba(255,90,31,.06)] px-3.5 py-2.5 text-sm text-[#b23b0d]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

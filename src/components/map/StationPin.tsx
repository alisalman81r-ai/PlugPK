// src/components/map/StationPin.tsx
'use client'

import { Zap } from '@/components/ui/icons'

import { FAST_CHARGER_KW } from '@/lib/charging'
import type { Station } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

/*
  ── Coloured by speed, not by "status" ─────────────────────────────────

  Pins used to be blue, amber or grey for available / limited / offline, with
  a pulse ring on the "available" ones and a legend promising what each colour
  meant. Plug.pk has no live connection to any charger — the FAQ says so — and
  the status column only changes when somebody edits it, so the colours were a
  live-availability claim nothing stood behind.

  Speed is a fact about the hardware. Pins are now split at FAST_CHARGER_KW,
  the same threshold the home page's map uses, so the two maps read alike.
*/

type PinKind = 'fast' | 'standard'

function pinKind(station: Station): PinKind {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  return maxPower >= FAST_CHARGER_KW ? 'fast' : 'standard'
}

const PIN_COLOR: Record<PinKind, string> = {
  fast: 'bg-plug-blue-600',
  standard: 'bg-slate-500',
}

/**
 * The map legend, defined here rather than on the page.
 *
 * A legend that lists its own colours is a legend that goes stale the first
 * time a pin changes — and a wrong legend is worse than none, because the
 * reader trusts it. This reads the pin colours themselves.
 */
export const PIN_LEGEND: { key: PinKind; label: string; colorClass: string }[] = [
  { key: 'fast', label: `${FAST_CHARGER_KW} kW+`, colorClass: PIN_COLOR.fast },
  { key: 'standard', label: `Under ${FAST_CHARGER_KW} kW`, colorClass: PIN_COLOR.standard },
]

/** The marker's native tooltip and accessible name: what it is and how fast. */
export function pinTitle(station: Station): string {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  return maxPower > 0 ? `${station.name} — up to ${maxPower} kW` : station.name
}

export interface StationPinProps {
  station: Station
  isSelected: boolean
}

/**
 * The marker visual, shared by both map engines so a pin looks identical
 * whether the page is running on Google or the keyless fallback. Only the
 * surrounding <Marker> wrapper differs between them.
 *
 * The pill carries peak power, so the map answers "how fast" without
 * anything having to be opened.
 */
export function StationPin({ station, isSelected }: StationPinProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const color = PIN_COLOR[pinKind(station)]

  return (
    <span className="relative flex cursor-pointer flex-col items-center">
      <span
        className={cn(
          'relative flex items-center gap-1 rounded-full border-2 py-1 pl-1.5 pr-2.5 shadow-e2',
          'transition-transform duration-200 ease-spring motion-reduce:transition-none',
          color,
          isSelected ? 'scale-110 border-white ring-2 ring-plug-blue-500/60' : 'border-white',
        )}
      >
        <Zap size={13} className="shrink-0 fill-white text-white" aria-hidden="true" />
        {maxPower > 0 ? (
          <span className="font-mono text-ui-xs font-bold leading-none text-white">
            {maxPower}
            <span className="ml-px text-[9px] font-semibold opacity-80">kW</span>
          </span>
        ) : null}
      </span>

      {/* Stem, so the pill points at its coordinate. */}
      <span aria-hidden="true" className={cn('h-1.5 w-0.5 -translate-y-px rounded-b', color)} />
    </span>
  )
}

/** The pulsing dot marking the visitor's own position. */
export function UserLocationPin() {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-ping rounded-full bg-plug-blue-200 opacity-75 motion-reduce:animate-none"
      />
      <span className="relative h-3 w-3 rounded-full border-2 border-white bg-plug-blue-600" />
    </span>
  )
}

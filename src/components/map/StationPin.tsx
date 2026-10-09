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
  standard: 'bg-[#626D6B]',
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
  const fast = pinKind(station) === 'fast'

  return (
    <span
      className={cn(
        'group relative flex cursor-pointer flex-col items-center',
        // Shadows rather than filter: drop-shadow — a filter on every pin is
        // repainted on every frame of a pan; a box-shadow is not.
        'origin-bottom transition-transform duration-200 ease-spring motion-reduce:transition-none',
        isSelected ? 'scale-[1.14]' : 'hover:-translate-y-0.5',
      )}
    >
      {/* The station's name, raised above the selected pin. */}
      <span
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 max-w-[220px] -translate-x-1/2 truncate whitespace-nowrap',
          'rounded-[10px] bg-white px-2.5 py-1.5 text-ui-xs font-bold leading-tight text-slate-900 shadow-e3',
          'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
          isSelected ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        )}
      >
        {station.name}
      </span>

      <span
        className={cn(
          'relative flex h-[34px] items-center gap-[3px] rounded-full border-2 border-white pl-[5px] pr-3',
          fast
            ? 'bg-[linear-gradient(160deg,#14594D,#0B332C)] text-plug-cyan-300'
            : 'bg-[linear-gradient(160deg,#7C8784,#626D6B)] text-white',
          isSelected
            ? 'shadow-[0_0_0_6px_rgba(38,205,178,0.28),0_12px_20px_-6px_rgba(5,36,30,0.5)]'
            : 'shadow-[0_8px_16px_-6px_rgba(5,36,30,0.45)]',
        )}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20">
          <Zap size={13} className="fill-current" aria-hidden="true" />
        </span>
        {maxPower > 0 ? (
          <span className="font-mono text-[13px] font-bold leading-none">
            {maxPower}
            <span className="ml-px text-[10px] font-semibold opacity-80">kW</span>
          </span>
        ) : null}
      </span>

      {/* A turned square under the pill, so the pin points at its coordinate. */}
      <span
        aria-hidden="true"
        className={cn(
          '-mt-2 h-3 w-3 rotate-45 border-b-2 border-r-2 border-white',
          fast ? 'bg-[#0B332C]' : 'bg-[#626D6B]',
        )}
      />
    </span>
  )
}

/** Pins that would overlap, merged into one bubble with a count; a click zooms in. */
export function ClusterPin({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'flex h-[38px] cursor-pointer items-center gap-[5px] rounded-full border-2 border-white pl-[9px] pr-[13px]',
        'bg-[linear-gradient(160deg,#14594D,#05241E)] text-plug-cyan-300',
        'shadow-[0_0_0_6px_rgba(38,205,178,0.22),0_10px_22px_-8px_rgba(5,36,30,0.55)]',
        'transition-transform duration-200 ease-spring hover:scale-105 motion-reduce:transition-none',
      )}
    >
      <Zap size={13} className="fill-current" aria-hidden="true" />
      <span className="font-mono text-[15px] font-bold leading-none text-white">{count}</span>
      <span className="text-[11px] font-semibold leading-none text-white/70">stations</span>
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

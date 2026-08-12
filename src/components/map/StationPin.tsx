// src/components/map/StationPin.tsx
'use client'

import { Zap } from 'lucide-react'

import type { Station, StationStatus } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

/** Reaches assistive tech and native tooltips via each marker's title. */
export const STATUS_LABEL: Record<StationStatus, string> = {
  available: 'Available',
  limited: 'Limited availability',
  offline: 'Offline',
  unknown: 'Status unknown',
}

const PIN_COLOR: Record<StationStatus, string> = {
  available: 'bg-plug-blue-600',
  limited: 'bg-amber-500',
  offline: 'bg-slate-400',
  unknown: 'bg-slate-300',
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

  return (
    <span className="relative flex cursor-pointer flex-col items-center">
      {station.status === 'available' ? (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full bg-plug-blue-600/25 motion-reduce:animate-none"
        />
      ) : null}

      <span
        className={cn(
          'relative flex items-center gap-1 rounded-full border-2 py-1 pl-1.5 pr-2.5 shadow-e2',
          'transition-transform duration-200 ease-spring motion-reduce:transition-none',
          PIN_COLOR[station.status],
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
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-0.5 -translate-y-px rounded-b', PIN_COLOR[station.status])}
      />
    </span>
  )
}

/** The pulsing dot marking the visitor's own position. */
export function UserLocationPin() {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-75 motion-reduce:animate-none"
      />
      <span className="relative h-3 w-3 rounded-full border-2 border-white bg-plug-blue-600" />
    </span>
  )
}

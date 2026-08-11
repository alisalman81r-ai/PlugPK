// src/components/route/RouteMap.tsx
'use client'

import { ArrowRight, BatteryCharging, Clock, Route, Zap } from 'lucide-react'

import { ConnectorBadgeGroup } from '@/components/ui'
import type { PlannedRoute } from '@/lib/types'
import { cn, formatDuration, getMaxPower } from '@/lib/utils'

export interface RouteMapProps {
  route: PlannedRoute
  className?: string
}

export function RouteMap({ route, className }: RouteMapProps) {
  const startBattery = route.stops[0]
    ? route.stops[0].arrivalBatteryPercent + 25
    : 80
  const arrivalBattery = route.stops.length > 0 ? 45 : startBattery

  return (
    <div
      className={cn(
        'relative min-h-[400px] overflow-hidden rounded-3xl bg-dark-base p-8',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[90px]"
      />

      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="truncate">{route.origin}</span>
            <ArrowRight size={16} className="shrink-0 text-white/40" aria-hidden="true" />
            <span className="truncate">{route.destination}</span>
          </p>
          <p className="shrink-0 font-mono font-bold text-blue-400">
            {route.totalDistanceKm.toLocaleString('en-PK')} km
          </p>
        </div>

        <div className="relative pl-8">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-3 top-2 w-0.5 bg-gradient-to-b from-green-500 via-plug-blue-600 to-red-500"
          />

          {/* Start */}
          <div className="relative mb-8">
            <span
              aria-hidden="true"
              className="absolute -left-[28px] top-1 h-4 w-4 rounded-full border-2 border-green-400 bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.50)]"
            />
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-xs uppercase tracking-wider text-white/40">Start</span>
                <span className="mt-1 block font-bold text-white">{route.origin}</span>
              </span>
              <span className="shrink-0 font-mono font-bold text-green-400">{startBattery}%</span>
            </div>
          </div>

          {/* Stops */}
          {route.stops.map((stop) => {
            const maxPower =
              stop.station.connectors.length > 0 ? getMaxPower(stop.station) : 0

            return (
              <div key={stop.station.id} className="relative mb-8">
                <span
                  aria-hidden="true"
                  className="absolute -left-[28px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white/20 bg-plug-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.55)]"
                >
                  <Zap size={8} className="fill-white text-white" />
                </span>

                <div className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-white">
                      {String(stop.order).padStart(2, '0')} · {stop.station.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-blue-400">
                      {stop.chargingTimeMinutes} min charge
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-sm font-bold text-amber-400">
                      {stop.arrivalBatteryPercent}%
                    </span>
                    <span className="block font-mono text-sm font-bold text-green-400">
                      {stop.departureBatteryPercent}%
                    </span>
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-white/5 px-4 py-3">
                  <ConnectorBadgeGroup connectors={stop.station.connectors} max={2} size="sm" />
                  {maxPower > 0 ? (
                    <span className="font-mono text-xs text-white/60">{maxPower} kW</span>
                  ) : null}
                  <span className="font-mono text-xs text-white/40">
                    {stop.distanceFromPreviousKm} km leg
                  </span>
                </div>
              </div>
            )
          })}

          {/* End */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[28px] top-1 h-4 w-4 rounded-full border-2 border-red-400 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.40)]"
            />
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-xs uppercase tracking-wider text-white/40">
                  Destination
                </span>
                <span className="mt-1 block font-bold text-white">{route.destination}</span>
              </span>
              <span className="shrink-0 font-mono font-bold text-amber-400">~{arrivalBattery}%</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-around border-t border-white/[0.08] pt-6">
          <span className="flex flex-col items-center gap-1 text-white/60">
            <Clock size={16} aria-hidden="true" />
            <span className="font-mono text-sm">
              {formatDuration(route.estimatedDriveTimeMinutes)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40">Drive</span>
          </span>

          <span className="flex flex-col items-center gap-1 text-white/60">
            <BatteryCharging size={16} aria-hidden="true" />
            <span className="font-mono text-sm">
              {formatDuration(route.totalChargingTimeMinutes)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40">Charge</span>
          </span>

          <span className="flex flex-col items-center gap-1 text-white/60">
            <Route size={16} aria-hidden="true" />
            <span className="font-mono text-sm">{route.stops.length}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/40">Stops</span>
          </span>
        </div>
      </div>
    </div>
  )
}

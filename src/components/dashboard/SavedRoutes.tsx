// src/components/dashboard/SavedRoutes.tsx
'use client'

import { BatteryCharging, Clock, ExternalLink, Route as RouteIcon, Trash2, Zap } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui'
import type { PlannedRoute } from '@/lib/types'
import { formatDate, formatDuration } from '@/lib/utils'

export interface SavedRoutesProps {
  routes: PlannedRoute[]
  onDelete: (routeId: string) => void
}

const MAX_STOPS_SHOWN = 2

export function SavedRoutes({ routes, onDelete }: SavedRoutesProps) {
  if (routes.length === 0) {
    return (
      <div className="py-20 text-center">
        <RouteIcon size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No saved routes</p>
        <p className="text-slate-500">Plan and save routes to see them here</p>
        <div className="mt-6">
          <Button href="/routes">Plan a Route</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {routes.map((route) => {
        const shown = route.stops.slice(0, MAX_STOPS_SHOWN)
        const extra = route.stops.length - shown.length

        return (
          <article
            key={route.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-blue-200 hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900">
                {route.origin} &rarr; {route.destination}
              </h3>

              <div className="flex shrink-0 gap-2">
                <Link
                  href="/routes"
                  aria-label={`Open route ${route.origin} to ${route.destination}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-plug-blue-600 transition-colors hover:bg-blue-100"
                >
                  <ExternalLink size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(route.id)}
                  aria-label={`Delete route ${route.origin} to ${route.destination}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="mb-4 mt-4 flex flex-wrap gap-6">
              <span className="flex items-center gap-2">
                <RouteIcon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="font-mono text-sm font-bold text-slate-900">
                  {route.totalDistanceKm} km
                </span>
                <span className="text-xs text-slate-400">Distance</span>
              </span>

              <span className="flex items-center gap-2">
                <Zap size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="font-mono text-sm font-bold text-slate-900">
                  {route.stops.length}
                </span>
                <span className="text-xs text-slate-400">Stops</span>
              </span>

              <span className="flex items-center gap-2">
                <BatteryCharging size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="font-mono text-sm font-bold text-slate-900">
                  {formatDuration(route.totalChargingTimeMinutes)}
                </span>
                <span className="text-xs text-slate-400">Charge Time</span>
              </span>
            </div>

            {shown.length > 0 ? (
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Via:</span>
                {shown.map((stop) => (
                  <span key={stop.station.id} className="text-xs font-medium text-slate-600">
                    {stop.station.name}
                  </span>
                ))}
                {extra > 0 ? (
                  <span className="text-xs text-slate-400">and {extra} more</span>
                ) : null}
              </p>
            ) : null}

            {route.savedAt ? (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={11} aria-hidden="true" />
                Saved {formatDate(route.savedAt)}
              </p>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

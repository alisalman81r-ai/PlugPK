// src/components/dashboard/SavedRoutesList.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui'
import { ArrowRight, Battery, Car, Clock, Route, Trash2, Zap } from '@/components/ui/icons'
import { removeMyRoute } from '@/lib/db/route-actions'

/**
 * The routes this account has saved, newest first.
 *
 * Open re-plans the trip on /routes from what was saved (start, destination,
 * car, battery), so the stops reflect today's chargers rather than the day it
 * was saved. Remove takes the row away at once and writes behind it.
 */

export interface SavedRouteRow {
  id: string
  origin: string
  destination: string
  carId: string | null
  carName: string
  batteryPercent: number
  distanceKm: number
  durationMin: number
  stops: number
  createdAt: string
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m} min`
}

function openHref(route: SavedRouteRow): string {
  const q = new URLSearchParams({ from: route.origin, to: route.destination, battery: String(route.batteryPercent) })
  if (route.carId) q.set('car', route.carId)
  return `/routes?${q.toString()}`
}

export function SavedRoutesList({ routes: saved }: { routes: SavedRouteRow[] }) {
  const [routes, setRoutes] = React.useState(saved)
  React.useEffect(() => setRoutes(saved), [saved])
  const [error, setError] = React.useState<string | null>(null)

  const remove = async (route: SavedRouteRow) => {
    setError(null)
    setRoutes((list) => list.filter((r) => r.id !== route.id))
    const result = await removeMyRoute(route.id).catch(() => null)
    if (!result?.ok) {
      setRoutes((list) => [...list, route].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setError(`Could not remove ${route.origin} → ${route.destination}. Try again.`)
    }
  }

  if (routes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Route size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <p className="text-ui-lg font-semibold text-slate-900">No saved routes yet</p>
        <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
          Plan a trip, then press <span className="font-semibold">Save route</span> at the top of the result to keep it here.
        </p>
        <Link
          href="/routes"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
        >
          Plan a route
        </Link>
      </div>
    )
  }

  return (
    <div>
      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p> : null}
      <ul className="flex flex-col gap-3">
        {routes.map((route) => (
          <li
            key={route.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-ui-lg font-semibold text-slate-900">
                {route.origin} <span className="text-plug-cyan-600">→</span> {route.destination}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Car size={14} className="text-slate-400" aria-hidden="true" />
                  {route.carName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Route size={14} className="text-slate-400" aria-hidden="true" />
                  {route.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" aria-hidden="true" />
                  {formatDuration(route.durationMin)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={14} className="text-slate-400" aria-hidden="true" />
                  {route.stops === 0 ? 'No stops' : `${route.stops} stop${route.stops === 1 ? '' : 's'}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Battery size={14} className="text-slate-400" aria-hidden="true" />
                  Start at {route.batteryPercent}%
                </span>
              </p>
              <p className="mt-1 text-ui-xs text-slate-400">
                Saved {new Date(route.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={openHref(route)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
              >
                Open
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Button
                variant="secondary"
                onClick={() => void remove(route)}
                aria-label={`Remove ${route.origin} to ${route.destination}`}
                leftIcon={<Trash2 size={15} aria-hidden="true" />}
                className="border-slate-200 px-3 text-ui-sm text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

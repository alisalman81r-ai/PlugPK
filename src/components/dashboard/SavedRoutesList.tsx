// src/components/dashboard/SavedRoutesList.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { ActionButton } from '@/components/auth/form-ui'
import { btnClass } from '@/components/v2/ui'
import { ArrowRight, Battery, Car, Clock, Route, Trash2, Zap } from '@/components/ui/icons'
import { removeMyRoute } from '@/lib/db/route-actions'

import { EmptyPanel, ROW } from './dash-ui'

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
      <EmptyPanel
        icon={<Route aria-hidden="true" />}
        title="No saved routes yet"
        body={
          <>
            Plan a trip, then press <span className="font-semibold text-ink">Save route</span> at the top of the result to keep it here.
          </>
        }
        href="/routes"
        cta="Plan a route"
      />
    )
  }

  return (
    <div>
      {error ? <p role="alert" className="mb-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">{error}</p> : null}
      <ul className="flex flex-col gap-3">
        {routes.map((route) => (
          <li
            key={route.id}
            className={`${ROW} flex flex-col gap-4 p-5 transition-shadow hover:shadow-e1 sm:flex-row sm:items-center`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[22px] leading-tight text-ink">
                {route.origin} <span className="text-muted">→</span> {route.destination}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
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
              <p className="mt-1.5 text-[13px] text-muted">
                Saved {new Date(route.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={openHref(route)}
                className={btnClass('ink', 'sm')}
              >
                Open
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <ActionButton
                tone="line"
                size="sm"
                onClick={() => void remove(route)}
                aria-label={`Remove ${route.origin} to ${route.destination}`}
                leftIcon={<Trash2 aria-hidden="true" />}
                className="hover:border-[#FFCDBC] hover:bg-[#FFECE6] hover:text-[#B42E05]"
              >
                Remove
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// src/components/dashboard/SavedRoutesList.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { removeMyRoute } from '@/lib/db/route-actions'
import { cn } from '@/lib/utils'

import { IArrow, IBattery, IBolt, ICar, IClock, IRoute, ITrash } from './acct-icons'
import { abtn, EmptyPanel, ErrorNote, PANEL, ROW } from './dash-ui'

/**
 * The routes this account has saved, newest first (account-routes.html).
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
        icon={<IRoute />}
        title="No saved routes yet."
        body={
          <>
            Plan a trip, then press <b className="font-semibold text-ink">Save route</b> at the top of the result to keep it here.
          </>
        }
        href="/routes"
        cta="Plan a route"
      />
    )
  }

  return (
    <section className={PANEL}>
      {error ? <ErrorNote className="mb-4">{error}</ErrorNote> : null}
      <ul className="m-0 grid list-none gap-3 p-0">
        {routes.map((route) => (
          <li key={route.id} className={cn(ROW, 'flex flex-col gap-4 sm:flex-row sm:items-center')}>
            <div className="min-w-0 flex-1">
              <b className="block truncate font-display text-[22px] font-normal leading-[1.15] text-ink">
                {route.origin} <span className="text-muted">→</span> {route.destination}
              </b>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ICar size={14} /> {route.carName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IRoute size={14} /> {route.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IClock size={14} /> {formatDuration(route.durationMin)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IBolt size={14} /> {route.stops === 0 ? 'No stops' : `${route.stops} stop${route.stops === 1 ? '' : 's'}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IBattery size={14} /> Start at {route.batteryPercent}%
                </span>
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                Saved {new Date(route.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link href={openHref(route)} className={cn(abtn('ink', 'sm'), 'group/open')}>
                <span>Open</span>
                <IArrow className="transition-transform duration-[350ms] ease-spring group-hover/open:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => void remove(route)}
                aria-label={`Remove ${route.origin} to ${route.destination}`}
                className={abtn('plain', 'sm')}
              >
                <ITrash />
                <span>Remove</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

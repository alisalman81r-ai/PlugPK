// src/components/dashboard/SavedStations.tsx
'use client'

import { Bookmark, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import { toggleSavedStation } from '@/lib/db/session-actions'
import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The listings this account has bookmarked.
 *
 * The list arrives from the server already resolved, and unsaving writes
 * through rather than filtering a local array — previously the bookmark was
 * React state on both ends, so removing one here and reloading brought it
 * straight back.
 */

export interface SavedStationsProps {
  stations: Station[]
}

type SortKey = 'name' | 'rating'

export function SavedStations({ stations }: SavedStationsProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortKey>('name')
  const [removing, setRemoving] = React.useState<string | null>(null)

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? stations.filter(
          (station) =>
            station.name.toLowerCase().includes(needle) ||
            station.address.city.toLowerCase().includes(needle),
        )
      : stations

    return [...filtered].sort((a, b) =>
      sortBy === 'rating' ? b.rating - a.rating : a.name.localeCompare(b.name),
    )
  }, [stations, query, sortBy])

  const handleUnsave = async (id: string) => {
    setRemoving(id)
    await toggleSavedStation(id)
    // The list is server-rendered, so the page is asked to re-read rather than
    // the row being hidden locally and the two drifting apart.
    router.refresh()
    setRemoving(null)
  }

  if (stations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Bookmark size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
        <p className="text-ui-lg font-semibold text-slate-900">Nothing saved yet</p>
        <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
          Open any station and press the bookmark to keep it here.
        </p>
        <Link
          href="/map"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
        >
          Find stations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your saved stations"
            aria-label="Search saved stations"
            className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500"
          />
        </div>

        {(['name', 'rating'] as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            aria-pressed={sortBy === key}
            className={cn(
              'h-11 rounded-xl px-4 text-ui-sm font-medium transition-colors',
              sortBy === key
                ? 'bg-plug-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {key === 'name' ? 'By name' : 'By rating'}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-ui-sm text-slate-500">
          Nothing matches “{query}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((station) => (
            <li
              key={station.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Link href={`/station/${station.slug}`} className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">{station.name}</span>
                <span className="mt-0.5 block truncate text-ui-sm text-slate-500">
                  {station.address.street ? `${station.address.street}, ` : ''}
                  {station.address.city}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-3">
                  <RatingStars rating={station.rating} size="sm" showNumber />
                  <span className="text-ui-xs text-slate-400">
                    {station.connectors.length} charger
                    {station.connectors.length === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => handleUnsave(station.id)}
                disabled={removing === station.id}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-ui-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Bookmark size={14} className="shrink-0 fill-current" aria-hidden="true" />
                {removing === station.id ? 'Removing' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

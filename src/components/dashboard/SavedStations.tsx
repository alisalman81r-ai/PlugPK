// src/components/dashboard/SavedStations.tsx
'use client'

import { Bookmark, Search } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Button, RatingStars } from '@/components/ui'
import { toggleSavedStation } from '@/lib/db/session-actions'
import type { Station } from '@/lib/types'

/**
 * The listings this account has bookmarked.
 *
 * The list arrives from the server already resolved, and unsaving writes
 * through to the account — previously the bookmark was React state on both
 * ends, so removing one here and reloading brought it straight back.
 *
 * Remove takes the row away at once and writes behind it. Waiting for the
 * write and a page refresh first meant several seconds of "Removing" on a
 * database a region away; if the write fails, the row comes back.
 *
 * Sorted by name. The By name / By rating toggle was dropped: a short personal
 * list is found by name or by the search box.
 */

export interface SavedStationsProps {
  stations: Station[]
}

export function SavedStations({ stations: saved }: SavedStationsProps) {
  const [stations, setStations] = React.useState(saved)
  React.useEffect(() => setStations(saved), [saved])
  const [query, setQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? stations.filter(
          (station) =>
            station.name.toLowerCase().includes(needle) ||
            station.address.city.toLowerCase().includes(needle),
        )
      : stations

    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [stations, query])

  const handleUnsave = async (station: Station) => {
    setError(null)
    setStations((list) => list.filter((s) => s.id !== station.id))
    const result = await toggleSavedStation(station.id).catch(() => null)
    // toggle: `saved: true` would mean it was re-added, i.e. it was not saved.
    if (!result?.ok || result.saved) {
      setStations((list) => (list.some((s) => s.id === station.id) ? list : [...list, station]))
      setError(`Could not remove ${station.name}. Try again.`)
    }
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

      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p> : null}

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

              <Button
                variant="secondary"
                onClick={() => handleUnsave(station)}
                aria-label={`Remove ${station.name} from saved stations`}
                leftIcon={<Bookmark size={14} className="shrink-0 fill-current" aria-hidden="true" />}
                className="shrink-0 border-slate-200 text-ui-sm text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// src/components/dashboard/SavedStations.tsx
'use client'

import { Bookmark, Search } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { ActionButton } from '@/components/auth/form-ui'
import { RatingStars } from '@/components/ui'
import { toggleSavedStation } from '@/lib/db/session-actions'
import type { Station } from '@/lib/types'

import { EmptyPanel, ROW } from './dash-ui'

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
      <EmptyPanel
        icon={<Bookmark aria-hidden="true" />}
        title="Nothing saved yet"
        body="Open any station and press the bookmark to keep it here."
        href="/map"
        cta="Find stations"
      />
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your saved stations"
            aria-label="Search saved stations"
            className="h-[54px] w-full rounded-full border-[1.5px] border-ink/10 bg-white pl-11 pr-5 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-fog focus:border-ink focus:shadow-focus"
          />
        </div>

      </div>

      {error ? <p role="alert" className="mb-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">{error}</p> : null}

      {visible.length === 0 ? (
        <p className="rounded-3xl border-[1.5px] border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center text-[15px] text-muted">
          Nothing matches “{query}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((station) => (
            <li
              key={station.id}
              className={`${ROW} flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-e1`}
            >
              <Link href={`/station/${station.slug}`} className="min-w-0 flex-1">
                <span className="block truncate font-display text-[20px] leading-tight text-ink">{station.name}</span>
                <span className="mt-1 block truncate text-sm text-muted">
                  {station.address.street ? `${station.address.street}, ` : ''}
                  {station.address.city}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-3">
                  <RatingStars rating={station.rating} size="sm" showNumber />
                  <span className="font-mono text-xs text-muted">
                    {station.connectors.length} charger
                    {station.connectors.length === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>

              <ActionButton
                tone="line"
                size="sm"
                onClick={() => handleUnsave(station)}
                aria-label={`Remove ${station.name} from saved stations`}
                leftIcon={<Bookmark className="shrink-0 fill-current" aria-hidden="true" />}
                className="shrink-0 hover:border-[#FFCDBC] hover:bg-[#FFECE6] hover:text-[#B42E05]"
              >
                Remove
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

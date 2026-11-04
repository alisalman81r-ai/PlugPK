// src/components/dashboard/SavedStations.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import { toggleSavedStation } from '@/lib/db/session-actions'
import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'

import { IBookmark, ISearch } from './acct-icons'
import { abtn, AIN, EmptyPanel, ErrorNote, PANEL, ROW } from './dash-ui'

/**
 * The listings this account has bookmarked (account-saved.html).
 *
 * Empty, it is the design's dashed state with one way forward. With stations,
 * a search field and one panel of paper rows, sorted by name.
 *
 * Remove takes the row away at once and writes behind it; if the write fails
 * the row comes back with a message.
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
      ? stations.filter((s) => s.name.toLowerCase().includes(needle) || s.address.city.toLowerCase().includes(needle))
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
        icon={<IBookmark />}
        title="Nothing saved yet."
        body="Open any station and press the bookmark to keep it here."
        href="/map"
        cta="Find stations"
      />
    )
  }

  return (
    <section className={PANEL}>
      <div className="relative">
        <ISearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your saved stations"
          aria-label="Search saved stations"
          className={cn(AIN, 'pl-11')}
        />
      </div>

      {error ? <ErrorNote className="mt-4">{error}</ErrorNote> : null}

      {visible.length === 0 ? (
        <p className="mt-4 rounded-[18px] border-[1.5px] border-dashed border-ink/[0.14] bg-paper px-5 py-[30px] text-center text-[15px] text-muted">
          Nothing matches “{query}”.
        </p>
      ) : (
        <ul className="m-0 mt-4 grid list-none gap-3 p-0">
          {visible.map((station) => (
            <li key={station.id} className={cn(ROW, 'flex flex-wrap items-center justify-between gap-4')}>
              <Link href={`/station/${station.slug}`} className="group/st min-w-0 flex-1 focus-visible:outline-none">
                <b className="block truncate font-display text-[20px] font-normal leading-[1.15] text-ink decoration-volt decoration-2 underline-offset-4 group-hover/st:underline group-focus-visible/st:underline">
                  {station.name}
                </b>
                <span className="mt-1 block truncate text-[13px] text-muted">
                  {station.address.street ? `${station.address.street}, ` : ''}
                  {station.address.city}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-3">
                  <RatingStars rating={station.rating} size="sm" showNumber />
                  <span className="font-mono text-xs text-muted">
                    {station.connectors.length} charger{station.connectors.length === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => void handleUnsave(station)}
                aria-label={`Remove ${station.name} from saved stations`}
                className={abtn('line', 'sm', 'hover:border-[#FFCDBC] hover:bg-[#FFECE6] hover:text-[#B42E05]')}
              >
                <IBookmark />
                <span>Remove</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// src/components/partners/PartnerList.tsx
'use client'

import { Globe, MapPin, Phone, Search, Zap } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { RatingStars } from '@/components/ui'
import type { PartnerRow } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The partner directory, with its filters.
 *
 * Filtering runs in the browser over the full list: it searches name, city and
 * address together, and a round trip per keystroke to do that would be slower
 * than this list is long for any realistic number of partners.
 */

export interface PartnerListProps {
  partners: PartnerRow[]
}

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  mall: 'Shopping mall',
  office: 'Office',
  dealership: 'Dealership',
  'service-center': 'Service centre',
  home: 'Home charger',
}

type SortKey = 'newest' | 'power' | 'rating'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'power', label: 'Fastest' },
  { key: 'rating', label: 'Best rated' },
]

const SELECT =
  'h-11 cursor-pointer rounded-xl border-[1.5px] border-slate-200 bg-white px-3 text-ui-sm text-slate-700 outline-none transition-colors focus:border-plug-blue-500'

export function PartnerList({ partners }: PartnerListProps) {
  const [query, setQuery] = React.useState('')
  const [city, setCity] = React.useState('all')
  const [type, setType] = React.useState('all')
  const [sortBy, setSortBy] = React.useState<SortKey>('newest')

  // Only the cities and types actually represented. A dropdown offering
  // filters that return nothing is worse than a shorter dropdown.
  const cities = React.useMemo(
    () => [...new Set(partners.map((partner) => partner.city))].sort((a, b) => a.localeCompare(b)),
    [partners],
  )
  const types = React.useMemo(
    () => [...new Set(partners.map((partner) => partner.type))],
    [partners],
  )

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    let rows = partners
    if (needle) {
      rows = rows.filter((partner) =>
        [partner.name, partner.city, partner.address ?? '']
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    }
    if (city !== 'all') rows = rows.filter((partner) => partner.city === city)
    if (type !== 'all') rows = rows.filter((partner) => partner.type === type)

    return [...rows].sort((a, b) => {
      if (sortBy === 'power') return b.maxPowerKw - a.maxPowerKw
      if (sortBy === 'rating') {
        // Unrated partners sort last rather than tying with a genuine zero.
        if (a.reviewCount === 0 && b.reviewCount === 0) return 0
        if (a.reviewCount === 0) return 1
        if (b.reviewCount === 0) return -1
        return b.rating - a.rating
      }
      return b.joinedAt.localeCompare(a.joinedAt)
    })
  }, [partners, query, city, type, sortBy])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
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
            placeholder="Search partners by name, city or address"
            aria-label="Search partners"
            className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-ui text-slate-900 outline-none transition-colors focus:border-plug-blue-500"
          />
        </div>

        <select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          aria-label="Filter by city"
          className={SELECT}
        >
          <option value="all">All cities</option>
          {cities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label="Filter by type"
          className={SELECT}
        >
          <option value="all">All types</option>
          {types.map((option) => (
            <option key={option} value={option}>
              {TYPE_LABEL[option] ?? option}
            </option>
          ))}
        </select>

        {SORTS.map((sort) => (
          <button
            key={sort.key}
            type="button"
            onClick={() => setSortBy(sort.key)}
            aria-pressed={sortBy === sort.key}
            className={cn(
              'h-11 rounded-xl px-4 text-ui-sm font-medium transition-colors',
              sortBy === sort.key
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {visible.length !== partners.length ? (
        <p className="mb-4 text-ui-sm text-slate-500">
          Showing {visible.length} of {partners.length}.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-ui-sm text-slate-500">
          No partner matches that.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((partner) => (
            <li key={partner.id}>
              <Link
                href={`/station/${partner.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-card-hover"
              >
                {/* The host's charger photo when there is one, otherwise a
                    slim brand strip: filling the same 160px with empty grey
                    made every unphotographed partner look like a broken card
                    rather than a plain one.

                    A plain img rather than next/image — user uploads of
                    unknown dimensions, and the optimizer earns little on a
                    card thumbnail. */}
                {partner.photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={partner.photo} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="block h-1.5 w-full bg-gradient-brand" />
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="font-bold text-slate-900 group-hover:text-plug-blue-700">
                      {partner.name}
                    </h2>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-ui-xs font-semibold text-plug-blue-700">
                      {TYPE_LABEL[partner.type] ?? partner.type}
                    </span>
                  </div>

                  <p className="mb-3 inline-flex items-start gap-1.5 text-ui-sm text-slate-500">
                    <MapPin
                      size={13}
                      className="mt-0.5 shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2">
                      {partner.address ? `${partner.address}, ` : ''}
                      {partner.city}
                    </span>
                  </p>

                  {partner.description ? (
                    <p className="mb-3 line-clamp-2 text-ui-sm text-slate-600">
                      {partner.description}
                    </p>
                  ) : null}

                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-ui-xs font-semibold text-slate-700">
                      <Zap size={11} aria-hidden="true" />
                      {partner.maxPowerKw > 0 ? `${partner.maxPowerKw}kW` : 'Power not stated'}
                    </span>
                    {partner.connectorTypes.map((connector) => (
                      <span
                        key={connector}
                        className="rounded-lg border border-slate-200 px-2 py-1 font-mono text-ui-xs text-slate-600"
                      >
                        {connector}
                      </span>
                    ))}
                  </div>

                  <p className="mb-4 text-ui-sm text-slate-500">
                    {partner.chargerCount} charger{partner.chargerCount === 1 ? '' : 's'} ·{' '}
                    {partner.portCount} port{partner.portCount === 1 ? '' : 's'}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    {partner.reviewCount > 0 ? (
                      <RatingStars
                        rating={partner.rating}
                        reviewCount={partner.reviewCount}
                        size="sm"
                        showNumber
                        showCount
                      />
                    ) : (
                      <span className="text-ui-xs text-slate-400">No reviews yet</span>
                    )}

                    <span className="flex items-center gap-2">
                      {partner.phone ? (
                        <Phone size={13} className="text-slate-300" aria-label="Phone listed" />
                      ) : null}
                      {partner.website ? (
                        <Globe size={13} className="text-slate-300" aria-label="Website listed" />
                      ) : null}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

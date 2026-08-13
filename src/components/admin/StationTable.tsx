// src/components/admin/StationTable.tsx
'use client'

import { ExternalLink, Pencil, Search, SearchX, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { Station } from '@/lib/types'
import { cn, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationTableProps {
  stations: Station[]
  /** Bound per-row by the server component that renders this. */
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>
}

type StatusFilter = 'all' | 'available' | 'limited' | 'offline' | 'unknown'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'offline', label: 'Offline' },
]

/**
 * Filtering runs on the client over an already-loaded list.
 *
 * At this scale that is the right call: the whole estate is a few dozen rows,
 * so a round trip per keystroke would add latency to answer a question the
 * browser can answer instantly. If the network grows past a few hundred
 * stations this moves to a server query with the same props.
 */
export function StationTable({ stations, onDelete }: StationTableProps) {
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<StatusFilter>('all')

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    return stations.filter((station) => {
      if (status !== 'all' && station.status !== status) return false
      if (!needle) return true
      return [station.name, station.address.city, station.address.area, station.network, station.slug]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [stations, query, status])

  const isFiltered = query.trim().length > 0 || status !== 'all'

  const clear = () => {
    setQuery('')
    setStatus('all')
  }

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, city, area or network"
            aria-label="Search stations"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-ui text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              aria-pressed={status === option.value}
              className={cn(
                'h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-ui-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                status === option.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count and reset, announced so the change is not silent. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="text-ui-sm text-slate-600">
          {filtered.length} of {stations.length} station{stations.length === 1 ? '' : 's'}
        </p>
        {isFiltered ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-ui-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            <X size={12} aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <SearchX size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <p className="text-ui font-semibold text-slate-900">No stations match</p>
          <p className="mt-1 text-ui-sm text-slate-500">
            {stations.length === 0
              ? 'Add a station to publish it to the map.'
              : 'Try a different search or clear the status filter.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-ui-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Station</th>
                  <th scope="col" className="px-5 py-3 font-semibold">City</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Ports</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Peak</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((station) => {
                  const ports = getPortAvailability(station)
                  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

                  return (
                    <tr
                      key={station.id}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{station.name}</p>
                        <p className="mt-0.5 font-mono text-ui-xs text-slate-500">{station.slug}</p>
                      </td>
                      <td className="px-5 py-3.5 text-ui-sm text-slate-700">
                        {station.address.city}
                      </td>
                      <td className="px-5 py-3.5">
                        <AdminStatusBadge status={station.status} />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui-sm tabular-nums text-slate-700">
                        {ports.available}/{ports.total}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-ui-sm tabular-nums text-slate-700">
                        {maxPower > 0 ? `${maxPower} kW` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/station/${station.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${station.name} on the live site`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <Link
                            href={`/admin/stations/${station.id}`}
                            aria-label={`Edit ${station.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            <Pencil size={15} />
                          </Link>
                          <DeleteButton
                            label={station.name}
                            action={async () => onDelete(station.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — six columns do not fit 320px, and a horizontal
              scroll buries the actions off-screen. */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {filtered.map((station) => {
              const ports = getPortAvailability(station)
              const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

              return (
                <li key={station.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{station.name}</p>
                      <p className="mt-0.5 text-ui-xs text-slate-500">{station.address.city}</p>
                    </div>
                    <AdminStatusBadge status={station.status} />
                  </div>

                  <dl className="mb-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                    <div>
                      <dt className="text-ui-xs text-slate-500">Ports free</dt>
                      <dd className="mt-0.5 font-mono text-ui-sm tabular-nums text-slate-900">
                        {ports.available}/{ports.total}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ui-xs text-slate-500">Peak power</dt>
                      <dd className="mt-0.5 font-mono text-ui-sm tabular-nums text-slate-900">
                        {maxPower > 0 ? `${maxPower} kW` : '—'}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/stations/${station.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-ui-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit
                    </Link>
                    <Link
                      href={`/station/${station.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${station.name} on the live site`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <DeleteButton label={station.name} action={async () => onDelete(station.id)} />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

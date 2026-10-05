// src/components/admin/StationTable.tsx
'use client'

import { AlertTriangle, ExternalLink, Pencil, SearchX, X } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { Station } from '@/lib/types'
import { cn, getMaxPower, getPortAvailability } from '@/lib/utils'

import { AdminSearch } from './AdminSearch'
import { buildHref, flattenParams } from './list-params'
import { STATUS_FILTERS, VENUE_FILTERS, type StatusFilter, type VenueFilter } from './station-filters'

export interface StationTableProps {
  /** One page of stations, already filtered by the server. */
  stations: Station[]
  /** Rows matching the filter across every page. */
  total: number
  /** Tallies across the whole network, for the chips. */
  counts: { all: number; status: Record<string, number>; venue: Record<string, number> }
  status: StatusFilter
  venue: VenueFilter
  /** Bound per-row by the server component that renders this. */
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>
}

/**
 * The connector types a station offers, each named once.
 *
 * Deduped because a station commonly carries several connectors of one type,
 * and repeating the word tells a reader nothing the count beside it does not.
 */
function connectorTypes(station: Station): string[] {
  return [...new Set(station.connectors.map((connector) => connector.type))]
}

const CHIP =
  'group/chip inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-ui-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500'

/**
 * Filtering now happens in the database: search, status and venue are URL
 * parameters the stations page reads, and this table renders the page it was
 * given. The chips are links, and each carries its count across the whole
 * network so a tally never moves when an unrelated chip is pressed.
 */
export function StationTable({ stations, total, counts, status, venue, onDelete }: StationTableProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = flattenParams(Object.fromEntries(searchParams.entries()))
  const q = params.q ?? ''

  const filtered = stations
  const isFiltered = q.trim().length > 0 || status !== 'all' || venue !== 'all'

  const chip = (on: boolean) => cn(CHIP, on ? 'bg-plug-navy-900 text-white' : 'text-slate-800 hover:bg-slate-100')
  const tally = (on: boolean, n: number) =>
    cn(
      'rounded px-1 text-[11px] tabular-nums',
      on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover/chip:bg-slate-200',
      !on && n === 0 && 'bg-slate-100/70 text-slate-400',
    )

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(5,36,30,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AdminSearch placeholder="Search name, city, area, network or connector" label="Search stations" />

          <div role="group" aria-label="Filter by status" className="flex min-w-0 flex-wrap items-center gap-1">
            {STATUS_FILTERS.map((option) => {
              const n = option.value === 'all' ? counts.all : (counts.status[option.value] ?? 0)
              const on = status === option.value
              return (
                <Link
                  key={option.value}
                  href={buildHref(pathname, params, { status: option.value })}
                  scroll={false}
                  aria-current={on ? 'true' : undefined}
                  className={chip(on)}
                >
                  {option.label}
                  <span className={tally(on, n)}>{n}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 lg:flex-row lg:items-start">
          <span className="inline-flex h-8 shrink-0 items-center text-ui-xs font-semibold uppercase tracking-[0.08em] text-slate-900">
            Venue
          </span>

          <div role="group" aria-label="Filter by venue" className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {VENUE_FILTERS.map((option) => {
              const n = option.value === 'all' ? counts.all : (counts.venue[option.value] ?? 0)
              const on = venue === option.value
              return (
                <Link
                  key={option.value}
                  href={buildHref(pathname, params, { venue: option.value })}
                  scroll={false}
                  aria-current={on ? 'true' : undefined}
                  className={chip(on)}
                >
                  {option.label}
                  <span className={tally(on, n)}>{n}</span>
                </Link>
              )
            })}
          </div>

          {/*
            Unset, pulled out and given weight: it is the work outstanding, not
            a venue. Amber because that is what the rest of this portal paints
            amber — not broken, waiting on somebody. It disappears at zero.
          */}
          {(counts.venue.other ?? 0) > 0 ? (
            <Link
              href={buildHref(pathname, params, { venue: venue === 'other' ? 'all' : 'other' })}
              scroll={false}
              aria-current={venue === 'other' ? 'true' : undefined}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-lg border px-2.5 text-ui-sm font-semibold transition-colors lg:self-auto',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                venue === 'other'
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
              )}
            >
              <AlertTriangle size={13} aria-hidden="true" />
              Venue not set
              <span
                className={cn(
                  'rounded px-1 text-[11px] tabular-nums',
                  venue === 'other' ? 'bg-white/25 text-white' : 'bg-amber-200/70 text-amber-900',
                )}
              >
                {counts.venue.other}
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Result count and reset, announced so the change is not silent. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="text-ui-sm text-slate-600">
          {total} of {counts.all} station{counts.all === 1 ? '' : 's'}
        </p>
        {isFiltered ? (
          <Link
            href={pathname}
            scroll={false}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-ui-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            <X size={12} aria-hidden="true" />
            Clear filters
          </Link>
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
          {/*
            Desktop table.

            overflow-x-auto, not overflow-hidden. Eight columns need 886px and
            the content column is 710 at 1024, so `hidden` was silently cutting
            off Peak and the edit and delete buttons with no way to reach them —
            the row was there, the controls were not. Scrolling shows an edge;
            clipping shows a lie.
          */}
          <div className="relative hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-ui-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Station</th>
                  <th scope="col" className="px-5 py-3 font-semibold">City</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Venue</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Connectors</th>
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
                      <td className="px-5 py-3.5 text-ui-sm">
                        {/* `Unset` rather than a blank cell or a guess: six real
                            stations sit here, and the operator needs to see
                            which ones still need a venue chosen. */}
                        {station.venueType && station.venueType !== 'other' ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-ui-xs font-medium capitalize text-slate-700">
                            {station.venueType.replace('-', ' ')}
                          </span>
                        ) : (
                          <span className="text-ui-xs text-slate-400">Unset</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <AdminStatusBadge status={station.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {station.connectors.length === 0 ? (
                          <span className="text-ui-xs text-slate-400">None</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {connectorTypes(station).map((type) => (
                              <span
                                key={type}
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700"
                              >
                                {type}
                              </span>
                            ))}
                            <span className="ml-0.5 text-ui-xs tabular-nums text-slate-400">
                              ({station.connectors.length})
                            </span>
                          </div>
                        )}
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
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-plug-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            <Pencil size={15} />
                          </Link>
                          <DeleteButton
                            label={station.name}
                            consequence={`its ${station.connectors.length} connector${station.connectors.length === 1 ? '' : 's'}, its reviews and any member bookmarks`}
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
                    <div className="col-span-2">
                      <dt className="text-ui-xs text-slate-500">Connectors</dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-1">
                        {station.connectors.length === 0 ? (
                          <span className="text-ui-xs text-slate-400">None</span>
                        ) : (
                          connectorTypes(station).map((type) => (
                            <span
                              key={type}
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700"
                            >
                              {type}
                            </span>
                          ))
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/stations/${station.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-plug-navy-900 px-3 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
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
                    <DeleteButton
                      label={station.name}
                      consequence={`its ${station.connectors.length} connector${station.connectors.length === 1 ? '' : 's'}, its reviews and any member bookmarks`}
                      action={async () => onDelete(station.id)}
                    />
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

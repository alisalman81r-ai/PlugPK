// src/components/admin/StationTable.tsx
'use client'

import { AlertTriangle, ExternalLink, Pencil, Search, SearchX, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type {
  VenueType, Station } from '@/lib/types'
import { cn, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationTableProps {
  stations: Station[]
  /** Bound per-row by the server component that renders this. */
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>
}

type StatusFilter = 'all' | 'available' | 'limited' | 'offline' | 'unknown'

/**
 * Where a charger sits, as a filter.
 *
 * Reads Station.venueType, a stored column — not guessed from amenities.
 * Amenities record what is NEAR a charger; a station listing a restaurant may
 * stand in a mall car park, and filing it under Restaurants on that basis
 * would put stations under headings nobody chose for them.
 *
 * Every station that predates the column reads `other`, which is why that
 * option is here rather than hidden: it is where six real stations currently
 * sit, and an operator needs to find them to set a venue.
 */
type VenueFilter = 'all' | VenueType

const VENUE_FILTERS: { value: VenueFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'mall', label: 'Malls' },
  { value: 'office', label: 'Offices' },
  { value: 'dealership', label: 'Dealerships' },
  { value: 'service-center', label: 'Service centres' },
  { value: 'home', label: 'Homes' },
]

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
/**
 * The connector types a station offers, each named once.
 *
 * Deduped because a station commonly carries several connectors of one type —
 * Mall Road EV Hub has two CCS2 units and a third listed separately — and
 * repeating the word tells a reader nothing the count beside it does not.
 * First-seen order is kept rather than sorted alphabetically, so the list
 * reads the way the station was entered.
 */
function connectorTypes(station: Station): string[] {
  return [...new Set(station.connectors.map((connector) => connector.type))]
}

export function StationTable({ stations, onDelete }: StationTableProps) {
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<StatusFilter>('all')
  const [venue, setVenue] = React.useState<VenueFilter>('all')

  /*
    How many rows sit behind each chip.

    Counted from the loaded list rather than written down, so a chip can never
    promise rows it does not have. This is what makes the row worth reading
    before it is clicked: Offices reading 0 saves the click, and Unset reading
    6 is the state of the whole estate at a glance.

    Each group counts the full list, so a tally never moves when an unrelated
    chip is pressed — a number that shifted under you would be unreadable.
  */
  const counts = React.useMemo(() => {
    const status: Record<string, number> = {}
    const venue: Record<string, number> = {}
    for (const station of stations) {
      status[station.status] = (status[station.status] ?? 0) + 1
      const key = station.venueType ?? 'other'
      venue[key] = (venue[key] ?? 0) + 1
    }
    return { status, venue }
  }, [stations])

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    return stations.filter((station) => {
      if (status !== 'all' && station.status !== status) return false
      // Undefined means the row did not come from the database (a legacy
      // fixture, or a Business shaped into a Station), so it reads as `other`.
      if (venue !== 'all' && (station.venueType ?? 'other') !== venue) return false
      if (!needle) return true
      // Connector types are searchable because they are now on the face of the
      // row: once a reader can see CCS2, typing it is the next thing they try,
      // and a search that ignored a visible column would read as broken.
      return [
        station.name,
        station.address.city,
        station.address.area,
        station.network,
        station.slug,
        ...connectorTypes(station),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [stations, query, status, venue])

  const isFiltered = query.trim().length > 0 || status !== 'all' || venue !== 'all'

  const clear = () => {
    setQuery('')
    setStatus('all')
  }

  return (
    <div>
      {/*
        ── One card, not three loose bars ───────────────────────────────

        Search, status and venue were three separate bordered strips stacked
        down the page, which read as three unrelated controls that happened
        to sit together. They are one question — which stations am I looking
        at — so they share one surface, with the groups named.

        Every chip carries its own count, read from the rows actually loaded.
        A filter row that shows what it will find before you press it is the
        difference between a control panel and a set of buttons.
      */}
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
              placeholder="Search name, city, area, network or connector"
              aria-label="Search stations"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-ui text-slate-900 outline-none transition-[border-color,background-color] placeholder:text-slate-400 focus-visible:border-plug-blue-400 focus-visible:bg-white"
            />
          </div>

          {/* Wraps rather than scrolls. A chip row that scrolls sideways hides
              options behind an edge with no affordance — at 1024 that put half
              the venues out of reach. Wrapping costs a line and hides nothing. */}
          <div role="group" aria-label="Filter by status" className="flex min-w-0 flex-wrap items-center gap-1">
            {STATUS_FILTERS.map((option) => {
              const n = option.value === 'all' ? stations.length : (counts.status[option.value] ?? 0)
              const on = status === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  aria-pressed={on}
                  className={cn(
                    'group/chip inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-ui-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                    on ? 'bg-plug-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                    !on && n === 0 && 'text-slate-300',
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      'rounded px-1 text-[11px] tabular-nums',
                      on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover/chip:bg-slate-200',
                      !on && n === 0 && 'bg-slate-50 text-slate-300',
                    )}
                  >
                    {n}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 lg:flex-row lg:items-center">
          <span className="shrink-0 text-ui-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            Venue
          </span>

          <div role="group" aria-label="Filter by venue" className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {VENUE_FILTERS.map((option) => {
              const n = option.value === 'all' ? stations.length : (counts.venue[option.value] ?? 0)
              const on = venue === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVenue(option.value)}
                  aria-pressed={on}
                  className={cn(
                    'group/chip inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-ui-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
                    on ? 'bg-plug-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                    !on && n === 0 && 'text-slate-300',
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      'rounded px-1 text-[11px] tabular-nums',
                      on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover/chip:bg-slate-200',
                      !on && n === 0 && 'bg-slate-50 text-slate-300',
                    )}
                  >
                    {n}
                  </span>
                </button>
              )
            })}
          </div>

          {/*
            Unset, pulled out and given weight.

            It is not a venue, so it does not belong among them — it is the
            work outstanding, and right now it is where every station sits.
            Amber because that is what the rest of this portal paints amber:
            not broken, waiting on somebody.

            It disappears at zero. A prominent control that always reads 0 is
            noise, and its absence is the signal that the job is done.
          */}
          {(counts.venue.other ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => setVenue(venue === 'other' ? 'all' : 'other')}
              aria-pressed={venue === 'other'}
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
            </button>
          ) : null}
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
          {/*
            Desktop table.

            overflow-x-auto, not overflow-hidden. Eight columns need 886px and
            the content column is 710 at 1024, so `hidden` was silently cutting
            off Peak and the edit and delete buttons with no way to reach them —
            the row was there, the controls were not. Scrolling shows an edge;
            clipping shows a lie.
          */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
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

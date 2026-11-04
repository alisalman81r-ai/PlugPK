// src/components/admin/StationTable.tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { DeleteButton } from '@/components/admin/DeleteButton'
import type { Station } from '@/lib/types'
import { cn, getMaxPower, getPortAvailability } from '@/lib/utils'

import { AdminSearch } from './AdminSearch'
import { buildHref, flattenParams } from './list-params'
import {
  ACT,
  ChipLinks,
  CON_TAG,
  COUNT,
  Empty,
  Ico,
  Kw,
  PortBar,
  SegLinks,
  SNAME,
  SSUB,
  StatusPill,
  T,
  TOOLS,
  TOOLS_ROW,
  VTAG,
  rise,
} from './network-kit'
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

/** A venue slug as the chips name it, singular: "service-center" → "Service centre". */
function venueLabel(venue: string): string {
  const option = VENUE_FILTERS.find((item) => item.value === venue)
  if (!option) return venue.replace(/-/g, ' ')
  return option.label.replace(/s$/, '')
}

/**
 * Filtering happens in the database: search, status and venue are URL
 * parameters the stations page reads, and this table renders the page it was
 * given. The filters are links, and each carries its count across the whole
 * network so a tally never moves when an unrelated filter is pressed.
 *
 * One table at every width: below 760px each row folds into a labelled card
 * (see T in network-kit), so the edit and delete controls are never scrolled
 * off-screen.
 */
export function StationTable({ stations, total, counts, status, venue, onDelete }: StationTableProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = flattenParams(Object.fromEntries(searchParams.entries()))
  const q = params.q ?? ''
  const isFiltered = q.trim().length > 0 || status !== 'all' || venue !== 'all'
  const unset = counts.venue.other ?? 0

  return (
    <div>
      <div {...rise(1)} className={TOOLS}>
        <div className={TOOLS_ROW}>
          <AdminSearch placeholder="Search name, city, area, network or connector" label="Search stations" />
          <SegLinks
            label="Filter by status"
            current={status}
            options={STATUS_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
              count: option.value === 'all' ? counts.all : (counts.status[option.value] ?? 0),
              href: buildHref(pathname, params, { status: option.value, page: undefined }),
            }))}
          />
        </div>

        <ChipLinks
          label="Filter by venue"
          lab="Venue"
          current={venue}
          options={VENUE_FILTERS.map((option) => ({
            value: option.value,
            label: option.label,
            count: option.value === 'all' ? counts.all : (counts.venue[option.value] ?? 0),
            href: buildHref(pathname, params, { venue: option.value, page: undefined }),
          }))}
        >
          {/*
            Unset, pulled out and given weight: it is the work outstanding, not
            a venue. Amber because that is what the rest of this portal paints
            amber — not broken, waiting on somebody. It disappears at zero.
          */}
          {unset > 0 ? (
            <Link
              href={buildHref(pathname, params, { venue: venue === 'other' ? 'all' : 'other', page: undefined })}
              scroll={false}
              aria-current={venue === 'other' ? 'true' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium no-underline transition-colors duration-200 [&_svg]:h-[15px] [&_svg]:w-[15px]',
                venue === 'other'
                  ? 'border-[#8a5a00] bg-[#8a5a00] text-white'
                  : 'border-[rgba(255,176,32,.45)] bg-[rgba(255,176,32,.12)] text-[#8a5a00] hover:border-[#8a5a00]',
              )}
            >
              <Ico name="alert" />
              Venue not set
              <span
                className={cn(
                  'min-w-[22px] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold leading-[1.3]',
                  venue === 'other' ? 'bg-volt text-ink' : 'bg-[rgba(255,176,32,.25)]',
                )}
              >
                {unset}
              </span>
            </Link>
          ) : null}
        </ChipLinks>
      </div>

      {/* Result count and reset, announced so the change is not silent. */}
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className={COUNT}>
          {total} of {counts.all} station{counts.all === 1 ? '' : 's'}
        </p>
        {isFiltered ? (
          <Link
            href={pathname}
            scroll={false}
            className="-mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink no-underline transition-colors hover:text-volt-ink [&_svg]:h-4 [&_svg]:w-4"
          >
            <Ico name="x" />
            Clear filters
          </Link>
        ) : null}
      </div>

      <div {...rise(2)} className={T.wrap}>
        <table className={T.table}>
          <thead className={T.thead}>
            <tr>
              <th scope="col" className={T.th}>Station</th>
              <th scope="col" className={T.th}>Venue</th>
              <th scope="col" className={T.th}>Status</th>
              <th scope="col" className={T.th}>Connectors</th>
              <th scope="col" className={T.th}>Ports free</th>
              <th scope="col" className={T.th}>Peak</th>
              <th scope="col" className={T.th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={T.tbody}>
            {stations.length === 0 ? (
              <tr className={T.tr}>
                <td colSpan={7} className={cn(T.td, T.full, 'max-[760px]:before:hidden')}>
                  <Empty
                    title={counts.all === 0 ? 'No stations yet.' : 'No station matches.'}
                    text={counts.all === 0 ? 'Add a station to publish it to the map.' : 'Try another search, or clear the filters.'}
                  />
                </td>
              </tr>
            ) : (
              stations.map((station) => {
                const ports = getPortAvailability(station)
                const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
                const types = connectorTypes(station)
                const consequence = `its ${station.connectors.length} connector${station.connectors.length === 1 ? '' : 's'}, its reviews and any member bookmarks`

                return (
                  <tr key={station.id} className={cn(T.tr, 'group/row')}>
                    <td data-label="Station" className={cn(T.td, T.lead)}>
                      <Link
                        href={`/station/${station.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on the live site"
                        className={SNAME}
                      >
                        {station.name}
                        <Ico
                          name="ext"
                          className="h-[15px] w-[15px] text-fog opacity-0 transition-[opacity,translate] duration-300 ease-out [translate:-4px_0] group-hover/row:[translate:0_0] group-hover/row:opacity-100"
                        />
                        <span className="sr-only"> (opens the live page)</span>
                      </Link>
                      <div className={SSUB}>
                        <span className="font-sans text-[13px] font-medium text-muted">{station.address.city}</span> · {station.slug}
                      </div>
                    </td>
                    <td data-label="Venue" className={T.td}>
                      {/* `Unset` rather than a blank cell or a guess: the
                          operator needs to see which ones still need a venue. */}
                      {station.venueType && station.venueType !== 'other' ? (
                        <span className={VTAG}>{venueLabel(station.venueType)}</span>
                      ) : (
                        <span className={cn(VTAG, 'bg-transparent px-0 text-fog')}>Unset</span>
                      )}
                    </td>
                    <td data-label="Status" className={T.td}>
                      <StatusPill status={station.status} />
                    </td>
                    <td data-label="Connectors" className={cn(T.td, T.full)}>
                      {types.length === 0 ? (
                        <span className="text-[13px] text-fog">None</span>
                      ) : (
                        <div className="flex flex-nowrap items-center gap-1.5 max-[760px]:flex-wrap">
                          {types.map((type) => (
                            <span key={type} className={CON_TAG}>
                              {type.replace(/\s/g, '')}
                            </span>
                          ))}
                          {station.connectors.length > types.length ? (
                            <span className="font-mono text-xs text-fog">×{station.connectors.length}</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td data-label="Ports free" className={T.td}>
                      <PortBar free={ports.available} total={ports.total} />
                    </td>
                    <td data-label="Peak" className={T.td}>
                      <Kw kw={maxPower} />
                    </td>
                    <td data-label="Actions" className={cn(T.td, T.acts)}>
                      <div className="flex items-start justify-end gap-1">
                        <Link href={`/admin/stations/${station.id}`} aria-label={`Edit ${station.name}`} className={ACT}>
                          <Ico name="pen" />
                        </Link>
                        <DeleteButton label={station.name} consequence={consequence} action={async () => onDelete(station.id)} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

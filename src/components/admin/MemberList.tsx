// src/components/admin/MemberList.tsx
'use client'

import { Bookmark, Building2, Car, MapPin, Search, Star } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import type { MemberRow } from '@/lib/db/queries'
import { cn, formatRelativeTime } from '@/lib/utils'

/**
 * The member list, with its filter.
 *
 * Rows are rendered here rather than passed in from the server page. The first
 * version took the row markup as a render prop, which cannot cross the server
 * to client boundary — a function is not serialisable, and React rejects it
 * outright ("Functions are not valid as a child of Client Components"), so the
 * whole screen fell to the error boundary.
 *
 * Filtering happens in the browser over the full list. It searches name, email,
 * city and vehicle together, and a round trip per keystroke to do that would be
 * slower than this list is long for any realistic number of members.
 */

export interface MemberListProps {
  members: MemberRow[]
}

type SortKey = 'recent' | 'name' | 'activity'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Newest' },
  { key: 'name', label: 'Name' },
  { key: 'activity', label: 'Most active' },
]

export function MemberList({ members }: MemberListProps) {
  const [query, setQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortKey>('recent')
  const [onlyBusiness, setOnlyBusiness] = React.useState(false)

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()

    let rows = members
    if (needle) {
      rows = rows.filter((member) =>
        [member.name, member.email, member.city ?? '', member.vehicle ?? '']
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    }
    if (onlyBusiness) rows = rows.filter((member) => member.businessCount > 0)

    return [...rows].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'activity') {
        return b.reviewCount + b.savedCount - (a.reviewCount + a.savedCount)
      }
      return b.joinedAt.localeCompare(a.joinedAt)
    })
  }, [members, query, sortBy, onlyBusiness])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, city or vehicle"
            aria-label="Search members"
            className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setOnlyBusiness((current) => !current)}
          aria-pressed={onlyBusiness}
          className={cn(
            'h-11 rounded-xl px-4 text-ui-sm font-medium transition-colors',
            onlyBusiness
              ? 'bg-plug-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          Has a listing
        </button>

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

      {visible.length !== members.length ? (
        <p className="mb-3 text-ui-sm text-slate-500">
          Showing {visible.length} of {members.length}.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-ui-sm text-slate-500">
          No member matches that.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((member) => (
            <li key={member.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-ui font-bold text-white"
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="font-semibold text-slate-900 hover:text-plug-blue-600 hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="mt-0.5 truncate text-ui-sm text-slate-500">{member.email}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-xs text-slate-500">
                      {member.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
                          {member.city}
                        </span>
                      ) : null}
                      {member.vehicle ? (
                        <span className="inline-flex items-center gap-1">
                          <Car size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
                          {member.vehicle}
                        </span>
                      ) : null}
                      <span>Joined {formatRelativeTime(member.joinedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {member.businessCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-ui-xs font-semibold text-plug-blue-700">
                      <Building2 size={12} aria-hidden="true" />
                      {member.businessCount} listing{member.businessCount === 1 ? '' : 's'}
                    </span>
                  ) : null}

                  <span
                    title={`${member.reviewCount} review${member.reviewCount === 1 ? '' : 's'} written`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-ui-xs font-medium text-slate-600"
                  >
                    <Star size={12} aria-hidden="true" />
                    {member.reviewCount}
                  </span>

                  <span
                    title={`${member.savedCount} listing${member.savedCount === 1 ? '' : 's'} saved`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-ui-xs font-medium text-slate-600"
                  >
                    <Bookmark size={12} aria-hidden="true" />
                    {member.savedCount}
                  </span>

                  <Link
                    href={`/admin/members/${member.id}`}
                    className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-ui-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

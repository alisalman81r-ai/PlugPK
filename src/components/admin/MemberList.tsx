// src/components/admin/MemberList.tsx
import { Bookmark, Building2, Car, MapPin, ShieldCheck, Star, Trash2 } from '@/components/ui/icons'
import Link from 'next/link'

import type { MemberRow } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

/**
 * One page of members.
 *
 * This used to be a client component holding every account on the site — name
 * and email for each — and filtering them in the browser. It is now a server
 * component that renders the page the database returned; search, filters and
 * sorting are in the URL (see members/page.tsx).
 *
 * Delete is no longer a two-click button on the row. Removing an account now
 * has three refusals (yourself, an admin, an account with memberships) and an
 * alternative (anonymise), and the type-the-name confirmation on the profile is
 * where those are explained. The row links straight to it.
 */

export interface MemberListProps {
  members: MemberRow[]
}

export function MemberList({ members }: MemberListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {members.map((member) => (
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
                <p className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/members/${member.id}`}
                    className="font-semibold text-slate-900 hover:text-plug-blue-600 hover:underline"
                  >
                    {member.name}
                  </Link>
                  {member.isAdmin ? <AdminBadge /> : null}
                </p>
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
                  {/* "12 min ago" on the server can be "13 min ago" by the time the
                      browser hydrates; a relative time is allowed to differ. */}
                  <span suppressHydrationWarning>Joined {formatRelativeTime(member.joinedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
              {member.businessCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-plug-blue-50 px-2.5 py-1 text-ui-xs font-semibold text-plug-blue-700">
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
                <span className="sr-only">reviews</span>
              </span>

              <span
                title={`${member.savedCount} listing${member.savedCount === 1 ? '' : 's'} saved`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-ui-xs font-medium text-slate-600"
              >
                <Bookmark size={12} aria-hidden="true" />
                {member.savedCount}
                <span className="sr-only">saved</span>
              </span>

              <Link
                href={`/admin/members/${member.id}`}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-ui-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                View
              </Link>

              {member.isAdmin ? null : (
                <Link
                  href={`/admin/members/${member.id}#remove`}
                  aria-label={`Delete or anonymise ${member.name}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-ui-sm font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Who can use this portal, said on the row rather than discovered on the profile. */
export function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-plug-navy-900 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      <ShieldCheck size={11} aria-hidden="true" />
      Admin
    </span>
  )
}

// src/components/admin/MemberList.tsx
import Link from 'next/link'

import type { MemberRow } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

import { Ico, initials, k, plural, rise, s } from './people/kit'

/**
 * One page of members (the design's .mcard list).
 *
 * A server component that renders the page the database returned; search,
 * filters and sorting are in the URL (see members/page.tsx).
 *
 * Delete is not a button on the row. Removing an account has three refusals
 * (yourself, an admin, an account with memberships) and an alternative
 * (anonymise), and the type-the-name confirmation on the profile is where those
 * are explained. The row's Remove links straight to it.
 */

export interface MemberListProps {
  members: MemberRow[]
}

export function MemberList({ members }: MemberListProps) {
  return (
    <ul className={s.stack} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {members.map((member, index) => {
        const r = rise(Math.min(index, 8))
        return (
          <li key={member.id} className={k('card', 'mcard', r.className)} style={r.style}>
            <span aria-hidden="true" className={k('mav', member.isAdmin && 'mav--ink')}>
              {initials(member.name)}
            </span>

            <div style={{ minWidth: 0 }}>
              <div className={s.mcard__name}>
                <Link href={`/admin/members/${member.id}`}>{member.name}</Link>
                {member.isAdmin ? <AdminBadge /> : null}
              </div>
              <a className={s.mcard__mail} href={`mailto:${member.email}`}>
                {member.email}
              </a>
              <div className={s.meta}>
                {member.city ? (
                  <span>
                    <Ico n="pinl" />
                    {member.city}
                  </span>
                ) : null}
                {member.vehicle ? (
                  <span>
                    <Ico n="car" />
                    {member.vehicle}
                  </span>
                ) : null}
                {/* "12 min ago" on the server can be "13 min ago" by the time the
                    browser hydrates; a relative time is allowed to differ. */}
                <span suppressHydrationWarning>Joined {formatRelativeTime(member.joinedAt)}</span>
              </div>
            </div>

            <div className={s.mcard__side}>
              {member.businessCount > 0 ? (
                <span className={k('tagx', 'tagx--ok')}>
                  <Ico n="building" />
                  {plural(member.businessCount, 'listing')}
                </span>
              ) : null}
              <span className={s.tagx} title={`${plural(member.reviewCount, 'review')} written`}>
                <Ico n="star" />
                {member.reviewCount}
                <span className={s.sr}>reviews</span>
              </span>
              <span className={s.tagx} title={`${plural(member.savedCount, 'listing')} saved`}>
                <Ico n="bookmark" />
                {member.savedCount}
                <span className={s.sr}>saved</span>
              </span>
              <Link href={`/admin/members/${member.id}`} className={k('btn', 'btn--line', 'btn--sm')}>
                View
              </Link>
              {member.isAdmin ? null : (
                <Link
                  href={`/admin/members/${member.id}#remove`}
                  aria-label={`Delete or anonymise ${member.name}`}
                  className={k('btn', 'btn--line', 'btn--sm', 'del')}
                >
                  <Ico n="trash" />
                  Remove
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Who can use this portal, said on the row rather than discovered on the profile. */
export function AdminBadge() {
  return (
    <span className={s.badge}>
      <Ico n="shield" />
      Admin
    </span>
  )
}

// src/components/admin/member-events.tsx
import Link from 'next/link'

import {
  Activity,
  Bookmark,
  Building2,
  ExternalLink,
  Globe,
  MessageSquare,
  Smartphone,
  Star,
  Users,
  type IconType,
} from '@/components/ui/icons'
import type { AppEventKind } from '@/lib/db/app-admin-queries'
import { cn } from '@/lib/utils'

/**
 * How a member's action (an AppEvent row, from the app or the website) is
 * shown anywhere in the portal: its label, icon, where it opens, and the feed
 * itself. The Activity page, each member's page and the Mobile app section
 * all render events through this, so a "Review" looks the same in all three.
 */

export interface MemberEventRow {
  id: string
  type: string
  targetType: string | null
  targetId: string | null
  userId: string | null
  userEmail: string | null
  /** The account's current name; null when signed out or since deleted. */
  userName: string | null
  summary: string | null
  source: string
  createdAt: string
}

/** Each kind of action: its icon and chip colours. */
export const EVENT_KIND_META: Record<Exclude<AppEventKind, 'all'>, { icon: IconType; tone: string; hint: string }> = {
  accounts: { icon: Users, tone: 'bg-sky-50 text-sky-800 border-sky-200', hint: 'Sign-ups, sign-ins, email confirmations, profile photos' },
  community: { icon: MessageSquare, tone: 'bg-violet-50 text-violet-800 border-violet-200', hint: 'Posts, replies, likes, joining clubs' },
  saved: { icon: Bookmark, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', hint: 'Saved stations and routes, garage changes' },
  reviews: { icon: Star, tone: 'bg-yellow-50 text-yellow-800 border-yellow-200', hint: 'Station reviews' },
  partners: { icon: Building2, tone: 'bg-amber-50 text-amber-800 border-amber-200', hint: 'Partner meetings, charger and service listings' },
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  'account.signup': 'Signed up',
  'account.signin': 'Signed in',
  'account.signout': 'Signed out',
  'account.verify': 'Confirmed email',
  'account.reset': 'Reset password',
  'profile.photo': 'Profile photo',
  'profile.photoRemove': 'Photo removed',
  'meeting.request': 'Partner request',
  'business.register': 'Business listing',
  'service.apply': 'Service listing',
  'post.create': 'New post',
  'comment.create': 'Reply',
  'post.like': 'Like',
  'post.unlike': 'Unlike',
  'club.join': 'Joined club',
  'club.leave': 'Left club',
  'review.create': 'Review',
  'station.save': 'Saved station',
  'station.unsave': 'Unsaved station',
  'garage.update': 'Garage',
  'route.save': 'Saved route',
  'route.remove': 'Removed route',
}

const KIND_TYPES: Record<Exclude<AppEventKind, 'all'>, readonly string[]> = {
  accounts: ['account.signup', 'account.signin', 'account.signout', 'account.verify', 'account.reset', 'profile.photo', 'profile.photoRemove'],
  partners: ['meeting.request', 'business.register', 'service.apply'],
  community: ['post.create', 'comment.create', 'post.like', 'post.unlike', 'club.join', 'club.leave'],
  reviews: ['review.create'],
  saved: ['station.save', 'station.unsave', 'garage.update', 'route.save', 'route.remove'],
}

export function eventKind(type: string): Exclude<AppEventKind, 'all'> | null {
  for (const [key, types] of Object.entries(KIND_TYPES)) {
    if (types.includes(type)) return key as Exclude<AppEventKind, 'all'>
  }
  return type.startsWith('account.') ? 'accounts' : null
}

/** Where an action can be seen and edited in the portal. */
export function eventHref(row: Pick<MemberEventRow, 'type' | 'targetType' | 'targetId' | 'userId' | 'summary'>) {
  switch (row.targetType) {
    case 'member':
      return row.targetId ? `/admin/members/${row.targetId}` : null
    case 'post':
      return `/admin/community?q=${encodeURIComponent((row.summary?.match(/“(.+)”/)?.[1] ?? '').slice(0, 60))}`
    case 'review':
      return row.targetId ? `/admin/reviews?listing=station:${row.targetId}` : '/admin/reviews'
    case 'meeting':
      return '/admin/meetings'
    case 'business':
      return row.targetId ? `/admin/businesses/${row.targetId}` : '/admin/businesses'
    case 'service':
      return row.targetId ? `/admin/services/${row.targetId}` : '/admin/services'
    case 'station':
      return row.targetId ? `/admin/stations/${row.targetId}` : null
    default:
      return row.userId ? `/admin/members/${row.userId}` : null
  }
}

export const formatEventDate = (iso: string) =>
  new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

/** "Today", "Yesterday", or "Mon 20 Oct" for a feed's day header. */
function dayHeading(key: string): string {
  const today = dayKey(new Date().toISOString())
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString())
  if (key === today) return 'Today'
  if (key === yesterday) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${key}T00:00:00Z`))
}

/** "Website" or "App", so the admin can tell where something was done. */
export function SourceBadge({ source }: { source: string }) {
  const web = source === 'web'
  const Icon = web ? Globe : Smartphone
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[11px] font-semibold',
        web ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-plug-blue-200 bg-plug-blue-50 text-plug-blue-700',
      )}
    >
      <Icon size={11} aria-hidden="true" />
      {web ? 'Website' : 'App'}
    </span>
  )
}

/**
 * Actions grouped under a day heading each, newest first. `showPerson` names
 * who did it on every row (off on a member's own page, where it is always them).
 */
export function MemberEventFeed({ rows, showPerson = true }: { rows: MemberEventRow[]; showPerson?: boolean }) {
  const groups: { key: string; rows: MemberEventRow[] }[] = []
  for (const row of rows) {
    const key = dayKey(row.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.rows.push(row)
    else groups.push({ key, rows: [row] })
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={dayHeading(group.key)}>
          <h3 className="mb-2 flex items-center gap-2 text-ui-xs font-semibold uppercase tracking-wide text-slate-500">
            {dayHeading(group.key)}
            <span className="font-normal normal-case tracking-normal text-slate-400">
              {group.rows.length} action{group.rows.length === 1 ? '' : 's'}
            </span>
          </h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {group.rows.map((row) => {
              const href = eventHref(row)
              const kind = eventKind(row.type)
              const meta = kind ? EVENT_KIND_META[kind] : null
              const Icon = meta?.icon ?? Activity
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                      meta?.tone ?? 'border-slate-200 bg-slate-50 text-slate-600',
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui-sm font-medium text-slate-900">{row.summary ?? row.type}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ui-xs text-slate-500">
                      <span className="font-semibold text-slate-600">{EVENT_TYPE_LABEL[row.type] ?? row.type}</span>
                      <SourceBadge source={row.source} />
                      {showPerson ? (
                        <>
                          <span aria-hidden="true">·</span>
                          {row.userId ? (
                            <Link href={`/admin/members/${row.userId}`} className="text-plug-blue-600 hover:underline">
                              {row.userName ?? row.userEmail ?? 'Member'}
                            </Link>
                          ) : (
                            <span>{row.userEmail ?? 'Not signed in'}</span>
                          )}
                          {row.userId && row.userName && row.userEmail ? (
                            <span className="text-slate-400">{row.userEmail}</span>
                          ) : null}
                        </>
                      ) : null}
                      <span aria-hidden="true">·</span>
                      <time dateTime={row.createdAt} title={formatEventDate(row.createdAt)}>
                        {new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' }).format(new Date(row.createdAt))}
                      </time>
                    </p>
                  </div>
                  {href ? (
                    <Link
                      href={href}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Open
                      <ExternalLink size={12} aria-hidden="true" />
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

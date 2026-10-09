// src/app/admin/(protected)/app/page.tsx
import Link from 'next/link'

import {
  Activity,
  CalendarClock,
  ExternalLink,
  RefreshCw,
  Smartphone,
  UserPlus,
  Users,
} from '@/components/ui/icons'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { MetricCard } from '@/components/admin/MetricCard'
import { buildHref, flattenParams, pick } from '@/components/admin/list-params'
import { toPage, toQuery } from '@/lib/db/admin-queries'
import {
  APP_EVENT_KINDS,
  APP_EVENT_KIND_KEYS,
  getAppOverview,
  listAppEventsPage,
  listAppUsersPage,
} from '@/lib/db/app-admin-queries'
import { cn, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PATH = '/admin/app'

/** Where an app action can be seen and edited in the portal. */
function editHref(row: { type: string; targetType: string | null; targetId: string | null; userId: string | null; summary: string | null }) {
  switch (row.targetType) {
    case 'member':
      return row.targetId ? `/admin/members/${row.targetId}` : null
    case 'post':
      return `/admin/community?q=${encodeURIComponent((row.summary?.match(/“(.+)”/)?.[1] ?? '').slice(0, 60))}`
    case 'review':
      return row.targetId ? `/admin/reviews?listing=station:${row.targetId}` : '/admin/reviews'
    case 'meeting':
      return '/admin/meetings'
    case 'station':
      return row.targetId ? `/admin/stations/${row.targetId}` : null
    default:
      return row.userId ? `/admin/members/${row.userId}` : null
  }
}

const TYPE_TONE: Record<string, string> = {
  account: 'bg-sky-50 text-sky-800 border-sky-200',
  profile: 'bg-sky-50 text-sky-800 border-sky-200',
  meeting: 'bg-amber-50 text-amber-800 border-amber-200',
  post: 'bg-violet-50 text-violet-800 border-violet-200',
  comment: 'bg-violet-50 text-violet-800 border-violet-200',
  club: 'bg-violet-50 text-violet-800 border-violet-200',
  review: 'bg-yellow-50 text-yellow-800 border-yellow-200',
}

const TYPE_LABEL: Record<string, string> = {
  'account.signup': 'Signed up',
  'account.signin': 'Signed in',
  'account.signout': 'Signed out',
  'profile.photo': 'Profile photo',
  'profile.photoRemove': 'Photo removed',
  'meeting.request': 'Partner request',
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

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export default async function AdminAppPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const view = pick(params.view, ['activity', 'users'] as const, 'activity')
  const q = toQuery(params.q)
  const page = toPage(params.page)
  const kind = pick(params.kind, APP_EVENT_KIND_KEYS, 'all')

  const [overview, events, users] = await Promise.all([
    getAppOverview(),
    view === 'activity' ? listAppEventsPage({ q, kind, page }) : null,
    view === 'users' ? listAppUsersPage({ q, page }) : null,
  ])
  const last = overview.lastSent

  return (
    <>
      <AdminHeader
        title="Mobile app"
        help={
          <>
            <b>Everything that reaches the server from the mobile app.</b> The app uses the same accounts
            and database as the website, so a sign-up, post, review or partner request made in the app is
            a real record — editable from Members, Community, Reviews and Meetings like any other. This page
            is the app&apos;s own view of it: who uses the app, and what they did, newest first.
          </>
        }
        description="Accounts, partner requests, community, reviews, saved stations and garages from the app."
        action={
          <Link
            href="/admin/app/releases"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            <RefreshCw size={15} aria-hidden="true" />
            App updates
          </Link>
        }
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard
            label="App users"
            value={String(overview.appUsers)}
            detail={`${overview.appSignups} signed up in the app`}
            icon={Smartphone}
            href={buildHref(PATH, {}, { view: 'users' })}
            help="Accounts that have used the mobile app at least once, and how many of them were created there rather than on the website."
          />
          <MetricCard
            label="Active this week"
            value={String(overview.activeWeek)}
            detail="Opened the app in the last 7 days"
            icon={Users}
            tone={overview.activeWeek > 0 ? 'good' : 'neutral'}
          />
          <MetricCard
            label="App actions, 24h"
            value={String(overview.eventsToday)}
            detail="Sign-ins, posts, saves and more"
            icon={Activity}
          />
          <MetricCard
            label="Partner requests"
            value={String(overview.partnerRequests)}
            detail="Sent from the app's Partner Up"
            icon={CalendarClock}
            href={buildHref(PATH, {}, { kind: 'partners' })}
          />
          <MetricCard
            label="Last update sent"
            value={last?.sentAt ? formatRelativeTime(last.sentAt.toISOString()) : null}
            unavailableReason="No update has been sent to users yet"
            detail={last ? `${last.version} · ${last.title}` : undefined}
            icon={RefreshCw}
            tone={overview.drafts > 0 ? 'warn' : 'neutral'}
            href="/admin/app/releases"
            help="The newest update marked as sent in App updates. Users see its note once as “What’s new” the next time they open the app."
          />
        </div>

        {/* Activity / Users */}
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(['activity', 'users'] as const).map((v) => (
            <Link
              key={v}
              href={buildHref(PATH, {}, { view: v === 'activity' ? undefined : v })}
              aria-current={view === v ? 'page' : undefined}
              className={cn(
                'rounded-lg px-4 py-2 text-ui-sm font-semibold transition-colors',
                view === v ? 'bg-plug-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {v === 'activity' ? 'Activity' : 'Users'}
            </Link>
          ))}
        </div>

        {events ? (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
              <AdminSearch placeholder="Search by email or what happened" label="Search app activity" />
              <AdminFilterChips
                label="Filter by kind"
                param="kind"
                current={kind}
                path={PATH}
                params={params}
                options={APP_EVENT_KIND_KEYS.map((key) => ({
                  value: key,
                  label: APP_EVENT_KINDS[key].label,
                  count: events.counts[key],
                }))}
              />
            </div>

            {events.rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Smartphone size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
                <p className="text-ui font-semibold text-slate-900">
                  {events.total === 0 && !q && kind === 'all' ? 'Nothing from the app yet' : 'Nothing matches that'}
                </p>
                <p className="mt-1 text-ui-sm text-slate-500">
                  {events.total === 0 && !q && kind === 'all'
                    ? 'Sign-ups, posts, reviews and partner requests made in the app will appear here as they happen.'
                    : 'Try another search or kind.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {events.rows.map((row) => {
                  const href = editHref(row)
                  const group = row.type.split('.')[0] ?? ''
                  return (
                    <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                      <span
                        className={cn(
                          'inline-flex shrink-0 rounded-md border px-2 py-0.5 text-ui-xs font-semibold',
                          TYPE_TONE[group] ?? 'border-slate-200 bg-slate-50 text-slate-700',
                        )}
                      >
                        {TYPE_LABEL[row.type] ?? row.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-ui-sm font-medium text-slate-900">{row.summary ?? row.type}</p>
                        <p className="mt-0.5 text-ui-xs text-slate-500">
                          {row.userId ? (
                            <Link href={`/admin/members/${row.userId}`} className="text-plug-blue-600 hover:underline">
                              {row.userEmail ?? 'Member'}
                            </Link>
                          ) : (
                            (row.userEmail ?? 'Not signed in')
                          )}
                          {' · '}
                          <time dateTime={row.createdAt} title={formatDate(row.createdAt)}>
                            {formatRelativeTime(row.createdAt)}
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
            )}

            <AdminPagination
              path={PATH}
              params={params}
              page={page}
              pageSize={events.pageSize}
              total={events.total}
              noun={['action', 'actions']}
            />
          </>
        ) : null}

        {users ? (
          <>
            <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-3">
              <AdminSearch placeholder="Search name or email" label="Search app users" />
            </div>

            {users.rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <UserPlus size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
                <p className="text-ui font-semibold text-slate-900">{q ? 'Nobody matches that' : 'No app users yet'}</p>
                <p className="mt-1 text-ui-sm text-slate-500">
                  {q ? 'Try another name or email.' : 'Accounts appear here the first time they sign in or sign up in the app.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[760px] text-left text-ui-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-ui-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Joined via</th>
                      <th className="px-4 py-3">Last in app</th>
                      <th className="px-4 py-3">Car</th>
                      <th className="px-4 py-3 text-right">Saved · Posts · Reviews · Clubs</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.rows.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-ui-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-md border px-2 py-0.5 text-ui-xs font-semibold',
                              user.signupSource === 'app'
                                ? 'border-plug-cyan-300 bg-plug-cyan-50 text-plug-blue-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600',
                            )}
                          >
                            {user.signupSource === 'app' ? 'App' : 'Website'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {user.lastAppActiveAt ? (
                            <time dateTime={user.lastAppActiveAt} title={formatDate(user.lastAppActiveAt)}>
                              {formatRelativeTime(user.lastAppActiveAt)}
                            </time>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{user.vehicle ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-ui-xs text-slate-600">
                          {user._count.saved} · {user.posts} · {user.reviews} · {user._count.clubs}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/members/${user.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <AdminPagination
              path={PATH}
              params={params}
              page={page}
              pageSize={users.pageSize}
              total={users.total}
              noun={['user', 'users']}
            />
          </>
        ) : null}
      </div>
    </>
  )
}

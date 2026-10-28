// src/app/admin/(protected)/app/page.tsx
import Link from 'next/link'

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  ExternalLink,
  Inbox,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  type IconType,
} from '@/components/ui/icons'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { AppActivityChart } from '@/components/admin/AppActivityChart'
import { DashboardPanel, PanelEmpty } from '@/components/admin/DashboardPanel'
import { MetricCard } from '@/components/admin/MetricCard'
import { buildHref, flattenParams, pick, type ListParams } from '@/components/admin/list-params'
import { toPage, toQuery } from '@/lib/db/admin-queries'
import {
  APP_EVENT_KINDS,
  APP_EVENT_KIND_KEYS,
  APP_RANGES,
  APP_USER_STATUSES,
  APP_USER_STATUS_KEYS,
  getAppDashboard,
  listAppEventsPage,
  listAppUsersPage,
  type AppEventKind,
} from '@/lib/db/app-admin-queries'
import { cn, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PATH = '/admin/app'
const VIEWS = ['overview', 'activity', 'users'] as const
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { overview: 'Overview', activity: 'Activity', users: 'Users' }

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

/** Each kind of app action: its icon and chip colours, shared by every view. */
const KIND_META: Record<Exclude<AppEventKind, 'all'>, { icon: IconType; tone: string; hint: string }> = {
  accounts: { icon: Users, tone: 'bg-sky-50 text-sky-800 border-sky-200', hint: 'Sign-ups, sign-ins, email confirmations, profile photos' },
  community: { icon: MessageSquare, tone: 'bg-violet-50 text-violet-800 border-violet-200', hint: 'Posts, replies, likes, joining clubs' },
  saved: { icon: Bookmark, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', hint: 'Saved stations and routes, garage changes' },
  reviews: { icon: Star, tone: 'bg-yellow-50 text-yellow-800 border-yellow-200', hint: 'Station reviews' },
  partners: { icon: Building2, tone: 'bg-amber-50 text-amber-800 border-amber-200', hint: 'Partner meetings, charger and service listings' },
}

const TYPE_LABEL: Record<string, string> = {
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

function kindForType(type: string): Exclude<AppEventKind, 'all'> | null {
  for (const key of APP_EVENT_KIND_KEYS) {
    const types = APP_EVENT_KINDS[key].types as readonly string[] | null
    if (types?.includes(type)) return key as Exclude<AppEventKind, 'all'>
  }
  return type.startsWith('account.') ? 'accounts' : null
}

const formatDate = (iso: string) =>
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

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/** "Active today / this week / …" from the last time the app was opened. */
function activityStatus(iso: string | null): { label: string; tone: string } {
  if (!iso) return { label: 'Never opened', tone: 'border-slate-200 bg-slate-50 text-slate-500' }
  const age = Date.now() - new Date(iso).getTime()
  if (age < 86_400_000) return { label: 'Active today', tone: 'border-green-200 bg-green-50 text-green-800' }
  if (age < 7 * 86_400_000) return { label: 'This week', tone: 'border-plug-cyan-300 bg-plug-cyan-50 text-plug-blue-700' }
  if (age < 30 * 86_400_000) return { label: 'This month', tone: 'border-slate-200 bg-slate-50 text-slate-700' }
  return { label: 'Inactive', tone: 'border-slate-200 bg-slate-50 text-slate-500' }
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plug-cyan-100 text-[11px] font-bold text-plug-blue-700"
    >
      {initials(name)}
    </span>
  )
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-ui-xs font-medium text-green-700">
      <CheckCircle2 size={12} aria-hidden="true" /> Confirmed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ui-xs font-medium text-amber-700">
      <AlertCircle size={12} aria-hidden="true" /> Not confirmed
    </span>
  )
}

export default async function AdminAppPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const view = pick(params.view, VIEWS, 'overview')
  const q = toQuery(params.q)
  const page = toPage(params.page)
  const kind = pick(params.kind, APP_EVENT_KIND_KEYS, 'all')
  const range = pick(params.range, APP_RANGES, '30')
  const status = pick(params.status, APP_USER_STATUS_KEYS, 'all')

  const [dash, events, users] = await Promise.all([
    view === 'overview' ? getAppDashboard(range) : null,
    view === 'activity' ? listAppEventsPage({ q, kind, page }) : null,
    view === 'users' ? listAppUsersPage({ q, page, status }) : null,
  ])

  return (
    <>
      <AdminHeader
        title="Mobile app"
        help={
          <>
            <b>Everything that reaches the server from the mobile app.</b> The app uses the same accounts
            and database as the website, so a sign-up, post, review or partner request made in the app is
            a real record — editable from Members, Community, Reviews and Meetings like any other.{' '}
            <b>Overview</b> shows how the app is doing and what needs you; <b>Activity</b> is every action,
            newest first; <b>Users</b> is everyone who uses the app.
          </>
        }
        description="How the app is used, who uses it, and what needs your attention."
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
        {/* View switch */}
        <nav aria-label="Mobile app views" className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={buildHref(PATH, {}, { view: v === 'overview' ? undefined : v })}
              aria-current={view === v ? 'page' : undefined}
              className={cn(
                'rounded-lg px-4 py-2 text-ui-sm font-semibold transition-colors',
                view === v ? 'bg-plug-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {VIEW_LABEL[v]}
            </Link>
          ))}
        </nav>

        {dash ? <Overview dash={dash} range={range} /> : null}
        {events ? <ActivityView events={events} q={q} kind={kind} page={page} params={params} /> : null}
        {users ? <UsersView users={users} q={q} status={status} page={page} params={params} /> : null}
      </div>
    </>
  )
}

// ─── Overview ──────────────────────────────────────────────────────

type Dashboard = Awaited<ReturnType<typeof getAppDashboard>>

function Overview({ dash, range }: { dash: Dashboard; range: (typeof APP_RANGES)[number] }) {
  const { attention } = dash
  const attentionTotal = attention.pendingBusinesses + attention.pendingServices + attention.newMeetings + attention.unverified
  const delta = dash.actions.now - dash.actions.before
  const deltaPct = dash.actions.before > 0 ? Math.round((delta / dash.actions.before) * 100) : null
  const kindRows = (Object.entries(dash.kinds) as [Exclude<AppEventKind, 'all'>, number][]).sort((a, b) => b[1] - a[1])
  const kindMax = Math.max(1, ...kindRows.map(([, n]) => n))
  const kindTotal = kindRows.reduce((s, [, n]) => s + n, 0)
  const signupTotal = dash.signups.app + dash.signups.web
  const period = `last ${dash.days} days`

  return (
    <>
      {/* One filter row; it scopes every number below. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-ui-xs font-semibold uppercase tracking-wide text-slate-500">Period</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Period">
          {APP_RANGES.map((r) => (
            <Link
              key={r}
              href={buildHref(PATH, {}, { range: r === '30' ? undefined : r })}
              aria-current={range === r ? 'true' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 text-ui-xs font-semibold transition-colors',
                range === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {r} days
            </Link>
          ))}
        </div>
        <span className="text-ui-xs text-slate-500">Activity numbers cover the {period}. Live counts are marked “now”.</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard
          label="App users"
          value={dash.appUsers.toLocaleString('en-PK')}
          detail={`${dash.signups.app} new from the app, ${period}`}
          icon={Smartphone}
          href={buildHref(PATH, {}, { view: 'users' })}
          help="Every account that has opened the mobile app at least once, or was created in it. Now, not limited to the period."
        />
        <MetricCard
          label="Active this week"
          value={dash.active.week.toLocaleString('en-PK')}
          detail={`${pct(dash.active.week, dash.appUsers)}% of app users · ${dash.active.day} in the last 24h`}
          icon={Users}
          tone={dash.active.week > 0 ? 'good' : 'neutral'}
          href={buildHref(PATH, {}, { view: 'users', status: 'active' })}
          help="App users who opened the app in the last 7 days (now). The percentage is how much of your app audience comes back weekly."
        />
        <MetricCard
          label="Monthly active"
          value={dash.active.month.toLocaleString('en-PK')}
          detail={`${pct(dash.active.month, dash.appUsers)}% opened it in the last 30 days`}
          icon={TrendingUp}
          help="App users who opened the app at least once in the last 30 days (now)."
        />
        <MetricCard
          label="Actions"
          value={dash.actions.now.toLocaleString('en-PK')}
          detail={
            deltaPct === null
              ? `in the ${period}`
              : `${delta >= 0 ? '+' : ''}${deltaPct}% vs the ${dash.days} days before`
          }
          icon={Activity}
          tone={deltaPct === null ? 'neutral' : delta >= 0 ? 'good' : 'warn'}
          href={buildHref(PATH, {}, { view: 'activity' })}
          help="Everything the app sent to the server in the period: sign-ins, posts, saves, reviews, listings. Compared with the same length of time just before it."
        />
        <MetricCard
          label="Needs attention"
          value={String(attentionTotal)}
          detail={attentionTotal === 0 ? 'Nothing waiting on you' : 'See the list below'}
          icon={AlertTriangle}
          tone={attentionTotal > 0 ? 'warn' : 'good'}
          help="Listings sent from the app that are waiting for review, new partner meeting requests, and app accounts whose email is not confirmed yet (now)."
        />
      </div>

      <div className="mb-6 grid items-start gap-6 xl:grid-cols-3">
        <DashboardPanel
          title="Daily active members"
          description={`Signed-in members who did something in the app each day, ${period}. Hover a day for its actions.`}
          help="Counted from app actions, so a member who only opened the app and did nothing is not counted for that day (their visit still shows in “Active this week”). Days are Pakistan time."
          className="xl:col-span-2"
        >
          <AppActivityChart points={dash.series} />
        </DashboardPanel>

        <DashboardPanel
          title="Needs your attention"
          description="Work waiting in other sections"
          help="Each row opens the section where you act on it. Listings count only those sent from the app."
        >
          {attentionTotal === 0 ? (
            <PanelEmpty icon={CheckCircle2} title="All clear" reason="Nothing from the app is waiting on you." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {[
                { n: attention.pendingBusinesses, label: 'Charger listings to review', hint: 'Sent from the app', href: '/admin/businesses?status=pending', icon: Building2 },
                { n: attention.pendingServices, label: 'Service listings to review', hint: 'Sent from the app', href: '/admin/services', icon: Wrench },
                { n: attention.newMeetings, label: 'New partner meeting requests', hint: 'From the app and the website', href: '/admin/meetings?status=new', icon: Inbox },
                { n: attention.unverified, label: 'App accounts not confirmed', hint: 'Signed up, never entered their code', href: buildHref(PATH, {}, { view: 'users', status: 'unverified' }), icon: AlertCircle },
              ]
                .filter((row) => row.n > 0)
                .map((row) => (
                  <li key={row.label}>
                    <Link href={row.href} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <row.icon size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-ui-sm font-semibold text-slate-900">{row.label}</span>
                        <span className="block text-ui-xs text-slate-500">{row.hint}</span>
                      </span>
                      <span className="text-ui font-bold tabular-nums text-slate-900">{row.n}</span>
                      <ArrowRight size={14} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </DashboardPanel>
      </div>

      <div className="mb-6 grid items-start gap-6 xl:grid-cols-3">
        <DashboardPanel
          title="What people do in the app"
          description={`${kindTotal.toLocaleString('en-PK')} actions, ${period}`}
          help="App actions grouped by kind. Open one to see every action of that kind in Activity."
        >
          {kindTotal === 0 ? (
            <PanelEmpty icon={Activity} title="No actions yet" reason={`Nothing came in from the app in the ${period}.`} />
          ) : (
            <ul className="space-y-3 px-5 py-4">
              {kindRows.map(([key, n]) => {
                const meta = KIND_META[key]
                return (
                  <li key={key}>
                    <Link
                      href={buildHref(PATH, {}, { view: 'activity', kind: key })}
                      className="group block"
                      title={`${APP_EVENT_KINDS[key].label}: ${n} actions (${pct(n, kindTotal)}%) — ${meta.hint}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-ui-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700 group-hover:text-slate-900">
                          <meta.icon size={13} className="text-slate-400" aria-hidden="true" />
                          {APP_EVENT_KINDS[key].label}
                        </span>
                        <span className="tabular-nums text-slate-500">
                          <b className="font-semibold text-slate-900">{n.toLocaleString('en-PK')}</b> · {pct(n, kindTotal)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-plug-cyan-600 transition-opacity group-hover:opacity-80"
                          style={{ width: n === 0 ? 0 : `max(4px, ${(n / kindMax) * 100}%)` }}
                        />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Newest from the app"
          description={
            signupTotal > 0
              ? `${pct(dash.signups.app, signupTotal)}% of all sign-ups in the ${period} came from the app`
              : `Accounts created in the app`
          }
          help="The latest accounts created in the app, with whether they confirmed their email. The percentage compares app sign-ups with website sign-ups in the period."
          action={
            <Link href={buildHref(PATH, {}, { view: 'users' })} className="text-ui-xs font-semibold text-plug-blue-600 hover:underline">
              All users
            </Link>
          }
        >
          {dash.recentSignups.length === 0 ? (
            <PanelEmpty icon={UserPlus} title="No app sign-ups yet" reason="Accounts created in the app will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {dash.recentSignups.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/members/${u.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                    <Avatar name={u.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ui-sm font-semibold text-slate-900">{u.name}</span>
                      <span className="block truncate text-ui-xs text-slate-500">{u.vehicle ?? u.email}</span>
                    </span>
                    <span className="text-right">
                      <VerifiedBadge verified={u.verified} />
                      <time dateTime={u.createdAt} title={formatDate(u.createdAt)} className="block text-[11px] text-slate-400">
                        {formatRelativeTime(u.createdAt)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title="Most active members"
            description={`By app actions, ${period}`}
            help="The members who did the most in the app during the period. A quick way to find your most engaged drivers."
          >
            {dash.top.length === 0 ? (
              <PanelEmpty icon={Users} title="No one yet" reason="Signed-in members who use the app will rank here." />
            ) : (
              <ol className="divide-y divide-slate-100">
                {dash.top.map((row, i) => (
                  <li key={row.user.id}>
                    <Link href={`/admin/members/${row.user.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50">
                      <span className="w-4 text-ui-xs font-bold tabular-nums text-slate-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-ui-sm font-medium text-slate-900">{row.user.name}</span>
                      <span className="text-ui-xs tabular-nums text-slate-500">
                        <b className="font-semibold text-slate-900">{row.actions}</b> actions
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Latest update"
            help="The newest update marked as sent in App updates, and how many app users have opened the app since — they are the ones who have seen its “What’s new” note."
            action={
              <Link href="/admin/app/releases" className="text-ui-xs font-semibold text-plug-blue-600 hover:underline">
                Manage
              </Link>
            }
          >
            {dash.release ? (
              <div className="px-5 py-4">
                <p className="text-ui-sm font-semibold text-slate-900">
                  {dash.release.version} · {dash.release.title}
                </p>
                <p className="mt-0.5 text-ui-xs text-slate-500">
                  Sent <time dateTime={dash.release.sentAt} title={formatDate(dash.release.sentAt)}>{formatRelativeTime(dash.release.sentAt)}</time>
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-ui-xs">
                    <span className="text-slate-600">Seen by</span>
                    <span className="tabular-nums text-slate-500">
                      <b className="font-semibold text-slate-900">{dash.release.reached}</b> of {dash.appUsers} · {pct(dash.release.reached, dash.appUsers)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-plug-cyan-100">
                    <div
                      className="h-full rounded-full bg-plug-cyan-600"
                      style={{ width: `${pct(dash.release.reached, dash.appUsers)}%` }}
                    />
                  </div>
                </div>
                {dash.drafts > 0 ? (
                  <p className="mt-3 text-ui-xs text-amber-700">
                    {dash.drafts} draft{dash.drafts === 1 ? '' : 's'} not sent yet
                  </p>
                ) : null}
              </div>
            ) : (
              <PanelEmpty
                icon={RefreshCw}
                title="No update sent yet"
                reason="Write one in App updates and users see it as “What’s new”."
                action={{ label: 'App updates', href: '/admin/app/releases' }}
              />
            )}
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}

// ─── Activity ──────────────────────────────────────────────────────

type Events = Awaited<ReturnType<typeof listAppEventsPage>>

function ActivityView({
  events,
  q,
  kind,
  page,
  params,
}: {
  events: Events
  q: string
  kind: AppEventKind
  page: number
  params: ListParams
}) {
  // Group the page's rows under a day heading each.
  const groups: { key: string; rows: Events['rows'] }[] = []
  for (const row of events.rows) {
    const key = dayKey(row.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.rows.push(row)
    else groups.push({ key, rows: [row] })
  }

  return (
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
                  const href = editHref(row)
                  const rowKind = kindForType(row.type)
                  const meta = rowKind ? KIND_META[rowKind] : null
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
                        <p className="mt-0.5 text-ui-xs text-slate-500">
                          <span className="font-semibold text-slate-600">{TYPE_LABEL[row.type] ?? row.type}</span>
                          {' · '}
                          {row.userId ? (
                            <Link href={`/admin/members/${row.userId}`} className="text-plug-blue-600 hover:underline">
                              {row.userEmail ?? 'Member'}
                            </Link>
                          ) : (
                            (row.userEmail ?? 'Not signed in')
                          )}
                          {' · '}
                          <time dateTime={row.createdAt} title={formatDate(row.createdAt)}>
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
  )
}

// ─── Users ─────────────────────────────────────────────────────────

type AppUsers = Awaited<ReturnType<typeof listAppUsersPage>>

function UsersView({
  users,
  q,
  status,
  page,
  params,
}: {
  users: AppUsers
  q: string
  status: (typeof APP_USER_STATUS_KEYS)[number]
  page: number
  params: ListParams
}) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
        <AdminSearch placeholder="Search name or email" label="Search app users" />
        <AdminFilterChips
          label="Filter by status"
          param="status"
          current={status}
          path={PATH}
          params={params}
          options={APP_USER_STATUS_KEYS.map((key) => ({ value: key, label: APP_USER_STATUSES[key], count: users.counts[key] }))}
        />
      </div>

      {users.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <UserPlus size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <p className="text-ui font-semibold text-slate-900">{q || status !== 'all' ? 'Nobody matches that' : 'No app users yet'}</p>
          <p className="mt-1 text-ui-sm text-slate-500">
            {q || status !== 'all'
              ? 'Try another name, email or status.'
              : 'Accounts appear here the first time they sign in or sign up in the app.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[920px] text-left text-ui-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-ui-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Car</th>
                <th className="px-3 py-3 text-right">Saved</th>
                <th className="px-3 py-3 text-right">Posts</th>
                <th className="px-3 py-3 text-right">Reviews</th>
                <th className="px-3 py-3 text-right">Clubs</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.rows.map((user) => {
                const state = activityStatus(user.lastAppActiveAt)
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-ui-xs text-slate-500">{user.email}</p>
                          <VerifiedBadge verified={user.verified} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-ui-xs font-semibold', state.tone)}>
                        {state.label}
                      </span>
                      {user.lastAppActiveAt ? (
                        <time
                          dateTime={user.lastAppActiveAt}
                          title={formatDate(user.lastAppActiveAt)}
                          className="mt-1 block text-[11px] text-slate-400"
                        >
                          Last in app {formatRelativeTime(user.lastAppActiveAt)}
                        </time>
                      ) : null}
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
                        {user.signupSource === 'app' ? 'In the app' : 'On the website'}
                      </span>
                      <time dateTime={user.createdAt} title={formatDate(user.createdAt)} className="mt-1 block text-[11px] text-slate-400">
                        {formatRelativeTime(user.createdAt)}
                      </time>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.vehicle ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{user._count.saved}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{user.posts}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{user.reviews}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{user._count.clubs}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/members/${user.id}`}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-ui-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
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
  )
}

// src/app/admin/(protected)/app/page.tsx
import Link from 'next/link'

import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { AdmIcon, type AdmIconName } from '@/components/admin/admin-icons'
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

/**
 * The mobile app section — the design's App activity (admin/app-activity.html):
 * Overview (period, five KPI tiles, the daily-active chart, what needs you,
 * what people do, newest users, most active, latest update), Activity (every
 * app action) and Users (everyone who uses the app). All read from the same
 * accounts and database as the website.
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/app'
const VIEWS = ['overview', 'activity', 'users'] as const
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { overview: 'Overview', activity: 'Activity', users: 'Users' }

const KIND_ICON: Record<Exclude<AppEventKind, 'all'>, AdmIconName> = {
  accounts: 'user',
  partners: 'building',
  community: 'chat',
  reviews: 'star',
  saved: 'bookmark',
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/** "Active today / this week / …" from the last time the app was opened. */
function activityStatus(iso: string | null): { label: string; tone: string } {
  if (!iso) return { label: 'Never opened', tone: 'pill--unk' }
  const age = Date.now() - new Date(iso).getTime()
  if (age < 86_400_000) return { label: 'Active today', tone: 'pill--ok' }
  if (age < 7 * 86_400_000) return { label: 'This week', tone: 'pill--ok' }
  if (age < 30 * 86_400_000) return { label: 'This month', tone: 'pill--unk' }
  return { label: 'Inactive', tone: 'pill--unk' }
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

function Verified({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="ok">
      <AdmIcon name="okc" />
      Confirmed
    </span>
  ) : (
    <span className="warn">
      <AdmIcon name="alert" />
      Not confirmed
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
        description="How the app is used, who uses it, and what needs your attention."
        help={
          <>
            <b>Everything that reaches the server from the mobile app.</b> The app uses the same accounts and database
            as the website, so a sign-up, post, review or partner request made in the app is a real record.{' '}
            <b>Overview</b> shows how the app is doing; <b>Activity</b> is every action, newest first; <b>Users</b> is
            everyone who uses the app.
          </>
        }
        action={
          <Link className="btn btn--ink" href="/admin/app/releases">
            <AdmIcon name="refresh" />
            App updates
          </Link>
        }
      />

      <nav className="seg" aria-label="View" data-in style={{ marginBottom: 18 }}>
        {VIEWS.map((v) => (
          <Link key={v} href={buildHref(PATH, {}, { view: v === 'overview' ? undefined : v })} aria-current={view === v ? 'page' : undefined}>
            {VIEW_LABEL[v]}
          </Link>
        ))}
      </nav>

      {dash ? <Overview dash={dash} range={range} /> : null}
      {events ? <ActivityView events={events} q={q} kind={kind} page={page} params={params} /> : null}
      {users ? <UsersView users={users} q={q} status={status} page={page} params={params} /> : null}
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
  const kindTotal = kindRows.reduce((s, [, n]) => s + n, 0)
  const signupTotal = dash.signups.app + dash.signups.web
  const period = `last ${dash.days} days`

  const attentionRows = [
    { n: attention.pendingBusinesses, label: 'Charger listings to review', hint: 'Sent from the app', href: '/admin/businesses?status=pending', icon: 'building' as const },
    { n: attention.pendingServices, label: 'Service listings to review', hint: 'Sent from the app', href: '/admin/services', icon: 'wrench' as const },
    { n: attention.newMeetings, label: 'New partner meeting requests', hint: 'From the app and the website', href: '/admin/meetings?status=new', icon: 'inbox' as const },
    { n: attention.unverified, label: 'App accounts not confirmed', hint: 'Signed up, never entered their code', href: buildHref(PATH, {}, { view: 'users', status: 'unverified' }), icon: 'alert' as const },
  ].filter((row) => row.n > 0)

  return (
    <>
      <div className="period" data-in>
        <span className="chips__lab">Period</span>
        <div className="seg" role="group" aria-label="Period">
          {APP_RANGES.map((r) => (
            <Link key={r} href={buildHref(PATH, {}, { range: r === '30' ? undefined : r })} aria-current={range === r ? 'true' : undefined}>
              {r} days
            </Link>
          ))}
        </div>
        <span className="period__note">Activity numbers cover the {period}. Live counts are marked &ldquo;now&rdquo;.</span>
      </div>

      <section className="kpis kpis--5" aria-label="App figures">
        <MetricCard
          index={0}
          lit
          label="App users"
          value={dash.appUsers.toLocaleString('en-PK')}
          detail={`${dash.signups.app} new from the app, ${period}`}
          icon="phone"
          href={buildHref(PATH, {}, { view: 'users' })}
          help="Every account that has opened the mobile app at least once, or was created in it. Now, not limited to the period."
        />
        <MetricCard
          index={1}
          label="Active this week"
          value={dash.active.week.toLocaleString('en-PK')}
          detail={`${pct(dash.active.week, dash.appUsers)}% of app users · ${dash.active.day} in the last 24h`}
          icon="users"
          tone={dash.active.week > 0 ? 'good' : 'neutral'}
          href={buildHref(PATH, {}, { view: 'users', status: 'active' })}
          help="App users who opened the app in the last 7 days (now)."
        />
        <MetricCard
          index={2}
          label="Monthly active"
          value={dash.active.month.toLocaleString('en-PK')}
          detail={`${pct(dash.active.month, dash.appUsers)}% opened it in the last 30 days`}
          icon="trend"
          help="App users who opened the app at least once in the last 30 days (now)."
        />
        <MetricCard
          index={3}
          label="Actions"
          value={dash.actions.now.toLocaleString('en-PK')}
          detail={deltaPct === null ? `in the ${period}` : `${delta >= 0 ? '+' : ''}${deltaPct}% vs the ${dash.days} days before`}
          icon="pulse"
          tone={deltaPct === null ? 'neutral' : delta >= 0 ? 'good' : 'warn'}
          href={buildHref(PATH, {}, { view: 'activity' })}
          help="Everything the app sent to the server in the period, compared with the same length of time just before it."
        />
        <MetricCard
          index={4}
          label="Needs attention"
          value={String(attentionTotal)}
          detail={attentionTotal === 0 ? 'Nothing waiting on you' : 'See the list below'}
          icon="alert"
          tone={attentionTotal > 0 ? 'warn' : 'good'}
          help="Listings sent from the app waiting for review, new partner meeting requests, and app accounts whose email is not confirmed yet (now)."
        />
      </section>

      <div className="bento">
        <AppActivityChart
          className="span-8"
          index={1}
          points={dash.series}
          description={`Signed-in members who did something in the app each day, ${period}. Hover a bar for its day.`}
          help="Counted from app actions, so a member who only opened the app is not counted for that day. Days are Pakistan time."
        />

        <DashboardPanel className="span-4" index={2} title="Needs your attention" description="Work waiting in other sections.">
          {attentionRows.length === 0 ? (
            <PanelEmpty icon="okc" title="All clear." reason="Nothing from the app is waiting on you." />
          ) : (
            <ul className="queue">
              {attentionRows.map((row) => (
                <li key={row.label}>
                  <Link href={row.href}>
                    <span className="qn">{row.n}</span>
                    <div>
                      <b>{row.label}</b>
                      <span>{row.hint}</span>
                    </div>
                    <AdmIcon name="arrow" className="go" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          className="span-4"
          index={3}
          divided
          title="What people do in the app"
          description={`${kindTotal.toLocaleString('en-PK')} actions, ${period}`}
          help="App actions grouped by kind. Open one to see every action of that kind in Activity."
        >
          {kindTotal === 0 ? (
            <PanelEmpty icon="pulse" title="No actions yet." reason={`Nothing came in from the app in the ${period}.`} />
          ) : (
            <ul className="kinds">
              {kindRows.map(([key, n]) => (
                <li key={key}>
                  <Link href={buildHref(PATH, {}, { view: 'activity', kind: key })}>
                    <div>
                      <span>
                        <AdmIcon name={KIND_ICON[key]} />
                        {APP_EVENT_KINDS[key].label}
                      </span>
                      <b className="mono">
                        {n.toLocaleString('en-PK')} <small>· {pct(n, kindTotal)}%</small>
                      </b>
                    </div>
                    <i>
                      <b style={{ width: `${kindTotal ? (n / kindTotal) * 100 : 0}%` }} />
                    </i>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          className="span-4"
          index={4}
          divided
          title="Newest from the app"
          description={
            signupTotal > 0
              ? `${pct(dash.signups.app, signupTotal)}% of sign-ups in the ${period} came from the app`
              : 'Accounts created in the app'
          }
          action={
            <Link className="link" href={buildHref(PATH, {}, { view: 'users' })}>
              All users
              <AdmIcon name="arrow" />
            </Link>
          }
        >
          {dash.recentSignups.length === 0 ? (
            <PanelEmpty icon="userplus" title="No app sign-ups yet." reason="Accounts created in the app will appear here." />
          ) : (
            <ul className="rows">
              {dash.recentSignups.map((u) => (
                <li key={u.id}>
                  <Link className="urow" href={`/admin/members/${u.id}`}>
                    <span className="mav mav--sm" aria-hidden="true">
                      {initials(u.name)}
                    </span>
                    <div>
                      <b>{u.name}</b>
                      <span>{u.vehicle ?? u.email}</span>
                    </div>
                    <div className="urow__r">
                      <Verified verified={u.verified} />
                      <small>
                        <time dateTime={u.createdAt} title={formatDate(u.createdAt)}>
                          {formatRelativeTime(u.createdAt)}
                        </time>
                      </small>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <div className="span-4 stack">
          <DashboardPanel index={5} divided title="Most active members" description={`By app actions, ${period}`}>
            {dash.top.length === 0 ? (
              <PanelEmpty icon="users" title="No one yet." reason="Signed-in members who use the app will rank here." />
            ) : (
              <ol className="rows toplist">
                {dash.top.map((row, i) => (
                  <li key={row.user.id}>
                    <Link href={`/admin/members/${row.user.id}`}>
                      <span className="mono">{i + 1}</span>
                      <b>{row.user.name}</b>
                      <span className="mono">{row.actions} actions</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>

          <DashboardPanel
            index={6}
            divided
            title="Latest update"
            help="The newest update sent in App updates, and how many app users have opened the app since — they have seen its “What’s new” note."
            action={
              <Link className="link" href="/admin/app/releases">
                Manage
                <AdmIcon name="arrow" />
              </Link>
            }
          >
            {dash.release ? (
              <div className="cbody" style={{ paddingTop: 18 }}>
                <span className="ctag mono">v{dash.release.version}</span>
                <h3 className="uhead">{dash.release.title}</h3>
                <div className="reach">
                  <div>
                    <span>Seen by</span>
                    <span className="mono">
                      <b>{dash.release.reached}</b> of {dash.appUsers} · {pct(dash.release.reached, dash.appUsers)}%
                    </span>
                  </div>
                  <i>
                    <b style={{ width: `${pct(dash.release.reached, dash.appUsers)}%` }} />
                  </i>
                </div>
                <p className="tfoot" style={{ margin: '10px 0 0' }}>
                  Sent{' '}
                  <time dateTime={dash.release.sentAt} title={formatDate(dash.release.sentAt)}>
                    {formatRelativeTime(dash.release.sentAt)}
                  </time>
                </p>
                {dash.drafts > 0 ? (
                  <p className="drafts">
                    {dash.drafts} draft{dash.drafts === 1 ? '' : 's'} not sent yet
                  </p>
                ) : null}
              </div>
            ) : (
              <PanelEmpty
                icon="refresh"
                title="No update sent yet."
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

function ActivityView({ events, q, kind, page, params }: { events: Events; q: string; kind: AppEventKind; page: number; params: ListParams }) {
  const pristine = events.total === 0 && !q && kind === 'all'
  return (
    <>
      <div className="card tools" data-in>
        <div className="tools__row">
          <AdminSearch placeholder="Search by email or what happened" label="Search app activity" />
        </div>
        <AdminFilterChips
          label="What happened"
          param="kind"
          current={kind}
          path={PATH}
          params={params}
          options={APP_EVENT_KIND_KEYS.map((key) => ({ value: key, label: APP_EVENT_KINDS[key].label, count: events.counts[key] }))}
        />
      </div>

      {events.rows.length === 0 ? (
        <div className="card">
          <PanelEmpty
            icon={pristine ? 'phone' : 'search'}
            title={pristine ? 'Nothing from the app yet.' : 'Nothing matches.'}
            reason={
              pristine
                ? 'Sign-ups, posts, reviews and partner requests made in the app will appear here as they happen.'
                : 'Try another search or kind.'
            }
          />
        </div>
      ) : (
        <ActivityFeed rows={events.rows} />
      )}

      <AdminPagination path={PATH} params={params} page={page} pageSize={events.pageSize} total={events.total} noun={['action', 'actions']} />
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
      <div className="card tools" data-in>
        <div className="tools__row">
          <AdminSearch placeholder="Search name or email" label="Search app users" />
        </div>
        <AdminFilterChips
          label="Status"
          param="status"
          current={status}
          path={PATH}
          params={params}
          options={APP_USER_STATUS_KEYS.map((key) => ({ value: key, label: APP_USER_STATUSES[key], count: users.counts[key] }))}
        />
      </div>

      {users.rows.length === 0 ? (
        <div className="card">
          <PanelEmpty
            icon={q || status !== 'all' ? 'search' : 'userplus'}
            title={q || status !== 'all' ? 'Nobody matches.' : 'No app users yet.'}
            reason={
              q || status !== 'all'
                ? 'Try another name, email or status.'
                : 'Accounts appear here the first time they sign in or sign up in the app.'
            }
          />
        </div>
      ) : (
        <div className="card tablewrap" data-in>
          <table className="t">
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Vehicle</th>
                <th className="num">Saved</th>
                <th className="num">Posts</th>
                <th className="num">Reviews</th>
                <th className="num">Clubs</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.rows.map((user) => {
                const state = activityStatus(user.lastAppActiveAt)
                return (
                  <tr key={user.id}>
                    <td data-label="Member">
                      <div className="carc">
                        <span className="mav mav--sm" aria-hidden="true">
                          {initials(user.name)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="sname" style={{ fontSize: 16 }}>
                            {user.name}
                          </div>
                          <div className="ssub">{user.email}</div>
                          <div className="urow__r" style={{ textAlign: 'left', marginTop: 4 }}>
                            <Verified verified={user.verified} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={cn('pill', state.tone)}>{state.label}</span>
                      {user.lastAppActiveAt ? (
                        <div className="ssub" style={{ fontFamily: 'var(--f-ui)' }}>
                          <time dateTime={user.lastAppActiveAt} title={formatDate(user.lastAppActiveAt)}>
                            Last in app {formatRelativeTime(user.lastAppActiveAt)}
                          </time>
                        </div>
                      ) : null}
                    </td>
                    <td data-label="Joined">
                      <span className="vtag">{user.signupSource === 'app' ? 'In the app' : 'On the website'}</span>
                      <div className="ssub" style={{ fontFamily: 'var(--f-ui)' }}>
                        <time dateTime={user.createdAt} title={formatDate(user.createdAt)}>
                          {formatRelativeTime(user.createdAt)}
                        </time>
                      </div>
                    </td>
                    <td data-label="Vehicle">{user.vehicle ?? '—'}</td>
                    <td data-label="Saved" className="num">
                      {user._count.saved}
                    </td>
                    <td data-label="Posts" className="num">
                      {user.posts}
                    </td>
                    <td data-label="Reviews" className="num">
                      {user.reviews}
                    </td>
                    <td data-label="Clubs" className="num">
                      {user._count.clubs}
                    </td>
                    <td data-label="Actions">
                      <Link className="btn btn--line btn--sm" href={`/admin/members/${user.id}`}>
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

      <AdminPagination path={PATH} params={params} page={page} pageSize={users.pageSize} total={users.total} noun={['user', 'users']} />
    </>
  )
}

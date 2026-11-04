// src/app/admin/(protected)/activity/page.tsx
import Link from 'next/link'

import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { AdmIcon } from '@/components/admin/admin-icons'
import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { PanelEmpty } from '@/components/admin/DashboardPanel'
import { AUDIT_TARGETS, actionLabel, formatAuditTime, isDeletion, targetHref } from '@/components/admin/audit-format'
import { buildHref, flattenParams, pick, type ListParams } from '@/components/admin/list-params'
import { ADMIN_PAGE_SIZE, toPage, toQuery } from '@/lib/db/admin-queries'
import { APP_EVENT_KINDS, APP_EVENT_KIND_KEYS, type AppEventKind } from '@/lib/db/app-admin-queries'
import { listAuditLog } from '@/lib/db/audit'
import {
  ACTIVITY_SOURCES,
  ACTIVITY_SOURCE_KEYS,
  listMemberActivityPage,
  type ActivitySource,
} from '@/lib/db/member-activity-queries'

/**
 * Two logs, one page — the design's Activity (admin/activity.html).
 *
 * Members (the default): everything members do on the website and in the app,
 * newest first, grouped by day, with who and where. Written by the server
 * after the action succeeds.
 *
 * Admin changes: who changed what in this portal. Every admin write records a
 * row after it succeeds, with a summary written at the time, so a deleted
 * station keeps its name here.
 *
 * Read-only on purpose: a log an admin could prune from the portal it audits
 * would be a log of whatever they chose to leave in it.
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/activity'

const TYPE_LABEL: Record<(typeof AUDIT_TARGETS)[number], string> = {
  station: 'Stations',
  connector: 'Connectors',
  service: 'Services',
  business: 'Businesses',
  car: 'Cars',
  post: 'Posts',
  comment: 'Comments',
  review: 'Reviews',
  meeting: 'Meetings',
  member: 'Members',
  'app-release': 'App updates',
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  // Links from a record's "Recent admin activity" panel carry type/target: those mean the admin log.
  const view = params.type || params.target ? 'admin' : pick(params.view, ['members', 'admin'] as const, 'members')

  return (
    <>
      <AdminHeader
        title="Activity"
        description="Who did what, on the website, in the app and in this portal."
        help={
          <>
            <b>Members</b> is everything members do on the website and in the app — sign-ups, posts, replies, likes,
            clubs, reviews, saves, Partner Up requests and listings. <b>Admin changes</b> is every change an admin has
            made in this portal. Both are written by the server after the action succeeds and cannot be edited here.
          </>
        }
      />

      <nav className="seg" aria-label="Log" data-in style={{ marginBottom: 18 }}>
        <Link href={buildHref(PATH, {}, {})} aria-current={view === 'members' ? 'page' : undefined}>
          <AdmIcon name="users" />
          Members
        </Link>
        <Link href={buildHref(PATH, {}, { view: 'admin' })} aria-current={view === 'admin' ? 'page' : undefined}>
          <AdmIcon name="pen" />
          Admin changes
        </Link>
      </nav>

      {view === 'members' ? <MembersView params={params} /> : <AdminView params={params} />}
    </>
  )
}

async function MembersView({ params }: { params: ListParams }) {
  const q = toQuery(params.q)
  const page = toPage(params.page)
  const kind = pick(params.kind, APP_EVENT_KIND_KEYS, 'all') as AppEventKind
  const source = pick(params.source, ACTIVITY_SOURCE_KEYS, 'all') as ActivitySource
  const events = await listMemberActivityPage({ q, kind, source, page })
  const filtered = q || kind !== 'all' || source !== 'all'

  return (
    <>
      <div className="card tools" data-in>
        <AdminSearch placeholder="Search a name, email or what happened" label="Search member activity" />
        <div className="tools__row" style={{ justifyContent: 'space-between' }}>
          <AdminFilterChips
            label="What happened"
            param="kind"
            current={kind}
            path={PATH}
            params={params}
            options={APP_EVENT_KIND_KEYS.map((key) => ({ value: key, label: APP_EVENT_KINDS[key].label, count: events.counts[key] }))}
          />
          <AdminFilterChips
            variant="seg"
            label="Where"
            param="source"
            current={source}
            path={PATH}
            params={params}
            options={ACTIVITY_SOURCE_KEYS.map((key) => ({ value: key, label: ACTIVITY_SOURCES[key], count: events.sourceCounts[key] }))}
          />
        </div>
      </div>

      {events.rows.length === 0 ? (
        <div className="card">
          <PanelEmpty
            icon={filtered ? 'search' : 'users'}
            title={filtered ? 'Nothing matches.' : 'No member activity yet.'}
            reason={
              filtered
                ? 'Try another name, or clear the filters.'
                : 'Sign-ups, posts, reviews and partner requests appear here as they happen.'
            }
          />
        </div>
      ) : (
        <ActivityFeed rows={events.rows} />
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

async function AdminView({ params: incoming }: { params: ListParams }) {
  // Every link in this view (chips, pages) stays on the admin log.
  const params: ListParams = { ...incoming, view: 'admin' }
  const page = toPage(params.page)
  const type = pick(params.type, ['all', ...AUDIT_TARGETS] as const, 'all')
  const target = params.target?.slice(0, 200)

  const { entries, total } = await listAuditLog({
    take: ADMIN_PAGE_SIZE,
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    targetType: type === 'all' ? undefined : type,
    targetId: target,
  })

  return (
    <>
      <div className="card tools" data-in>
        <AdminFilterChips
          label="Record type"
          heading="Record"
          param="type"
          current={type}
          path={PATH}
          params={params}
          options={[{ value: 'all', label: 'Everything' }, ...AUDIT_TARGETS.map((value) => ({ value, label: TYPE_LABEL[value] }))]}
        />
        {target ? (
          <p className="scope" style={{ margin: 0 }}>
            Showing one record: <code>{target}</code>
            <Link className="btn btn--line btn--sm" href={buildHref(PATH, params, { target: undefined, view: 'admin' })}>
              <AdmIcon name="x" />
              Show all
            </Link>
          </p>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="card">
          <PanelEmpty
            icon="pen"
            title="No admin changes yet."
            reason="Edits made in this portal to stations, connectors and listings will be listed here."
          />
        </div>
      ) : (
        <div className="card tablewrap" data-in>
          <table className="t">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Action</th>
                <th scope="col">Record</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const href = isDeletion(entry.action) ? null : targetHref(entry.targetType, entry.targetId)
                return (
                  <tr key={entry.id}>
                    <td data-label="When" className="mono" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      <time dateTime={entry.createdAt}>{formatAuditTime(entry.createdAt)}</time>
                    </td>
                    <td data-label="Who">{entry.actorEmail ?? <span style={{ color: 'var(--fog)' }}>unknown</span>}</td>
                    <td data-label="Action">
                      <b style={{ fontWeight: 500 }}>{actionLabel(entry.action)}</b>
                    </td>
                    <td data-label="Record">
                      {entry.summary ? (
                        href ? (
                          <Link className="sname slink" href={href} style={{ fontSize: 16, whiteSpace: 'normal' }}>
                            {entry.summary}
                            <AdmIcon name="ext" />
                          </Link>
                        ) : (
                          <span>{entry.summary}</span>
                        )
                      ) : href ? (
                        <Link className="mono" href={href}>
                          {entry.targetId}
                        </Link>
                      ) : (
                        <span className="mono" style={{ color: 'var(--fog)' }}>
                          {entry.targetId ?? '—'}
                        </span>
                      )}
                      <div className="ssub" style={{ textTransform: 'capitalize' }}>
                        {entry.targetType}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination path={PATH} params={params} page={page} pageSize={ADMIN_PAGE_SIZE} total={total} noun={['action', 'actions']} />
    </>
  )
}

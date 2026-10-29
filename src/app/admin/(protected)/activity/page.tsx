// src/app/admin/(protected)/activity/page.tsx
import { Activity, Users, X } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { MemberEventFeed } from '@/components/admin/member-events'
import {
  AUDIT_TARGETS,
  actionLabel,
  formatAuditTime,
  isDeletion,
  targetHref,
} from '@/components/admin/audit-format'
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
import { cn } from '@/lib/utils'

/**
 * Two logs, one page.
 *
 * Members (the default): everything members do on the website and in the app —
 * sign-ups, posts, replies, likes, clubs, reviews, saves, Partner Up requests,
 * business and service listings — newest first, each with the person's name
 * and where they did it. Written by the server after the action succeeds.
 *
 * Admin changes: who changed what in this portal, newest first.
 *
 * Every admin write records a row here after it succeeds: the operator's
 * account, the action, the record, and a one-line summary written at the time
 * (so a deleted station still has its name in the log). Before this the portal
 * was one shared password and an approval could not be traced to a person at
 * all.
 *
 * Read-only on purpose. A log an admin could edit or prune from the same
 * portal it audits would be a log of whatever they chose to leave in it.
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/activity'
const VIEWS = ['members', 'admin'] as const
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { members: 'Members', admin: 'Admin changes' }

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
  // Links from a record's "Recent admin activity" panel carry type/target:
  // those always mean the admin log.
  const view = params.type || params.target ? 'admin' : pick(params.view, VIEWS, 'members')

  return (
    <>
      <AdminHeader
        title="Activity"
        help={
          <>
            <b>Members</b> is everything members do on the website and in the app — sign-ups,
            posts, replies, likes, clubs, reviews, saves, Partner Up requests and listings — with
            the person&apos;s name and whether it was the website or the app.{' '}
            <b>Admin changes</b> is every change an admin has made in this portal. Both are
            written by the server after the action succeeds and cannot be edited here.
          </>
        }
        description="Who did what, on the website, in the app and in this portal."
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <nav aria-label="Activity views" className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={buildHref(PATH, {}, { view: v === 'members' ? undefined : v })}
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

        {view === 'members' ? <MembersView params={params} /> : <AdminView params={params} />}
      </div>
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
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3">
        <AdminSearch placeholder="Search a name, email or what happened" label="Search member activity" />
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <AdminFilterChips
            label="Filter by kind"
            param="kind"
            current={kind}
            path={PATH}
            params={params}
            options={APP_EVENT_KIND_KEYS.map((key) => ({ value: key, label: APP_EVENT_KINDS[key].label, count: events.counts[key] }))}
          />
          <AdminFilterChips
            label="Filter by where it happened"
            param="source"
            current={source}
            path={PATH}
            params={params}
            options={ACTIVITY_SOURCE_KEYS.map((key) => ({ value: key, label: ACTIVITY_SOURCES[key], count: events.sourceCounts[key] }))}
          />
        </div>
      </div>

      {events.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Users size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <p className="text-ui font-semibold text-slate-900">{filtered ? 'Nothing matches that' : 'No member activity yet'}</p>
          <p className="mt-1 text-ui-sm text-slate-500">
            {filtered
              ? 'Try another name, kind or source.'
              : 'Sign-ups, posts, reviews and partner requests appear here as they happen.'}
          </p>
        </div>
      ) : (
        <MemberEventFeed rows={events.rows} />
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
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3">
          <AdminFilterChips
            label="Filter by record type"
            param="type"
            current={type}
            path={PATH}
            params={params}
            options={[
              { value: 'all', label: 'Everything' },
              ...AUDIT_TARGETS.map((value) => ({ value, label: TYPE_LABEL[value] })),
            ]}
          />
          {target ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-ui-sm text-slate-600">
              Showing one record: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-ui-xs">{target}</code>
              <Link
                href={buildHref(PATH, params, { target: undefined, view: 'admin' })}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-ui-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X size={12} aria-hidden="true" />
                Show all
              </Link>
            </p>
          ) : null}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Activity size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No activity matches</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              Changes made in the portal appear here as soon as they are saved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-ui-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-3 font-semibold">When</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Who</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Record</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const href = isDeletion(entry.action) ? null : targetHref(entry.targetType, entry.targetId)
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 align-top last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 text-ui-sm tabular-nums text-slate-500">
                        <time dateTime={entry.createdAt}>{formatAuditTime(entry.createdAt)}</time>
                      </td>
                      <td className="px-5 py-3 text-ui-sm text-slate-700">
                        {entry.actorEmail ?? <span className="text-slate-400">unknown</span>}
                      </td>
                      <td className="px-5 py-3 text-ui-sm font-medium text-slate-900">{actionLabel(entry.action)}</td>
                      <td className="px-5 py-3 text-ui-sm text-slate-600">
                        {entry.summary ? (
                          href ? (
                            <Link href={href} className="text-plug-blue-700 hover:underline">
                              {entry.summary}
                            </Link>
                          ) : (
                            entry.summary
                          )
                        ) : href ? (
                          <Link href={href} className="font-mono text-ui-xs text-plug-blue-700 hover:underline">
                            {entry.targetId}
                          </Link>
                        ) : (
                          <span className="font-mono text-ui-xs text-slate-400">{entry.targetId ?? '—'}</span>
                        )}
                        <span className="mt-0.5 block text-ui-xs capitalize text-slate-400">{entry.targetType}</span>
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
          pageSize={ADMIN_PAGE_SIZE}
          total={total}
          noun={['action', 'actions']}
        />
    </>
  )
}

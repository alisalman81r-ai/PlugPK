// src/app/admin/(protected)/activity/page.tsx
import { Activity, X } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import {
  AUDIT_TARGETS,
  actionLabel,
  formatAuditTime,
  isDeletion,
  targetHref,
} from '@/components/admin/audit-format'
import { buildHref, flattenParams, pick } from '@/components/admin/list-params'
import { ADMIN_PAGE_SIZE, toPage } from '@/lib/db/admin-queries'
import { listAuditLog } from '@/lib/db/audit'

/**
 * Who changed what, newest first.
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
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
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
      <AdminHeader
        title="Activity"
        help={
          <>
            <b>Every change an admin has made in this portal</b>, newest first: who did it,
            what they did, and to which record. Written by the server after each change
            succeeds, so it cannot be skipped from the browser. It cannot be edited here.
          </>
        }
        description={
          total === 0 ? 'Nothing recorded yet.' : `${total.toLocaleString('en-PK')} recorded actions.`
        }
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
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
                href={buildHref(PATH, params, { target: undefined })}
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
      </div>
    </>
  )
}

// src/components/admin/ActivityPanel.tsx
import { Activity, ArrowRight } from '@/components/ui/icons'
import Link from 'next/link'

import { listAuditLog } from '@/lib/db/audit'

import { actionLabel, formatAuditTime } from './audit-format'

/**
 * The last few admin actions on one record.
 *
 * On a member or business page the question is often "who changed this, and
 * when?" — a reset password, a rejection — and the answer used to be nowhere.
 * Server component: it reads the log directly and ships only the rows.
 */
export async function ActivityPanel({
  targetType,
  targetId,
  take = 8,
}: {
  targetType: string
  targetId: string
  take?: number
}) {
  // A log that cannot be read is not a reason to take the record page down.
  const { entries, total } = await listAuditLog({ targetType, targetId, take }).catch(() => ({
    entries: null,
    total: 0,
  }))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-ui-lg font-bold text-slate-900">
          <Activity size={18} className="text-slate-400" aria-hidden="true" />
          Recent admin activity
        </h2>
        {total > take ? (
          <Link
            href={`/admin/activity?type=${targetType}&target=${encodeURIComponent(targetId)}`}
            className="inline-flex items-center gap-1 text-ui-xs font-semibold text-plug-blue-600 hover:text-plug-blue-700"
          >
            All {total}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {entries === null ? (
        <p className="text-ui-sm text-amber-700">The activity log could not be read just now.</p>
      ) : entries.length === 0 ? (
        <p className="text-ui-sm text-slate-500">
          No admin has changed this record since the activity log was switched on.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-slate-100">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
              <span className="min-w-0 text-ui-sm text-slate-800">
                <span className="font-semibold">{actionLabel(entry.action)}</span>
                {entry.summary ? <span className="text-slate-500"> · {entry.summary}</span> : null}
                <span className="block text-ui-xs text-slate-400">by {entry.actorEmail ?? 'an unknown admin'}</span>
              </span>
              <time dateTime={entry.createdAt} className="shrink-0 text-ui-xs tabular-nums text-slate-400">
                {formatAuditTime(entry.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

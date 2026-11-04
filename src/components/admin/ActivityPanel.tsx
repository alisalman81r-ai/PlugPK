// src/components/admin/ActivityPanel.tsx
import Link from 'next/link'

import { listAuditLog } from '@/lib/db/audit'

import { AdmIcon } from './admin-icons'
import { actionLabel, formatAuditTime } from './audit-format'

/**
 * The last few admin actions on one record, as a card with the design's
 * activity rows (`.feed` / `.ev`). On a member or business page the question
 * is often "who changed this, and when?". Server component: it reads the log
 * directly and ships only the rows.
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
    <section className="card" aria-labelledby={`act-${targetId}`}>
      <div className="chead">
        <div>
          <h2 id={`act-${targetId}`}>Recent admin activity</h2>
          <p>Who changed this record in the portal, newest first.</p>
        </div>
        {total > take ? (
          <Link
            className="link"
            href={`/admin/activity?type=${targetType}&target=${encodeURIComponent(targetId)}`}
          >
            All {total}
            <AdmIcon name="arrow" />
          </Link>
        ) : null}
      </div>
      <div className="hr" />

      {entries === null ? (
        <p className="cbody ferr" style={{ paddingTop: 18 }}>
          The activity log could not be read just now.
        </p>
      ) : entries.length === 0 ? (
        <div className="empty">
          <span className="empty__ico">
            <AdmIcon name="pen" />
          </span>
          <b>No admin changes yet.</b>
          <p>No admin has changed this record since the activity log was switched on.</p>
        </div>
      ) : (
        <ol className="feed">
          {entries.map((entry) => (
            <li key={entry.id} className="ev">
              <span className="ev__ico">
                <AdmIcon name="pen" />
              </span>
              <div>
                <div className="ev__t">
                  {actionLabel(entry.action)}
                  {entry.summary ? <span className="ev__sum"> · {entry.summary}</span> : null}
                </div>
                <div className="ev__m">
                  <span>by {entry.actorEmail ?? 'an unknown admin'}</span>
                  <span className="sep">·</span>
                  <time className="mono" dateTime={entry.createdAt}>
                    {formatAuditTime(entry.createdAt)}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// src/components/admin/AlertList.tsx
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import type { NetworkAlert } from '@/lib/db/network-health'
import { cn } from '@/lib/utils'

/**
 * What is currently wrong, as a list of places to go.
 *
 * ── These are states, not events ──────────────────────────────────────
 *
 * There is no incident table in this product, so an alert here is the present
 * condition of a row — an offline station, a connector not reporting
 * available — read at request time. That shapes the UI in one important way:
 * there is no acknowledge or dismiss control, because there is nowhere to
 * record that it was acknowledged. A button that appeared to silence an alert
 * while changing nothing in the database would be the interface lying about
 * work it had not done.
 *
 * What each row does instead is take the operator to the record that can fix
 * it. An alert that resolves itself the moment the station is set back online
 * is a better alert than one that has to be manually cleared.
 */

/** "4 minutes ago", and nothing smaller than a minute. */
function sinceLabel(iso: string | null): string | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null

  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const SEVERITY = {
  high: { pill: 'bg-red-50 text-red-700 ring-red-200', label: 'High' },
  medium: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'Medium' },
} as const

export function AlertList({ alerts }: { alerts: NetworkAlert[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {alerts.map((alert) => {
        const severity = SEVERITY[alert.severity]
        const when = sinceLabel(alert.since)

        return (
          <li key={alert.id}>
            <Link
              href={alert.href}
              className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-blue-500"
            >
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-ui-xs font-bold uppercase tracking-[0.06em] ring-1 ring-inset',
                  severity.pill,
                )}
              >
                {severity.label}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-ui-sm font-semibold text-slate-900">
                  {alert.subject}
                </span>
                <span className="block truncate text-ui-xs text-slate-500">{alert.issue}</span>
              </span>

              {/* Only rendered where the row carries a timestamp. Connector has
                  no updatedAt, so inventing "2 minutes ago" for one would be
                  the same fabrication this dashboard avoids everywhere else. */}
              {when ? (
                <span className="hidden shrink-0 text-ui-xs tabular-nums text-slate-400 sm:block">
                  {when}
                </span>
              ) : null}

              <ChevronRight
                size={15}
                aria-hidden="true"
                className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

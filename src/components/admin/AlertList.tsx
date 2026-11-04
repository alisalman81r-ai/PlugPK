// src/components/admin/AlertList.tsx
import Link from 'next/link'

import type { NetworkAlert } from '@/lib/db/network-health'

import { AdmIcon } from './admin-icons'

/**
 * What is currently wrong, as a list of places to go — rows in the design's
 * `.queue` style: severity pill, the record and its issue, how long, and an
 * arrow that nudges on hover.
 *
 * These are states, not events: there is no incident table, so there is no
 * acknowledge or dismiss. Each row opens the record that can fix it, and the
 * alert goes away by itself when it is fixed.
 */

/** "4m ago", and nothing smaller than a minute. */
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
  high: { pill: 'pill--bad', label: 'High' },
  medium: { pill: 'pill--warn', label: 'Medium' },
} as const

export function AlertList({ alerts }: { alerts: NetworkAlert[] }) {
  return (
    <ul className="queue alerts">
      {alerts.map((alert) => {
        const severity = SEVERITY[alert.severity]
        const when = sinceLabel(alert.since)
        return (
          <li key={alert.id}>
            <Link href={alert.href}>
              <span className={`pill ${severity.pill}`}>{severity.label}</span>
              <div className="min-w-0">
                <b className="truncate">{alert.subject}</b>
                <span className="block truncate">{alert.issue}</span>
              </div>
              {/* Only where the row carries a timestamp; a connector has none. */}
              {when ? <span className="n">{when}</span> : null}
              <AdmIcon name="arrow" className={when ? 'go go--after' : 'go'} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

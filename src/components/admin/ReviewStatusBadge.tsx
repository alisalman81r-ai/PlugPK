// src/components/admin/ReviewStatusBadge.tsx
import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'

/**
 * The state of something waiting on a decision — an application, a request —
 * as the design's `.pill`. One palette for the portal: amber is waiting on you,
 * green is done, ember is refused, chalk is neutral.
 */
const STATUS: Record<string, { label: string; tone: string; ok?: boolean }> = {
  pending: { label: 'Pending', tone: 'pill--warn' },
  new: { label: 'New', tone: 'pill--warn' },
  approved: { label: 'Approved', tone: 'pill--ok', ok: true },
  handled: { label: 'Handled', tone: 'pill--ok', ok: true },
  rejected: { label: 'Rejected', tone: 'pill--bad' },
  reopened: { label: 'Reopened', tone: 'pill--unk' },
}

export function ReviewStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS[status] ?? { label: status, tone: 'pill--unk' }
  return (
    <span className={cn('pill', config.tone, className)}>
      {config.ok ? <AdmIcon name="okc" /> : null}
      {config.label}
    </span>
  )
}

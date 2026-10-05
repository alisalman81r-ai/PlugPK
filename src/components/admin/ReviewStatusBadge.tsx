// src/components/admin/ReviewStatusBadge.tsx
import { Check, CircleSlash, Clock, Undo2 } from '@/components/ui/icons'
import type { IconType } from '@/components/ui/icons'

import { cn } from '@/lib/utils'

/**
 * The state of something waiting on a decision: an application, a request.
 *
 * The sibling of AdminStatusBadge, which describes whether a charger works.
 * Same rule — an icon and a word, never colour alone — and one palette for
 * the whole portal: amber is waiting on you, green is done, red is refused.
 * The business list used to paint "pending" in the primary button colour, so
 * the one state that needed action looked like a control.
 */
const STATUS: Record<string, { label: string; icon: IconType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  new: { label: 'New', icon: Clock, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  approved: { label: 'Approved', icon: Check, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  handled: { label: 'Handled', icon: Check, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', icon: CircleSlash, className: 'border-red-200 bg-red-50 text-red-700' },
  reopened: { label: 'Reopened', icon: Undo2, className: 'border-slate-200 bg-slate-50 text-slate-600' },
}

export function ReviewStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS[status] ?? { label: status, icon: Clock, className: 'border-slate-200 bg-slate-50 text-slate-600' }
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-ui-xs font-semibold',
        config.className,
        className,
      )}
    >
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      {config.label}
    </span>
  )
}

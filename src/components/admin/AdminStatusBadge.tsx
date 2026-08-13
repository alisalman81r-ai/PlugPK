// src/components/admin/AdminStatusBadge.tsx
import { AlertTriangle, CircleSlash, HelpCircle, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type AdminStatus = 'available' | 'limited' | 'offline' | 'unknown'

interface StatusConfig {
  label: string
  icon: LucideIcon
  className: string
}

/**
 * Each status carries an icon and a word, never colour alone.
 *
 * An operator scanning a status column for outages is exactly the person
 * most likely to be colour-blind about it — roughly one man in twelve cannot
 * separate the amber "limited" from the green "available" reliably. The
 * shape and the label do the work; colour only reinforces them.
 */
const STATUS: Record<AdminStatus, StatusConfig> = {
  available: {
    label: 'Available',
    icon: Zap,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  limited: {
    label: 'Limited',
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  offline: {
    label: 'Offline',
    icon: CircleSlash,
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  unknown: {
    label: 'Unknown',
    icon: HelpCircle,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
}

export interface AdminStatusBadgeProps {
  status: string
  className?: string
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const config = STATUS[status as AdminStatus] ?? STATUS.unknown
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-ui-xs font-semibold',
        config.className,
        className,
      )}
    >
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      {config.label}
    </span>
  )
}

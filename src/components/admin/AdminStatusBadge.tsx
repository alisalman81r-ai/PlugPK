// src/components/admin/AdminStatusBadge.tsx
import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'

export type AdminStatus = 'available' | 'limited' | 'offline' | 'unknown'

/**
 * Whether a charger works, as the design's `.pill`: green Available with a
 * bolt, amber Limited, ember Offline, chalk Unknown with a `?`. Every state is
 * a word as well as a colour, so it never depends on telling amber from green.
 */
const STATUS: Record<AdminStatus, { label: string; tone: string; icon?: 'bolt' | 'q' }> = {
  available: { label: 'Available', tone: 'pill--ok', icon: 'bolt' },
  limited: { label: 'Limited', tone: 'pill--warn' },
  offline: { label: 'Offline', tone: 'pill--bad' },
  unknown: { label: 'Unknown', tone: 'pill--unk', icon: 'q' },
}

export interface AdminStatusBadgeProps {
  status: string
  className?: string
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const config = STATUS[status as AdminStatus] ?? STATUS.unknown
  return (
    <span className={cn('pill', config.tone, className)}>
      {config.icon ? <AdmIcon name={config.icon} /> : null}
      {config.label}
    </span>
  )
}

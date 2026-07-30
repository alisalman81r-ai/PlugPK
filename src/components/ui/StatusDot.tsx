// src/components/ui/StatusDot.tsx
import type { StationStatus } from '@/lib/types'
import { cn, getStatusConfig } from '@/lib/utils'

type DotSize = 'sm' | 'md' | 'lg'

/** #22C55E / #F59E0B / #EF4444 / #94A3B8 as Tailwind tokens. */
const DOT_COLOR: Record<StationStatus, string> = {
  available: 'bg-green-500',
  limited: 'bg-amber-500',
  offline: 'bg-red-500',
  unknown: 'bg-slate-400',
}

const DOT_SIZE: Record<DotSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}

const LABEL_SIZE: Record<DotSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
}

export interface StatusDotProps {
  status: StationStatus
  size?: DotSize
  showLabel?: boolean
  className?: string
}

export function StatusDot({ status, size = 'md', showLabel = false, className }: StatusDotProps) {
  const config = getStatusConfig(status)

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('relative inline-flex shrink-0', DOT_SIZE[size])}>
        <span className={cn('absolute inset-0 rounded-full', DOT_COLOR[status])} />
        {config.pulse ? (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full',
              DOT_COLOR[status],
              'animate-pulse-ring',
            )}
          />
        ) : null}
      </span>

      {showLabel ? (
        <span className={cn('font-medium', LABEL_SIZE[size], config.textClass)}>{config.label}</span>
      ) : null}
    </span>
  )
}

export interface StatusBadgeProps {
  status: StationStatus
  className?: string
}

const BADGE_COLOR: Record<StationStatus, string> = {
  available: 'border-green-200 bg-green-50 text-green-700',
  limited: 'border-amber-200 bg-amber-50 text-amber-700',
  offline: 'border-red-200 bg-red-50 text-red-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-600',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
        BADGE_COLOR[status],
        className,
      )}
    >
      <span className="relative inline-flex h-2 w-2 shrink-0">
        <span className={cn('absolute inset-0 rounded-full', DOT_COLOR[status])} />
        {config.pulse ? (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full',
              DOT_COLOR[status],
              'animate-pulse-ring',
            )}
          />
        ) : null}
      </span>
      {config.label}
    </span>
  )
}

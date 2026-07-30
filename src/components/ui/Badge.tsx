// src/components/ui/Badge.tsx
import type { ConnectorType, StationStatus } from '@/lib/types'
import { cn, getConnectorConfig, getSpeedConfig, getStatusConfig } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'connector' | 'speed' | 'status' | 'default'
  connectorType?: ConnectorType
  speedKw?: number
  status?: StationStatus
  label?: string
  size?: 'sm' | 'md'
  className?: string
  showIcon?: boolean
}

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px] font-semibold',
  md: 'px-3 py-1 text-xs font-semibold',
}

const DOT_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
}

/**
 * Status dot colours. `getStatusConfig()` exposes only a hex value, which would
 * require an inline style, so the equivalent Tailwind tokens are mapped here.
 */
const STATUS_DOT_COLOR: Record<StationStatus, string> = {
  available: 'bg-green-500',
  limited: 'bg-amber-500',
  offline: 'bg-red-500',
  unknown: 'bg-slate-400',
}

// No `leading-*` here: tailwind-merge treats font-size and line-height as one
// conflict group, so the `text-*` class in SIZE_CLASSES would strip it anyway.
// The line-height that ships with each text size gives the right pill height.
const BASE = 'inline-flex items-center rounded-full border align-middle'

export function Badge({
  variant = 'default',
  connectorType,
  speedKw,
  status,
  label,
  size = 'md',
  className,
  showIcon = true,
}: BadgeProps) {
  if (variant === 'connector' && connectorType) {
    const config = getConnectorConfig(connectorType)

    return (
      <span
        className={cn(
          BASE,
          SIZE_CLASSES[size],
          config.bgClass,
          config.textClass,
          config.borderClass,
          className,
        )}
        title={config.description}
      >
        {label ?? config.label}
      </span>
    )
  }

  if (variant === 'speed' && speedKw !== undefined) {
    const config = getSpeedConfig(speedKw)

    return (
      <span
        className={cn(
          BASE,
          SIZE_CLASSES[size],
          // getSpeedConfig() carries no border colour; a transparent border
          // keeps the box height identical to the other badge variants.
          'border-transparent',
          config.bgClass,
          config.textClass,
          size === 'sm' ? 'gap-1' : 'gap-1.5',
          className,
        )}
        title={config.label}
      >
        {showIcon ? <span aria-hidden="true">⚡</span> : null}
        {label ?? `${speedKw} kW`}
      </span>
    )
  }

  if (variant === 'status' && status) {
    const config = getStatusConfig(status)

    return (
      <span
        className={cn(
          BASE,
          SIZE_CLASSES[size],
          config.bgClass,
          config.textClass,
          config.borderClass,
          size === 'sm' ? 'gap-1.5' : 'gap-2',
          className,
        )}
      >
        {showIcon ? (
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 rounded-full',
              DOT_CLASSES[size],
              STATUS_DOT_COLOR[status],
              config.pulse && 'animate-pulse',
            )}
          />
        ) : null}
        {label ?? config.label}
      </span>
    )
  }

  // Default badge, and the fallback when a variant is missing the prop it
  // needs (e.g. variant="status" with no status) so nothing renders unstyled.
  if (!label) return null

  return (
    <span
      className={cn(BASE, SIZE_CLASSES[size], 'border-slate-200 bg-slate-100 text-slate-700', className)}
    >
      {label}
    </span>
  )
}

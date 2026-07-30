// src/components/ui/ConnectorBadge.tsx
import { Plug } from 'lucide-react'

import type { Connector, ConnectorType } from '@/lib/types'
import { cn, getConnectorConfig } from '@/lib/utils'

type BadgeSize = 'sm' | 'md'

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs font-semibold',
}

export interface ConnectorBadgeProps {
  type: ConnectorType
  size?: BadgeSize
  showIcon?: boolean
  className?: string
}

export function ConnectorBadge({
  type,
  size = 'md',
  showIcon = false,
  className,
}: ConnectorBadgeProps) {
  const config = getConnectorConfig(type)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border align-middle',
        SIZE_CLASSES[size],
        config.bgClass,
        config.textClass,
        config.borderClass,
        className,
      )}
      title={config.description}
    >
      {showIcon ? <Plug size={12} className="shrink-0" aria-hidden="true" /> : null}
      {config.label}
    </span>
  )
}

export interface ConnectorBadgeGroupProps {
  connectors: Connector[]
  max?: number
  size?: BadgeSize
  className?: string
}

export function ConnectorBadgeGroup({
  connectors,
  max = 3,
  size = 'md',
  className,
}: ConnectorBadgeGroupProps) {
  const visible = connectors.slice(0, max)
  const overflow = connectors.length - visible.length

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((connector) => (
        <ConnectorBadge key={connector.id} type={connector.type} size={size} />
      ))}

      {overflow > 0 ? (
        <span
          className={cn(
            'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 align-middle text-slate-600',
            SIZE_CLASSES[size],
          )}
          title={`${overflow} more connector${overflow === 1 ? '' : 's'}`}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  )
}

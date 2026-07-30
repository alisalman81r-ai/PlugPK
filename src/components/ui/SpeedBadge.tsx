// src/components/ui/SpeedBadge.tsx
import { Zap } from 'lucide-react'

import { cn, getSpeedConfig } from '@/lib/utils'

type BadgeSize = 'sm' | 'md'

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs font-semibold',
}

/**
 * getSpeedConfig() supplies the background and text colour but no border, so the
 * matching border tint is resolved here. Thresholds mirror getSpeedConfig().
 */
function getSpeedBorderClass(speedKw: number): string {
  if (speedKw >= 150) return 'border-blue-200'
  if (speedKw >= 50) return 'border-amber-200'
  if (speedKw >= 7) return 'border-green-200'
  return 'border-slate-200'
}

export interface SpeedBadgeProps {
  speedKw: number
  size?: BadgeSize
  className?: string
}

export function SpeedBadge({ speedKw, size = 'md', className }: SpeedBadgeProps) {
  const config = getSpeedConfig(speedKw)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border align-middle',
        SIZE_CLASSES[size],
        config.bgClass,
        config.textClass,
        getSpeedBorderClass(speedKw),
        className,
      )}
      title={config.label}
    >
      <Zap size={12} className="shrink-0" aria-hidden="true" />
      {speedKw} kW
    </span>
  )
}

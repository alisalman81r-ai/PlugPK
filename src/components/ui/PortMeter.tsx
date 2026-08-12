// src/components/ui/PortMeter.tsx
import { cn } from '@/lib/utils'

export interface PortMeterProps {
  available: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  /** Renders the "n of m free" text beside the segments. */
  showLabel?: boolean
  /** Inverts the label colours for use over photography or dark panels. */
  onDark?: boolean
  className?: string
}

const BAR_HEIGHT: Record<NonNullable<PortMeterProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

const LABEL_SIZE: Record<NonNullable<PortMeterProps['size']>, string> = {
  sm: 'text-ui-xs',
  md: 'text-xs',
  lg: 'text-sm',
}

/**
 * One segment per physical port: filled means free, hollow means occupied.
 *
 * A percentage bar would be wrong here — a driver does not care that a
 * station is "50% available", they care that two plugs are open. Segments
 * keep the count literal and readable at a glance, and the shape is
 * distinctive enough to work as the product's recurring signal for
 * availability: on cards, in the map preview, in the hero, on the station
 * page. Colour follows the same thresholds the status pills use.
 *
 * Purely presentational, so it carries no ARIA of its own — every caller
 * either renders the label or already states availability in adjacent text.
 */
export function PortMeter({
  available,
  total,
  size = 'md',
  showLabel = true,
  onDark = false,
  className,
}: PortMeterProps) {
  if (total <= 0) return null

  // Above eight ports the segments stop being countable, so the bar switches
  // to a proportional fill and the label carries the exact numbers.
  const isCountable = total <= 8
  const ratio = available / total

  const tone =
    available === 0
      ? 'bg-slate-300'
      : ratio <= 0.34
        ? 'bg-amber-500'
        : 'bg-plug-blue-600'

  const emptyTone = onDark ? 'bg-white/20' : 'bg-slate-200'

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('flex flex-1 items-center gap-1', BAR_HEIGHT[size])}
        aria-hidden="true"
      >
        {isCountable ? (
          Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-full flex-1 rounded-full transition-colors duration-200',
                index < available ? tone : emptyTone,
              )}
            />
          ))
        ) : (
          <span className={cn('h-full w-full overflow-hidden rounded-full', emptyTone)}>
            <span
              className={cn('block h-full rounded-full transition-[width] duration-500', tone)}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </span>
        )}
      </span>

      {showLabel ? (
        <span
          className={cn(
            'shrink-0 whitespace-nowrap font-mono font-semibold',
            LABEL_SIZE[size],
            onDark ? 'text-white' : available === 0 ? 'text-slate-400' : 'text-slate-700',
          )}
        >
          {available}/{total} free
        </span>
      ) : null}
    </span>
  )
}

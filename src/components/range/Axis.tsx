// src/components/range/Axis.tsx
import { cn } from '@/lib/utils'

import { axisTicks } from './realism'

/**
 * A km scale under a set of bars (landing-v2 .rc__axis / .cmp__axis): ticks
 * at round figures between a and b, the last one carrying the unit. The end
 * labels hug the edges so they never spill past the card.
 */
export function Axis({ a, b, dark = false, className }: { a: number; b: number; dark?: boolean; className?: string }) {
  const ticks = axisTicks(a, b)
  return (
    <div
      aria-hidden="true"
      className={cn('relative h-6 border-t', dark ? 'border-white/[0.14]' : 'border-ink/10', className)}
    >
      {ticks.map((v, i) => {
        const left = ((v - a) / (b - a)) * 100
        const first = left <= 2
        const last = i === ticks.length - 1 && left >= 92
        return (
          <span
            key={v}
            className={cn(
              'absolute top-0 whitespace-nowrap pt-[7px] font-mono text-[11px] font-medium leading-none',
              dark ? 'text-white/45' : 'text-muted',
              first ? 'translate-x-0' : last ? '-translate-x-full' : '-translate-x-1/2',
            )}
            style={{ left: `${left}%` }}
          >
            <span
              className={cn(
                'absolute -top-px h-[5px] w-px',
                dark ? 'bg-white/30' : 'bg-ink/30',
                first ? 'left-0' : last ? 'right-0' : 'left-1/2',
              )}
            />
            {v.toLocaleString('en-PK')}
            {i === ticks.length - 1 ? ' km' : ''}
          </span>
        )
      })}
    </div>
  )
}

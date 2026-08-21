// src/components/ui/PillButton.tsx
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The pill-and-badge call to action: a full-round pill with its label on the
 * left and a circular badge on the right holding a diagonal arrow.
 *
 * The movement is a swap, not a nudge. Two arrows sit stacked in the badge and
 * it clips them: on hover the first leaves through the top-right corner while
 * the second arrives from the bottom-left, so the arrow appears to travel
 * through the circle rather than drift inside it. The travel is 24px on a 40px
 * badge — far enough to clear the clip at both ends, so neither arrow is ever
 * caught halfway.
 *
 * Extracted from the route promo, which had the only copy. The free band now
 * wants the same button, and two hand-maintained copies of a twenty-line
 * effect drift apart — the second one always ends up with a slightly different
 * duration or travel distance.
 *
 * CSS rather than the framer-motion presets in AnimatedIcon, deliberately.
 * There are two glyphs moving in opposite directions here, both driven by the
 * same parent hover, which `group-hover` expresses directly; and staying on
 * CSS keeps this usable from server components without a client boundary.
 */

export interface PillButtonProps {
  href: string
  children: React.ReactNode
  /**
   * Which surface it sits on. `dark` is the reference: a dark pill with a
   * white badge, for light sections. `light` inverts it for dark sections —
   * a white pill takes the dark badge.
   */
  tone?: 'dark' | 'light'
  className?: string
}

export function PillButton({ href, children, tone = 'dark', className }: PillButtonProps) {
  const isDark = tone === 'dark'

  /**
   * Both arrows carry the same transform classes, so the pair is built here
   * rather than written twice. The second starts offset by the travel
   * distance, which is what puts it out of sight until the first leaves.
   */
  const arrow = 'absolute transition-transform duration-300 ease-out motion-reduce:transition-none'

  return (
    <Link
      href={href}
      className={cn(
        'group/cta inline-flex h-14 items-center gap-4 rounded-full pl-7 pr-2 text-ui font-bold',
        'transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none',
        'motion-reduce:hover:translate-y-0',
        isDark
          ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-[0_14px_34px_-12px_rgba(37,99,235,0.45)] focus-visible:ring-plug-blue-500'
          : 'bg-white text-slate-950 hover:shadow-[0_14px_34px_-12px_rgba(255,255,255,0.35)] focus-visible:ring-cyan-400 focus-visible:ring-offset-slate-950',
        className,
      )}
    >
      {children}

      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full',
          isDark ? 'bg-white text-slate-900' : 'bg-slate-950 text-white',
        )}
      >
        {/* Leaves through the top-right. */}
        <ArrowUpRight
          size={18}
          className={cn(
            arrow,
            'group-hover/cta:-translate-y-6 group-hover/cta:translate-x-6',
            'motion-reduce:group-hover/cta:translate-x-0 motion-reduce:group-hover/cta:translate-y-0',
          )}
        />
        {/* Arrives from the bottom-left. Hidden outright under reduced motion,
            since with no travel it would simply sit on top of the first. */}
        <ArrowUpRight
          size={18}
          className={cn(
            arrow,
            '-translate-x-6 translate-y-6',
            'group-hover/cta:translate-x-0 group-hover/cta:translate-y-0',
            'motion-reduce:hidden',
          )}
        />
      </span>
    </Link>
  )
}

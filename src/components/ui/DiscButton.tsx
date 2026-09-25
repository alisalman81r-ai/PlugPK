// src/components/ui/DiscButton.tsx
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The pill-and-disc call to action: a round disc holding an icon sits at the
 * left of the pill, and on hover it slides across to the right and turns
 * turquoise while the pill turns light, so the label and the disc trade
 * places in one move.
 *
 * Every instance carries the `disc-cta` class. That is the hook a surrounding
 * panel uses to react to the button — a named group on the panel plus
 * `group-has-[.disc-cta:hover]/<name>:` on whatever should change — which is
 * how Partner Up fades its photo in and the community card brings up its chat,
 * with no state and no client boundary.
 *
 * The disc's travel is computed from the pill's width, so a longer label only
 * needs a wider `width`, never a hand-tuned translate.
 */

export interface DiscButtonProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  /** The surface it rests on. `dark` is a glass pill, `light` a solid ink one. */
  tone?: 'dark' | 'light'
  /** Any CSS length. The disc travels this minus its own size and insets. */
  width?: string
  className?: string
}

const REST = {
  dark: 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md',
  light: 'bg-plug-navy-950 text-white',
} as const

export function DiscButton({
  href,
  icon,
  children,
  tone = 'dark',
  width = '15rem',
  className,
}: DiscButtonProps) {
  const ease = 'duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none'

  return (
    <Link
      href={href}
      style={{ '--disc-w': width } as React.CSSProperties}
      className={cn(
        'disc-cta group/disc relative flex h-16 w-[var(--disc-w)] items-center rounded-full text-ui-lg font-semibold',
        'transition-colors duration-500 ease-out motion-reduce:transition-none',
        'hover:bg-white/90 hover:text-slate-900 focus-visible:bg-white/90 focus-visible:text-slate-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400',
        REST[tone],
        className,
      )}
    >
      {/* 3.25rem disc, 0.375rem inset each side. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-1.5 top-1.5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-white text-plug-navy-950',
          'shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)] transition-[transform,background-color,color]',
          'group-hover/disc:translate-x-[calc(var(--disc-w)-4rem)] group-hover/disc:bg-plug-cyan-600 group-hover/disc:text-white',
          'group-focus-visible/disc:translate-x-[calc(var(--disc-w)-4rem)] group-focus-visible/disc:bg-plug-cyan-600 group-focus-visible/disc:text-white',
          ease,
        )}
      >
        {icon}
      </span>

      {/* The label slides the other way, so it stays centred in the free side. */}
      <span
        className={cn(
          'w-full whitespace-nowrap pl-[4.25rem] pr-4 text-center transition-[padding]',
          'group-hover/disc:pl-4 group-hover/disc:pr-[4.25rem] group-focus-visible/disc:pl-4 group-focus-visible/disc:pr-[4.25rem]',
          ease,
        )}
      >
        {children}
      </span>
    </Link>
  )
}

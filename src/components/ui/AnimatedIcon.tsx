// src/components/ui/AnimatedIcon.tsx
'use client'

import { type Transition, type Variants, motion, useReducedMotion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Motion for a single icon.
 *
 * Takes the icon as `children` rather than as an `icon={Search}` prop on
 * purpose. A component reference cannot cross the server/client boundary — it
 * is not serialisable — so an `icon` prop would break every server component
 * that holds its icons in a module-level array, which is most of this codebase
 * (HowItWorks, ServicesPreview, the admin nav). A rendered element passed as
 * children crosses that boundary fine, so the same wrapper works everywhere
 * without turning pages into client components to get it.
 *
 * Every preset is transform-only for the same reason: transforms apply to the
 * wrapper, so nothing needs to reach inside lucide's SVG paths. They also stay
 * on the compositor, which matters when a page has thirty of them.
 *
 * Two ways to fire, and both are needed:
 *
 *   - On its own hover, which is the standalone case.
 *   - From a parent. framer-motion propagates variant *labels* down to child
 *     motion components, so a card declaring whileHover="hover" animates the
 *     icon inside it. That is what the existing `group`/`group-hover:` cards
 *     already express in CSS, and it keeps the icon's motion in sync with the
 *     border and shadow changes rather than firing on a separate trigger.
 */

export type IconMotion =
  | 'scan'
  | 'slide'
  | 'travel'
  | 'pulse'
  | 'spin'
  | 'pop'
  | 'swing'
  | 'lift'

const SPRING: Transition = { type: 'spring', stiffness: 400, damping: 15 }

/**
 * Chosen by what the icon depicts, not by what looks busiest — a magnifier
 * sweeps, an arrow travels, a bell rings, a star lands. An icon whose motion
 * contradicts its meaning is worse than a still one.
 */
const MOTIONS: Record<IconMotion, Variants> = {
  /** Magnifier, filter, anything that looks over something. */
  scan: {
    rest: { x: 0, y: 0, scale: 1, rotate: 0 },
    hover: {
      x: [0, -2, 2, 0],
      y: [0, -2, 2, 0],
      scale: 1.1,
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  },
  /** Sliders and controls: the knobs move along their track. */
  slide: {
    rest: { x: 0, scale: 1 },
    hover: {
      x: [0, -2.5, 2.5, 0],
      scale: 1.08,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },
  /** Arrows, send, navigation — it leaves in the direction it points. */
  travel: {
    rest: { x: 0, y: 0, scale: 1 },
    hover: { x: 3, y: -3, scale: 1.06, transition: SPRING },
  },
  /** Heart, zap, activity: one beat. */
  pulse: {
    rest: { scale: 1 },
    hover: { scale: [1, 1.22, 1.06], transition: { duration: 0.55, ease: 'easeOut' } },
  },
  /** Loaders, refresh, settings. */
  spin: {
    rest: { rotate: 0, scale: 1 },
    hover: { rotate: 180, scale: 1.06, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  },
  /** Star, check, badge — overshoots, then settles. */
  pop: {
    rest: { scale: 1, rotate: 0 },
    hover: {
      scale: [1, 1.28, 1.1],
      rotate: [0, -10, 0],
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  },
  /** Bell, alert: it rings. */
  swing: {
    rest: { rotate: 0 },
    hover: { rotate: [0, -14, 12, -8, 0], transition: { duration: 0.65, ease: 'easeInOut' } },
  },
  /** Upload, download, plus — a short hop. */
  lift: {
    rest: { y: 0, scale: 1 },
    hover: { y: [0, -4, 0], scale: 1.06, transition: { duration: 0.5, ease: 'easeOut' } },
  },
}

export interface AnimatedIconProps {
  /** The rendered icon, e.g. `<Search size={28} />`. */
  children: React.ReactNode
  motion?: IconMotion
  /**
   * Fire on this element's own hover. Leave off when a parent motion component
   * drives the variant, so the two triggers cannot fight over the same element.
   */
  standalone?: boolean
  className?: string
}

export function AnimatedIcon({
  children,
  motion: name = 'pop',
  standalone = false,
  className,
}: AnimatedIconProps) {
  const reduced = useReducedMotion()

  // Rendered rather than returned early so the markup does not change shape
  // between the two branches — a bare span keeps the layout identical.
  if (reduced) {
    return <span className={cn('inline-flex', className)}>{children}</span>
  }

  return (
    <motion.span
      className={cn('inline-flex', className)}
      variants={MOTIONS[name]}
      initial="rest"
      // No `animate` on purpose: setting it here would stop the parent's
      // variant label from reaching this element, which is the whole
      // mechanism behind the card-hover case.
      whileHover={standalone ? 'hover' : undefined}
    >
      {children}
    </motion.span>
  )
}

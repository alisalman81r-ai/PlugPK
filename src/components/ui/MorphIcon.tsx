// src/components/ui/MorphIcon.tsx
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Two icons, one slot: the state-morph half of the reference component.
 *
 * This is for icons that stand for a state rather than a label — a menu that
 * is open or closed, a password that is shown or hidden, a copy button that
 * has just been used. The old icon leaves while the new one arrives, both
 * rotating and scaling through the swap, so the change reads as one thing
 * turning into another rather than two icons flickering.
 *
 * Deliberately not applied to icons that only name something. A magnifier
 * beside "Search" has no second state, and giving it one would be motion for
 * its own sake — those get AnimatedIcon instead.
 *
 * `on`/`off` are component references, so this may only be used from a client
 * component. Every place it belongs — a toggle, a disclosure, a copy button —
 * is already one.
 */

export interface MorphIconProps {
  /** True shows `on`, false shows `off`. */
  active: boolean
  on: LucideIcon
  off: LucideIcon
  size?: number
  strokeWidth?: number
  /** Degrees the outgoing icon turns as it leaves. */
  turn?: number
  className?: string
}

export function MorphIcon({
  active,
  on: On,
  off: Off,
  size = 20,
  strokeWidth = 2,
  turn = 90,
  className,
}: MorphIconProps) {
  const reduced = useReducedMotion()
  const Icon = active ? On : Off

  if (reduced) {
    return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
  }

  return (
    /*
     * The grid is what stops the swap from shifting layout. Both icons occupy
     * the same cell for the overlap, so the box never collapses to zero width
     * between them — which is what an absolutely positioned version gets wrong
     * the moment it sits inside a flex row.
     */
    <span
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={active ? 'on' : 'off'}
          className="absolute inset-0 grid place-items-center"
          initial={{ opacity: 0, rotate: -turn, scale: 0.55 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: turn, scale: 0.55 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        >
          <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * A glyph that turns to mark an open/closed state — the disclosure chevrons.
 *
 * Separate from MorphIcon because there is only one icon involved: nothing is
 * being replaced, it is the same arrow pointing the other way. Spring rather
 * than the CSS `transition-transform` these had, so it settles instead of
 * stopping dead on the easing curve.
 *
 * Only for chevrons driven by React state. The FAQ lists use `<details>` with
 * `group-open:rotate-180`, which has no state to read — converting those to
 * controlled components to gain a spring would trade away the native
 * disclosure behaviour for very little.
 */
export interface TurnIconProps {
  children: React.ReactNode
  active: boolean
  /** Degrees when active. */
  degrees?: number
  className?: string
}

export function TurnIcon({ children, active, degrees = 180, className }: TurnIconProps) {
  const reduced = useReducedMotion()

  return (
    <motion.span
      className={cn('inline-flex shrink-0', className)}
      animate={{ rotate: active ? degrees : 0 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 26 }}
    >
      {children}
    </motion.span>
  )
}

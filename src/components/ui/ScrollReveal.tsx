// src/components/ui/ScrollReveal.tsx
'use client'

import { motion, useReducedMotion, type Transition, type UseInViewOptions, type Variants } from 'framer-motion'
import * as React from 'react'

/**
 * An element that animates into view when it enters the viewport.
 *
 * After cnippet's Scroll Reveal (21st.dev): any Motion variant pair, a
 * configurable threshold, once-only by default. The defaults are that
 * component's card demo — fade up 24px over 0.5s, easeOut, when 30% of it is
 * showing — so a stagger is just a `delay` per item.
 *
 * Under prefers-reduced-motion it renders in place, already visible: the
 * content is never hidden waiting for an animation that will not run.
 */

const DEFAULT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const DEFAULT_TRANSITION: Transition = { duration: 0.5, ease: 'easeOut' }

export interface ScrollRevealProps {
  children: React.ReactNode
  variants?: Variants
  transition?: Transition
  /** When it counts as in view. `once` defaults to true. */
  viewOptions?: Pick<UseInViewOptions, 'amount' | 'margin' | 'once'>
  as?: 'div' | 'li' | 'section' | 'article'
  className?: string
}

export function ScrollReveal({
  children,
  variants = DEFAULT_VARIANTS,
  transition,
  viewOptions,
  as = 'div',
  className,
}: ScrollRevealProps) {
  const reduce = useReducedMotion()
  const Component = motion[as]

  if (reduce) return React.createElement(as, { className }, children)

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3, ...viewOptions }}
      transition={{ ...DEFAULT_TRANSITION, ...transition }}
    >
      {children}
    </Component>
  )
}

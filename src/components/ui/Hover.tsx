// src/components/ui/Hover.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import * as React from 'react'

/**
 * Hover triggers for icons that live inside a server-rendered card.
 *
 * AnimatedIcon animates from a variant label handed down by a parent motion
 * component. Most cards on this site are server components — the ecosystem
 * grid awaits its counts, the station cards await their rows — and a server
 * component cannot render motion.div. These two are the client shim that
 * closes that gap: the server renders the card's contents as children, and
 * this declares the hover on the way past.
 *
 * Why two rather than one with an `as` prop: half the cards are a div and half
 * are the whole card wrapped in a Link. Wrapping an anchor in an extra div is
 * what breaks a flex row or a grid child, so the anchor case keeps being an
 * anchor.
 */

/**
 * Spread onto any motion element to put the AnimatedIcons beneath it into
 * their `hover` variant. Exported because plenty of cards are already client
 * components with their own wrapper element — an <article>, a <li> — and
 * wrapping those in one of the components below would put a stray div between
 * a grid and its child.
 */
export const hoverTrigger = {
  initial: 'rest',
  whileHover: 'hover',
  whileFocus: 'hover',
} as const

const HOVER = hoverTrigger

export interface HoverMotionProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode
}

/** A div that puts every AnimatedIcon beneath it into its `hover` variant. */
export function HoverMotion({ children, ...rest }: HoverMotionProps) {
  return (
    <motion.div {...HOVER} {...rest}>
      {children}
    </motion.div>
  )
}

export type HoverButtonProps = React.ComponentProps<typeof motion.button>

/** The same again, as a button — for CTAs that submit rather than navigate. */
export function HoverButton({ children, ...rest }: HoverButtonProps) {
  return (
    <motion.button {...HOVER} {...rest}>
      {children}
    </motion.button>
  )
}

/*
 * motion.create rather than motion().
 *
 * Calling motion as a function is deprecated in framer-motion 11 and logs a
 * warning on every page that renders a card — which, since HoverLink is what
 * most card links are built from, was every page on the site. Same component,
 * same behaviour, no console noise.
 */
const MotionLink = motion.create(Link)

export type HoverLinkProps = React.ComponentProps<typeof MotionLink>

/**
 * The same, as an anchor. Used for cards that are entirely a link and for
 * buttons whose arrow should travel — keeping the markup a single element so
 * no wrapper lands between a flex parent and its child.
 */
export function HoverLink({ children, ...rest }: HoverLinkProps) {
  return (
    <MotionLink {...HOVER} {...rest}>
      {children}
    </MotionLink>
  )
}

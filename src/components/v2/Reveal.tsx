// src/components/v2/Reveal.tsx
//
// landing-v2's [data-reveal] and [data-count], as components. They only emit
// the data attributes; the motion itself is run by
// components/motion/MotionProvider with GSAP (pages.js ported): revealed
// content rises 32px and fades in as it scrolls into view, once, on expo.out,
// with neighbours staggered 0.07s; counters count up from 0.
//
// Server-safe: no hooks, no client boundary. Without script, or with reduced
// motion, everything renders in place.

import * as React from 'react'

type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Kept for call sites written against the earlier API; GSAP batches the timing. */
  delay?: number
  y?: number
}

export function Reveal({ delay: _delay, y: _y, children, ...rest }: DivProps) {
  return (
    <div data-reveal="" {...rest}>
      {children}
    </div>
  )
}

/** A grid or list whose <RevealItem> children enter one after another. */
export function RevealGroup({ children, stagger: _stagger, ...rest }: React.HTMLAttributes<HTMLDivElement> & { stagger?: number }) {
  return <div {...rest}>{children}</div>
}

export function RevealItem({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-reveal="" {...rest}>
      {children}
    </div>
  )
}

/**
 * A number that counts up from 0 when it scrolls into view. The final value
 * is in the HTML, so it is right without script and for screen readers.
 */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  return (
    <span data-count={value} data-dec={decimals || undefined} className={className}>
      {value.toLocaleString('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

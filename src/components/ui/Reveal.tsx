// src/components/ui/Reveal.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface RevealProps {
  children: React.ReactNode
  /** Stagger within a group, in ms. Kept small — this is punctuation, not choreography. */
  delay?: number
  /** How far it travels in. Only ever on the Y axis, to stay predictable. */
  distance?: number
  /** Fires when this fraction of the element is on screen. */
  threshold?: number
  className?: string
}

/**
 * One-shot entrance on scroll: fade plus a short rise, then the observer
 * disconnects so nothing re-animates when the user scrolls back up.
 *
 * Only `opacity` and `transform` are animated, so the whole thing stays on
 * the compositor and never triggers layout.
 *
 * Reduced motion is handled in two places on purpose. The media query below
 * skips the hidden start state entirely (so content is never invisible even
 * for the instant before the observer fires), and globals.css neutralises the
 * transition itself. Either alone would leave a gap.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 24,
  threshold = 0.15,
  className,
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    // No observer, or the user asked for less motion: show it immediately.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (typeof IntersectionObserver === 'undefined' || prefersReduced) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        }
      },
      // A negative bottom margin means it fires slightly before the element
      // reaches the fold, so the movement finishes as it comes into view.
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      style={
        isVisible
          ? { transitionDelay: `${delay}ms` }
          : { transform: `translate3d(0, ${distance}px, 0)`, transitionDelay: `${delay}ms` }
      }
      className={cn(
        'transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]',
        isVisible ? 'opacity-100' : 'opacity-0',
        // Never let the hidden state survive a reduced-motion preference.
        'motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

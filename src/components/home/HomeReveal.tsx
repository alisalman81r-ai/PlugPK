// src/components/home/HomeReveal.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The home page's entrance on scroll, done progressively.
 *
 * The shared Reveal starts every section at opacity 0 and waits for an
 * IntersectionObserver to show it. On a page that is mostly sections, that
 * meant the server HTML was a header and a hero above a column of invisible
 * blocks: blank for anyone without JavaScript, blank for the moment before
 * hydration, and blank in every full-page preview or screenshot, which never
 * scroll the sections into view.
 *
 * This one is visible by default. The server renders the section in place,
 * fully opaque. Only after hydration, and only for a section that is still
 * below the fold, is it nudged down a few pixels — never hidden — and it
 * settles when it comes into view. So the worst case is content sitting 16px
 * low, not content missing. Under prefers-reduced-motion nothing moves at all.
 */
export function HomeReveal({
  children,
  distance = 16,
  className,
}: {
  children: React.ReactNode
  distance?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<'static' | 'armed' | 'settled'>('static')

  React.useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Already on screen when the page hydrated: leave it exactly where it is.
    if (node.getBoundingClientRect().top < window.innerHeight) return

    setState('armed')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('settled')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={state === 'armed' ? { transform: `translate3d(0, ${distance}px, 0)` } : undefined}
      className={cn(
        state !== 'static' &&
          'transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:!transform-none motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

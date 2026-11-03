// src/components/auth/AuthMotion.tsx
'use client'

import { usePathname } from 'next/navigation'
import * as React from 'react'

import { prefersReduced } from '@/lib/gsap'

const format = (n: number) => n.toLocaleString('en-PK')

/**
 * A brand-side figure that counts up once (page-auth.js, `[data-to]`): it
 * reads 0, waits half a second, then climbs to its value over one second on
 * an ease-out cubic. It does not wait to be scrolled to — the design starts
 * it with the page. Under reduced motion it is simply the value.
 *
 * The value is in the server HTML, so it is right without script and for
 * screen readers. Not `data-count`: that is the site's scroll counter, which
 * runs differently.
 *
 * The design's script runs as the page loads, so the first time the clock
 * starts when this script arrives: hydration that lands after the count would
 * have finished leaves the figure alone rather than dropping it back to 0.
 * Moving to another account screen (the shell remounts) starts it fresh.
 */
let initialLoad = true
/** When this script arrived: the moment the design's own script would have run. */
const loadedAt = typeof performance === 'undefined' ? 0 : performance.now()

export function AuthCount({ value }: { value: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const el = ref.current
    const first = initialLoad
    // Cleared after this commit, so Strict Mode's second run still counts as the first.
    const clear = window.setTimeout(() => (initialLoad = false), 0)
    if (!el || prefersReduced()) return () => window.clearTimeout(clear)
    const dur = 1000
    const t0 = (first ? loadedAt : performance.now()) + 500
    if (first && performance.now() >= t0 + dur) return () => window.clearTimeout(clear)
    el.textContent = '0'
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur))
      const text = format(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (el.textContent !== text) el.textContent = text
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.clearTimeout(clear)
      cancelAnimationFrame(raf)
      el.textContent = format(value)
    }
  }, [value])

  return <span ref={ref}>{format(value)}</span>
}

/**
 * Each account screen is its own page in the design, so its entrance plays
 * every time one opens. The auth layout persists across client navigation
 * (sign in → create account), which would play it once only; keying the
 * shell on the path remounts it, and the CSS entrance, the route and the
 * counters run again for the new screen.
 */
export function AuthReplay({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <React.Fragment key={pathname}>{children}</React.Fragment>
}

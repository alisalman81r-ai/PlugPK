// src/components/admin/admin-motion.tsx
'use client'

import * as React from 'react'

import { prefersReduced } from '@/lib/gsap'

/**
 * The admin design's two figure animations (admin.js `countUp` and `ring`),
 * as client islands so the cards around them stay server components.
 *
 * Server-rendered with the final value, so the number is right without
 * JavaScript and under reduced motion; once hydrated it counts from 0 the way
 * the design does — 150ms in, 1s, cubic ease-out — writing the text only when
 * the shown integer changes.
 */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const format = React.useCallback(
    (n: number) => (decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-PK')),
    [decimals],
  )

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced() || !Number.isFinite(value) || value === 0) return
    let frame = 0
    let shown = ''
    const t0 = performance.now() + 150
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / 1000))
      const next = format(value * (1 - Math.pow(1 - p, 3)))
      if (next !== shown) {
        el.textContent = next
        shown = next
      }
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    el.textContent = format(0)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      el.textContent = format(value)
    }
  }, [value, format])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}

/** The KPI ring: a 46px gauge in the card's corner that draws to `fraction` (0–1). */
export function KpiRing({ fraction }: { fraction: number }) {
  const C = 2 * Math.PI * 26
  const target = C * (1 - Math.max(0, Math.min(1, fraction)))
  const ref = React.useRef<SVGCircleElement>(null)

  React.useLayoutEffect(() => {
    const circle = ref.current
    if (!circle || prefersReduced()) return
    // Jump to empty with no transition, then let the CSS one (1.2s expo-out) draw it.
    circle.style.transition = 'none'
    circle.style.strokeDashoffset = String(C)
    circle.getBoundingClientRect()
    circle.style.transition = ''
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        circle.style.strokeDashoffset = String(target)
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      circle.style.strokeDashoffset = ''
    }
  }, [C, target])

  return (
    <svg className="kring" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="bg" cx="32" cy="32" r="26" />
      <circle ref={ref} className="fg" cx="32" cy="32" r="26" strokeDasharray={C} strokeDashoffset={target} />
    </svg>
  )
}

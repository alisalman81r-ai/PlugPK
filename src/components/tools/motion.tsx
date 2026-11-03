// src/components/tools/motion.tsx
'use client'

import * as React from 'react'

import { gsap, prefersReduced } from '@/lib/gsap'

/**
 * The value motion the two EV tools share, from landing-v2's
 * page-range-converter.js and page-charging-calculator.js.
 *
 * React renders the controls; these move what the design moves by script —
 * a figure that rolls to its new value, a bar that glides to its new place —
 * so the element they drive is never also written by React (its text or its
 * left/width), or the two would fight.
 */

/** useLayoutEffect in the browser, useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

const enPK = (n: number) => n.toLocaleString('en-PK')

/**
 * A number that rolls from its last value to the new one (range converter
 * setNum: 0.8s expo.out, whole numbers on every frame). The first render shows
 * the value as it is; only changes roll. Reduced motion writes it at once.
 */
export function TweenNumber({
  value,
  format = enPK,
  duration = 0.8,
  ease = 'expo.out',
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  ease?: string
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  // React owns the first text only; every change after is painted here.
  const initial = React.useRef(format(value))
  const last = React.useRef(value)
  const tween = React.useRef<gsap.core.Tween | null>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = last.current
    last.current = value
    if (from === value || prefersReduced()) {
      tween.current?.kill()
      el.textContent = format(value)
      return
    }
    tween.current?.kill()
    const o = { v: from }
    tween.current = gsap.to(o, {
      v: value,
      duration,
      ease,
      onUpdate: () => {
        el.textContent = format(Math.round(o.v))
      },
      // lands on the exact figure (a typed 420.5 stays 420.5)
      onComplete: () => {
        el.textContent = format(value)
      },
    })
    // format is a render-time helper; the value is what drives the roll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  React.useEffect(() => () => void tween.current?.kill(), [])

  // The rolling copy is hidden from assistive tech, which reads the settled
  // value instead — a live region would otherwise announce every frame.
  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" suppressHydrationWarning>
        {initial.current}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}

/**
 * A bar or marker that glides to a new left / width (range converter move():
 * 0.9s expo.out, overwrite auto). Its starting place is the stylesheet's
 * left: 0 / width: 0, so on first paint it slides out to where it belongs,
 * as the design's does. Reduced motion sets it in place.
 */
export const MovingBar = React.forwardRef<
  HTMLElement,
  { left: number; width?: number; className?: string; style?: React.CSSProperties } & Record<`data-${string}`, string>
>(function MovingBar({ left, width, className, style, ...data }, forwarded) {
  const ref = React.useRef<HTMLElement | null>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const vars: gsap.TweenVars = { left: `${left}%` }
    if (width != null) vars.width = `${width}%`
    if (prefersReduced()) gsap.set(el, vars)
    else gsap.to(el, { ...vars, duration: 0.9, ease: 'expo.out', overwrite: 'auto' })
  }, [left, width])

  React.useEffect(() => {
    const el = ref.current
    return () => {
      if (el) gsap.killTweensOf(el)
    }
  }, [])

  return (
    <i
      ref={(node) => {
        ref.current = node
        if (typeof forwarded === 'function') forwarded(node)
        else if (forwarded) forwarded.current = node
      }}
      className={className}
      style={style}
      {...data}
    />
  )
})

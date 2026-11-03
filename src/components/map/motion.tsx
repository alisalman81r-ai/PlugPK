// src/components/map/motion.tsx
'use client'

/**
 * The map page's own motion (landing-v2 js/page-map.js and css/page-map.css),
 * shared by the map's components and the station pages that borrow its
 * language. The site-wide layer — hero entrance, reveals, counters, magnetic
 * buttons — is components/motion/MotionProvider; this is only what the map
 * page adds on top of it.
 */

import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'

/** A layout effect in the browser (runs before paint, so entrances never flash), a no-op on the server. */
export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** .scard2 hover (defined in the plain layout module so Server Components can read it). */
export { SCARD_HOVER } from './layout'

/**
 * page-map.js scrollToEl: Lenis glides there (offset -100, 1.1s); without
 * Lenis (reduced motion) the browser jumps or scrolls natively.
 */
export function scrollToEl(el: Element | null | undefined, offset = -100) {
  if (!el) return
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset, duration: 1.1 })
  else el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
}

/** page-map.js apply(): ScrollTrigger.refresh, debounced 120ms. */
let refreshTimer: ReturnType<typeof setTimeout> | undefined
export function refreshSoon() {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120)
}

/**
 * openPopup: the popup's content rises in —
 * from { y: 14, opacity: 0, scale: 0.96 }, 0.5s, back.out(2).
 * Runs when the element mounts; key it by station to replay per station.
 */
export function usePopIn<T extends HTMLElement>(ref: React.RefObject<T>) {
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    const tween = gsap.from(el, { y: 14, opacity: 0, scale: 0.96, duration: 0.5, ease: 'back.out(2)' })
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'transform,opacity' })
    }
  }, [ref])
}

/**
 * A number the page keeps changing (pins shown, ports installed), counted up
 * the way pages.js counts [data-count]: from 0 when it scrolls into view
 * ("top 92%", once), 1.4s, power3.out, en-PK digits. Later values are written
 * straight in, as page-map.js apply() does.
 *
 * Not [data-count]: the shared counter replaces the element's text node, and
 * React would go on updating the detached one. This writes the same text
 * node's nodeValue, so React's later renders still land.
 */
export function LiveCount({ value, className }: { value: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const tween = React.useRef<gsap.core.Tween | null>(null)
  const counted = React.useRef(false)
  const latest = React.useRef(value)
  latest.current = value

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    const write = (n: number) => {
      const node = el.firstChild
      if (node) node.nodeValue = n.toLocaleString('en-PK', { maximumFractionDigits: 0 })
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        counted.current = true
        const o = { v: 0 }
        write(0)
        tween.current = gsap.to(o, {
          v: latest.current,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => write(o.v),
        })
      },
    })
    return () => {
      st.kill()
      tween.current?.kill()
      write(latest.current)
    }
  }, [])

  // A new value mid-count: stop counting, show the value.
  useIsoLayoutEffect(() => {
    if (!counted.current || !tween.current?.isActive()) return
    tween.current.kill()
    const node = ref.current?.firstChild
    if (node) node.nodeValue = value.toLocaleString('en-PK')
  }, [value])

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('en-PK')}
    </span>
  )
}

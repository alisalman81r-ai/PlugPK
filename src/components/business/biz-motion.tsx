// src/components/business/biz-motion.tsx
'use client'

import * as React from 'react'

import { gsap, prefersReduced } from '@/lib/gsap'

/**
 * The business portal's motion, on GSAP (@/lib/gsap), all of it skipped under
 * reduced motion so the page simply appears in its final state.
 *
 * - usePageEntrance: the page head, then each top-level block, then the KPI
 *   tiles inside them rise in on a short stagger. Re-runs on navigation.
 * - useGlide: moves one indicator element onto the active item (the sidebar's
 *   volt bar, the range picker's ink pill), so it travels rather than blinks.
 */

const isoLayout = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export function usePageEntrance(root: React.RefObject<HTMLElement>, key: string) {
  isoLayout(() => {
    const el = root.current
    if (!el || prefersReduced()) return
    const ctx = gsap.context(() => {
      const head = el.querySelectorAll(':scope > .phead')
      const blocks = el.querySelectorAll(':scope > .biz-body > *:not(.biz-kpis)')
      const tiles = el.querySelectorAll('.biz-kpis > .kpi')
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.9 } })
      if (head.length) tl.from(head, { autoAlpha: 0, y: 14, duration: 0.7 }, 0)
      if (tiles.length) tl.from(tiles, { autoAlpha: 0, y: 22, scale: 0.97, stagger: 0.07, transformOrigin: '50% 100%' }, 0.08)
      if (blocks.length) tl.from(blocks, { autoAlpha: 0, y: 20, stagger: 0.08 }, tiles.length ? 0.22 : 0.1)
      tl.set([...head, ...tiles, ...blocks], { clearProps: 'transform,opacity,visibility' })
    }, el)
    return () => ctx.revert()
  }, [key])
}

/**
 * Glides `indicator` onto the element in `container` matching `selector`.
 * axis 'y' sizes it to the target's height (a vertical bar); 'x' to its width
 * and left (a pill behind a segmented control).
 */
export function useGlide(
  container: React.RefObject<HTMLElement>,
  indicator: React.RefObject<HTMLElement>,
  selector: string,
  axis: 'x' | 'y',
  deps: React.DependencyList,
) {
  const first = React.useRef(true)
  isoLayout(() => {
    const box = container.current
    const ind = indicator.current
    if (!box || !ind) return
    const place = (animate: boolean) => {
      const target = box.querySelector<HTMLElement>(selector)
      if (!target) {
        ind.classList.remove('is-on')
        return
      }
      const props =
        axis === 'y'
          ? { y: target.offsetTop + 10, height: Math.max(8, target.offsetHeight - 20) }
          : { x: target.offsetLeft, y: target.offsetTop - 4, width: target.offsetWidth, height: target.offsetHeight }
      ind.classList.add('is-on')
      if (!animate || prefersReduced()) gsap.set(ind, props)
      else gsap.to(ind, { ...props, duration: 0.55, ease: 'expo.out', overwrite: true })
    }
    place(!first.current)
    first.current = false
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

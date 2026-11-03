// src/components/services/services-motion.ts
'use client'

/**
 * landing-v2 js/page-services.js, the parts that are not markup: the first
 * reveal of the cards, the Flip reorder when the filters change, the count
 * bounce, and the hero search handing its query to the directory.
 *
 * Flip is the one plugin the shared kit (lib/gsap) does not register, so it is
 * registered here, as page-services.js does with its own <script>.
 */

import { Flip } from 'gsap/Flip'
import * as React from 'react'

import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'

if (typeof window !== 'undefined') gsap.registerPlugin(Flip)

export { Flip }

/** useLayoutEffect in the browser, useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

/** Every card in a directory grid, shown or hidden — page-services.js `.svc`. */
export const CARD = '[data-svc]'

export function cardsIn(root: ParentNode | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(CARD)) : []
}

/**
 * The first reveal of the cards: they wait at autoAlpha 0, 48px down, and
 * rise in one after another (1s, expo.out, 0.06s apart) when the grid's top
 * reaches 88% of the screen. Only the cards on show take part; when it
 * finishes every card's props are cleared.
 *
 * `introRef` holds the tween so a filter change before it plays can finish it
 * first (page-services.js finishIntro).
 */
export function useCardIntro(
  gridRef: React.RefObject<HTMLElement>,
  introRef?: React.MutableRefObject<gsap.core.Tween | null>,
) {
  useIsoLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || prefersReduced()) return
    const ctx = gsap.context(() => {
      const cards = cardsIn(grid)
      if (!cards.length) return
      gsap.set(cards, { autoAlpha: 0, y: 48 })
      const intro = gsap.to(
        cards.filter((c) => !c.hidden),
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.06,
          paused: true,
          onComplete: () => {
            gsap.set(cards, { clearProps: 'opacity,visibility,transform' })
          },
        },
      )
      if (introRef) introRef.current = intro
      ScrollTrigger.create({ trigger: grid, start: 'top 88%', once: true, onEnter: () => intro.play() })
    }, grid)
    return () => {
      if (introRef) introRef.current = null
      ctx.revert()
    }
    // Once, on mount: the intro is the page arriving, not a filter changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * page-services.js setCount: when the number changes it lands at 1.35x and
 * springs back (0.5s, back.out(3)). Not on the first render.
 */
export function useCountBounce<T extends HTMLElement>(value: number) {
  const ref = React.useRef<T>(null)
  const first = React.useRef(true)
  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!ref.current || prefersReduced()) return
    const tween = gsap.fromTo(ref.current, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
    return () => {
      tween.progress(1).kill()
    }
  }, [value])
  return ref
}

/** The hero search hands its query to the directory, and the directory keeps the hero in step. */
export const HERO_SEARCH_EVENT = 'pk:services-search'
export const DIRECTORY_SYNC_EVENT = 'pk:services-sync'

export interface ServicesSearchDetail {
  q: string
  city: string
}

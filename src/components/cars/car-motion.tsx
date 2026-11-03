// src/components/cars/car-motion.tsx
'use client'

/**
 * The catalogue's own motion (landing-v2 js/page-cars.js), shared by the
 * catalogue, the similar-cars row on a car's page and the comparison cards.
 *
 *   useCarEntrance   animateIn(): cards rise 36px and fade in as they scroll
 *                    into view, batched so neighbours stagger 0.06s
 *   TweenCount       tweenCount(): a count that runs from its old value to its
 *                    new one when the filters change
 *   CarPhoto         .car__img: the cut-out fades in once it has loaded
 *
 * Everything lands in place, unmoving, under prefers-reduced-motion.
 */

import Image from 'next/image'
import * as React from 'react'

import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/** useLayoutEffect in the browser (before paint), without the server warning. */
export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * animateIn(): every child of the list not seen before starts 36px down and
 * transparent, and rises in on expo.out as it reaches 95% of the viewport.
 *
 * Runs after every render and skips children it has already handled, so it
 * covers both of the design's cases: a re-keyed list (search, filter, sort —
 * the design's grid.innerHTML) brings every card in again, and "Show more"
 * (its insertAdjacentHTML) brings in only the new ones.
 */
export function useCarEntrance(listRef: React.RefObject<HTMLElement>) {
  const seen = React.useRef(new WeakSet<Element>())
  const triggers = React.useRef<ScrollTrigger[]>([])

  useIsoLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.children).filter((el) => !seen.current.has(el))
    if (items.length === 0) return
    items.forEach((el) => seen.current.add(el))

    // A replaced grid: its cards' triggers and tweens go with it.
    triggers.current = triggers.current.filter((t) => {
      const el = t.trigger
      if (el && el.isConnected) return true
      if (el) gsap.killTweensOf(el)
      t.kill()
      return false
    })

    if (prefersReduced()) return
    gsap.set(items, { autoAlpha: 0, y: 36 })
    const created = ScrollTrigger.batch(items, {
      start: 'top 95%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true }),
    })
    triggers.current.push(...created)
    ScrollTrigger.refresh()
  })

  // On unmount every trigger goes, and the cards are forgotten, so a remount
  // (React's strict-mode double mount included) brings them in again.
  React.useEffect(
    () => () => {
      triggers.current.forEach((t) => t.kill())
      triggers.current = []
      seen.current = new WeakSet()
    },
    [],
  )
}

/**
 * A car grid whose items come in as the catalogue's do: for server-rendered
 * lists (similar cars). Give each <li> CAR_ENTRANCE_ITEM from car-ui.
 */
export function CarGrid({ children, ...rest }: React.HTMLAttributes<HTMLUListElement>) {
  const ref = React.useRef<HTMLUListElement>(null)
  useCarEntrance(ref)
  return (
    <ul ref={ref} {...rest}>
      {children}
    </ul>
  )
}

/**
 * tweenCount(): runs from the figure on screen to the new one, 0.6s on
 * power3.out. The first render, and reduced motion, print it straight.
 */
export function TweenCount({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value)
  const current = React.useRef(value)

  React.useEffect(() => {
    const from = current.current
    if (prefersReduced() || from === value) {
      current.current = value
      setShown(value)
      return
    }
    const o = { v: from }
    const tween = gsap.to(o, {
      v: value,
      duration: 0.6,
      ease: 'power3.out',
      onUpdate: () => {
        current.current = Math.round(o.v)
        setShown(current.current)
      },
    })
    return () => {
      tween.kill()
    }
  }, [value])

  return <>{shown}</>
}

/**
 * A studio cut-out on the stage (.car__img): multiplied into the light, and
 * transparent until it has loaded, then faded in over 0.5s. On hover (the
 * caller's group-hover classes) it slides and grows over 0.7s on --e-out.
 * A failed load is shown too, as the design does, rather than left invisible.
 */
export function CarPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imageClassName,
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  /** The box the image fills. */
  className?: string
  /** Hover transforms, from the caller's group. */
  imageClassName?: string
}) {
  const [loaded, setLoaded] = React.useState(false)
  const ref = React.useRef<HTMLImageElement>(null)

  // Loaded before hydration: no load event will come.
  React.useEffect(() => {
    if (ref.current?.complete) setLoaded(true)
  }, [])

  return (
    <span className={cn('absolute inset-0 block', className)}>
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          'object-contain mix-blend-multiply [transition:transform_.7s_cubic-bezier(.16,1,.3,1),opacity_.5s]',
          !loaded && '[html.js_&]:opacity-0',
          imageClassName,
        )}
      />
    </span>
  )
}

// src/components/home/v2/Loader.tsx
'use client'

import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { gsap, prefersReduced } from '@/lib/gsap'

/**
 * The landing-v2 preloader (main.js "PRELOADER → HERO INTRO"): the brand mark
 * fills with charge from 0 to 100%, gives a small pulse, and the ink sheet
 * wipes up off the page as the hero intro starts.
 *
 * It plays on a fresh load of the home page only, as the design's does. A
 * client-side visit back to home skips it and the hero intro starts at once.
 * Without script it never shows (html:not(.js)), and under reduced motion it
 * is removed at once.
 */

let booted = false
const listeners = new Set<() => void>()
let introReleased = false

/** Runs `fn` when the loader hands over to the hero — at once if it already has. */
export function onIntro(fn: () => void): () => void {
  if (introReleased) {
    fn()
    return () => {}
  }
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function releaseIntro() {
  introReleased = true
  listeners.forEach((fn) => fn())
  listeners.clear()
}

export function Loader() {
  const [show] = React.useState(() => !booted)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    booted = true
    const loader = ref.current
    if (!show || !loader) {
      releaseIntro()
      return
    }
    if (prefersReduced()) {
      loader.remove()
      releaseIntro()
      return
    }
    const lenis = getLenis()
    lenis?.stop()
    const pctEl = loader.querySelector('.js-pct')!
    const level = loader.querySelector('.loader__level')!
    const pct = { v: 0 }
    const ctx = gsap.context(() => {
      gsap.set(level, { y: 120 })
      gsap.to(loader.querySelector('.loader__wave'), { x: -60, duration: 1.1, ease: 'none', repeat: -1 })
      gsap
        .timeline()
        .to(pct, {
          v: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            pctEl.textContent = String(Math.round(pct.v))
            // the charge level rises from the bottom of the mark; the wave sits just above it
            gsap.set(level, { y: 120 - (136 * pct.v) / 100 })
          },
        })
        .to(loader.querySelector('.loader__mark'), { scale: 1.08, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 })
        .to(loader.querySelector('.loader__inner'), { scale: 0.9, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, '+=.1')
        .fromTo(loader, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'snap' }, '-=.1')
        .add(() => {
          getLenis()?.start()
          releaseIntro()
        }, '-=.55')
        .add(() => {
          loader.style.display = 'none'
        })
    })
    // Not releasing the intro here: React's development double-run calls this
    // cleanup straight away, and the hero must still wait for the real hand-over.
    return () => {
      ctx.revert()
      getLenis()?.start()
    }
  }, [show])

  if (!show) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink text-white [html:not(.js)_&]:hidden motion-reduce:hidden"
    >
      <div className="loader__inner grid justify-items-center gap-[22px]">
        <svg viewBox="0 0 120 120" className="loader__mark h-[120px] w-[120px] overflow-visible">
          <defs>
            <clipPath id="loaderClip">
              <rect width="120" height="120" rx="34" />
            </clipPath>
          </defs>
          <rect x="1" y="1" width="118" height="118" rx="33" fill="#15171A" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
          <g clipPath="url(#loaderClip)">
            <g className="loader__level" transform="translate(0 120)">
              <path className="loader__wave" fill="#D4FF3A" d="M0 8Q15 0 30 8T60 8T90 8T120 8T150 8T180 8T210 8T240 8V140H0Z" />
            </g>
          </g>
          <path
            d="M18.6 4.5 8.5 18h6.8l-1.9 9.5L23.5 14h-6.8z"
            transform="scale(3.75)"
            fill="#0B0C0E"
            stroke="#D4FF3A"
            strokeWidth=".45"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex items-baseline gap-3.5">
          <span className="pg-bold font-display text-[22px] leading-none">
            plug<b className="font-normal text-volt">pk</b>
          </span>
          <span className="font-mono text-sm text-white/60">
            <span className="js-pct">0</span>%
          </span>
        </div>
      </div>
    </div>
  )
}

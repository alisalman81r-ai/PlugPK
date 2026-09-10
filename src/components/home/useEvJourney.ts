// src/components/home/useEvJourney.ts
'use client'

import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * The scroll-driven EV journey.
 *
 * ── THE MAP IS NEVER TOUCHED ──────────────────────────────────────────
 *
 * Nothing in this file selects, transforms or fades the dotted land. No scale,
 * no translate, no rotate, no viewBox tween, no parallax, and no opacity on
 * the <svg> that contains it. An earlier version zoomed a wrapper group from
 * the regional framing in to Pakistan; that group no longer exists in
 * WorldMap, so there is nothing here to animate even by accident.
 *
 * The elements that do move are all listed in PARTS below. If a selector is
 * not in that object, this hook never writes to it.
 *
 * ── Sticky, not ScrollTrigger's pin ───────────────────────────────────
 *
 * The stage is held by CSS position: sticky; ScrollTrigger only reads
 * progress. pin: true wraps the element in a generated pin-spacer and switches
 * it to position: fixed at the boundary, which is the mechanism that produces
 * the one-frame jump the brief rules out. Sticky has no such moment — the
 * element never leaves flow and the browser owns the transition.
 *
 * ── Written to the DOM, not to React state ────────────────────────────
 *
 * A scrubbed timeline updates every scroll frame. Through React state that
 * would re-render seven hundred circles sixty times a second. GSAP writes
 * transform, opacity and strokeDashoffset straight to the nodes; React does
 * not re-render during the scroll at all.
 */

/** Every element this hook may write to. Nothing else is animated. */
const PARTS = {
  route: '.route-path',
  car: '#car-layer',
  charging: '#journey-charging',
  success: '#journey-success',
  statusCharging: '#journey-status-charging',
  statusCharged: '#journey-status-charged',
  statusDone: '#journey-status-done',
} as const

/** Point and tangent at `progress`, for placing the car. */
function poseAt(path: SVGPathElement, progress: number) {
  const total = path.getTotalLength()
  const at = total * Math.min(Math.max(progress, 0), 1)
  // Sampled across a span rather than differentiated: a curve's derivative at
  // an endpoint is zero when its control point coincides with it, and
  // atan2(0, 0) is 0 — the car would snap flat at the two most visible moments.
  const span = Math.max(total * 0.01, 0.5)
  const behind = path.getPointAtLength(Math.max(at - span, 0))
  const ahead = path.getPointAtLength(Math.min(at + span, total))
  const here = path.getPointAtLength(at)
  return {
    x: here.x,
    y: here.y,
    angle: (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI,
  }
}

/**
 * How far along the path the charging stop sits, 0..1.
 *
 * Measured against the rendered path rather than assumed to be halfway.
 * Karachi to Lahore is the long leg and Lahore to Islamabad is short, so the
 * stop lands near four fifths of the way along — and it moves if a waypoint
 * does, which is why this is found rather than written down.
 */
function findStop(path: SVGPathElement, stop: { x: number; y: number }): number {
  const total = path.getTotalLength()
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i <= 240; i += 1) {
    const t = i / 240
    const p = path.getPointAtLength(total * t)
    const d = (p.x - stop.x) ** 2 + (p.y - stop.y) ** 2
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  return best
}

export interface EvJourneyRefs {
  /** The tall element whose scroll range the journey is mapped onto. */
  scene: React.RefObject<HTMLElement>
  /** The charging stop, already projected into the map's user units. */
  stop: { x: number; y: number }
}

export function useEvJourney({ scene, stop }: EvJourneyRefs): void {
  const stopX = stop.x
  const stopY = stop.y

  React.useEffect(() => {
    const sceneEl = scene.current
    if (!sceneEl) return

    const context = gsap.context(() => {
      const q = <T extends Element>(sel: string) => sceneEl.querySelector<T>(sel)

      const path = q<SVGPathElement>(PARTS.route)
      const car = q<SVGGElement>(PARTS.car)
      if (!path || !car) return

      const charging = q<SVGCircleElement>(PARTS.charging)
      const success = q<SVGGElement>(PARTS.success)
      const sCharging = q<HTMLElement>(PARTS.statusCharging)
      const sCharged = q<HTMLElement>(PARTS.statusCharged)
      const sDone = q<HTMLElement>(PARTS.statusDone)

      const start = poseAt(path, 0)
      const end = poseAt(path, 1)
      const stopAt = findStop(path, { x: stopX, y: stopY })

      gsap.matchMedia().add(
        {
          animate: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
          still: '(max-width: 1023px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { animate } = ctx.conditions as { animate: boolean }

          /*
            Reduced motion, and phones, get the finished picture and no
            timeline — the end state, not a shortened version. Somebody who
            asked for less motion should still see what the sequence was going
            to say, and a scrubbed stage on a touch device competes with the
            browser's own scrolling in a way that is worse than not having it.
          */
          if (!animate) {
            gsap.set(path, { strokeDasharray: 100, strokeDashoffset: 0 })
            gsap.set(car, {
              attr: { transform: `translate(${end.x} ${end.y}) rotate(${end.angle})` },
              opacity: 1,
            })
            if (success) gsap.set(success, { opacity: 1 })
            if (sDone) gsap.set(sDone, { opacity: 1 })
            return
          }

          // Resting state. The map is already drawn; the journey has not begun.
          gsap.set(path, { strokeDasharray: 100, strokeDashoffset: 100 })
          gsap.set(car, {
            attr: { transform: `translate(${start.x} ${start.y}) rotate(${start.angle})` },
            opacity: 0,
          })
          gsap.set([charging, success, sCharging, sCharged, sDone].filter(Boolean), { opacity: 0 })
          if (success) gsap.set(success, { scale: 0.6, transformOrigin: 'center' })

          const driver = { progress: 0 }
          const applyCar = () => {
            const pose = poseAt(path, driver.progress)
            car.setAttribute('transform', `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`)
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sceneEl,
              start: 'top top',
              end: 'bottom bottom',
              // A little catch-up, so the car does not stutter one-to-one with
              // a trackpad's own jitter. Reverses exactly as it plays.
              scrub: 0.6,
            },
            defaults: { ease: 'none' },
          })

          tl
            // 1 — the route draws itself, start to finish
            .to(path, { strokeDashoffset: 0, duration: 0.24 }, 0.04)
            // 2 — the car appears at the start of it
            .to(car, { opacity: 1, duration: 0.04 }, 0.26)
            // 3/4 — it drives to the charging stop
            .to(driver, { progress: stopAt, duration: 0.26, onUpdate: applyCar }, 0.31)
            // 5 — plugged in: the ring expands and fades, three times
            .to(sCharging, { opacity: 1, duration: 0.02 }, 0.58)
            .to(charging, { opacity: 1, duration: 0.02 }, 0.58)
            .fromTo(
              charging,
              { attr: { r: 6 }, opacity: 0.9 },
              { attr: { r: 14 }, opacity: 0, duration: 0.05, repeat: 2 },
              0.59,
            )
            // 6 — charged
            .to(sCharging, { opacity: 0, duration: 0.02 }, 0.75)
            .to(sCharged, { opacity: 1, duration: 0.02 }, 0.76)
            // 7/8 — on to the destination
            .to(driver, { progress: 1, duration: 0.16, onUpdate: applyCar }, 0.79)
            // 9/10 — arrival
            .to(sCharged, { opacity: 0, duration: 0.02 }, 0.95)
            .to(success, { opacity: 1, scale: 1, duration: 0.04, ease: 'back.out(2)' }, 0.95)
            .to(sDone, { opacity: 1, duration: 0.03 }, 0.96)

          /*
            Re-measure once the page has settled.

            ScrollTrigger reads the trigger's geometry when the timeline is
            built, and at that moment this component has only just mounted:
            the 300vh height comes from a class the stylesheet may not have
            applied yet, and the fonts above the fold have not loaded, so the
            page is shorter than it is about to be. The range it captured was
            a fraction of the real one, which put progress at 1 after a few
            pixels of scroll — the route arrived fully drawn and nothing
            appeared to scrub.

            Measured, not guessed: the section is 2424px and the range should
            be 1616px, and before this the whole journey completed inside the
            first screen.

            Two refreshes because there are two moments the height changes:
            the frame after mount, and whenever a webfont swaps in.
          */
          requestAnimationFrame(() => ScrollTrigger.refresh())
          if (document.fonts?.ready) {
            document.fonts.ready.then(() => ScrollTrigger.refresh())
          }

          return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
          }
        },
      )
    }, sceneEl)

    return () => context.revert()
  }, [scene, stopX, stopY])
}

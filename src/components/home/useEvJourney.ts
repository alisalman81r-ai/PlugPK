// src/components/home/useEvJourney.ts
'use client'

import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { CHARGE_PROGRESS, pointAt } from './journey'

gsap.registerPlugin(ScrollTrigger)

/**
 * The scroll-driven journey: the route draws, the car travels it, it stops
 * dead at the charger, the popup appears, then it finishes the run.
 *
 * ── One reversible model, not two ─────────────────────────────────────
 *
 * There is no "scrolling down" code and no "scrolling up" code. A single
 * scrubbed tween carries one number — the master progress, 0 to 1 — and
 * `apply()` is a pure function of that number. Every element's state at
 * progress t is computed from t alone, so reverse is not implemented; it is
 * simply what happens when t decreases.
 *
 * ── Why a piecewise map instead of a GSAP timeline of tweens ──────────
 *
 * The brief calls the midpoint hold non-negotiable, and a timeline of
 * consecutive tweens cannot promise it: the car's position during the hold
 * would be whatever the previous tween last wrote, which under a scrub with
 * smoothing can be 0.4998 rather than 0.5, and can drift a fraction further
 * as the scrub catches up. `routeProgressAt()` returns the constant
 * CHARGE_PROGRESS for the whole hold band — the same value, from the same
 * branch, on every frame — so there is nothing left to drift.
 *
 * Scrub smoothing is preserved: it is applied to the master number by
 * ScrollTrigger before `apply()` ever sees it.
 *
 * ── Written to the DOM, never to React state ──────────────────────────
 *
 * A scrubbed timeline updates on every scroll frame. Through React state that
 * would re-render the whole map — the silhouette, the pattern, the layers —
 * sixty times a second. GSAP hands us a number; `apply()` writes
 * strokeDashoffset, two transforms and two opacities straight to the nodes.
 * React does not re-render during the scroll at all.
 */

/**
 * Where each phase of the story sits on the master 0-1 progress.
 *
 * These are SCROLL positions, not positions along the road. The car is at
 * geometric route progress CHARGE_PROGRESS (0.5) for the whole band from
 * `driveOneEnd` to `holdEnd` — a fifth of the scroll spent going nowhere,
 * which is what makes the stop read as a stop rather than a stutter.
 */
const PHASE = {
  introEnd: 0.08,
  driveOneEnd: 0.45,
  holdEnd: 0.65,
  driveTwoEnd: 0.94,
} as const

/**
 * The charging sub-phases, inside the approved 0.45-0.65 hold.
 *
 * The hold itself is untouched — routeProgressAt() still returns exactly
 * CHARGE_PROGRESS across the whole band, so the car does not move by so much
 * as a rounding error while any of this happens.
 *
 *   0.450-0.480  arrival   charger wakes, popup enters
 *   0.480-0.610  charging  0% to 100%, driven only by scroll
 *   0.610-0.632  ready     complete state, held long enough to read
 *   0.624-0.649  exit      popup is gone BEFORE the car moves at 0.650
 *   0.652-0.700  charger goes quiet again behind the departing car
 */
const CHARGER_WAKE: readonly [number, number] = [0.45, 0.48]
/**
 * And going quiet again once the car has gone.
 *
 * Found in QA: without this the halo stayed lit for the whole second drive
 * and was still burning at the destination, which reads as a charger that
 * never finished. It fades out just after the car departs.
 */
const CHARGER_SLEEP: readonly [number, number] = [0.652, 0.7]
/** Popup enters after the car has stopped, not while it is still arriving. */
const POPUP_IN: readonly [number, number] = [0.455, 0.49]
const CHARGING: readonly [number, number] = [0.48, 0.61]
const POPUP_OUT: readonly [number, number] = [0.624, 0.649]

/** Width of the progress bar's track, in user units. Matches JourneyLayers. */
const BAR_WIDTH = 128
/** The destination's arrival emphasis. */
const ARRIVAL: readonly [number, number] = [0.94, 1]

/**
 * How much of the road's heading the car actually takes.
 *
 * EVCar is drawn in side elevation facing +x, so the base correction is zero
 * degrees — no offset is needed anywhere else in this file.
 *
 * The route's heading runs from -37 to -93 degrees, because the journey is
 * mostly northward. Applied in full, a side-elevation car stands on its end
 * and reads as a dark capsule rather than a vehicle. At 0.35 the car leans
 * between -13 and -32 degrees: it visibly turns into and out of every bend,
 * and still looks like a car climbing the country.
 *
 * This is the restrained orientation strategy the brief allows, and it is the
 * only place rotation is scaled — the timeline never touches it.
 */
const ROTATION_DAMPING = 0.35

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const spanProgress = (from: number, to: number, v: number) =>
  to === from ? 0 : clamp01((v - from) / (to - from))

/**
 * Master progress -> progress along the road.
 *
 * The single source of the freeze. Between driveOneEnd and holdEnd this
 * returns CHARGE_PROGRESS exactly, so the car, the route reveal and the
 * popup's anchor cannot disagree about where the charger is.
 */
export function routeProgressAt(t: number): number {
  if (t <= PHASE.introEnd) return 0
  if (t <= PHASE.driveOneEnd) {
    return lerp(0, CHARGE_PROGRESS, spanProgress(PHASE.introEnd, PHASE.driveOneEnd, t))
  }
  if (t <= PHASE.holdEnd) return CHARGE_PROGRESS
  if (t <= PHASE.driveTwoEnd) {
    return lerp(CHARGE_PROGRESS, 1, spanProgress(PHASE.holdEnd, PHASE.driveTwoEnd, t))
  }
  return 1
}

export interface EvJourneyRefs {
  /** The hero. Pinned on desktop, and the trigger for the timeline. */
  scene: React.RefObject<HTMLElement>
  /** The map column. The trigger on small screens, where nothing is pinned. */
  stage: React.RefObject<HTMLElement>
}

export function useEvJourney({ scene, stage }: EvJourneyRefs): void {
  React.useEffect(() => {
    const sceneEl = scene.current
    if (!sceneEl) return

    const context = gsap.context(() => {
      const route = sceneEl.querySelector<SVGPathElement>('.route-path')
      const glow = sceneEl.querySelector<SVGPathElement>('[data-route-glow]')
      const car = sceneEl.querySelector<SVGGElement>('#car-layer')
      const popup = sceneEl.querySelector<SVGGElement>('#journey-charge-popup')
      const destination = sceneEl.querySelector<SVGGElement>('#journey-destination')
      if (!route || !car) return

      // The popup and the destination scale about the point they belong to,
      // not the SVG origin. Set once — transform-origin in user units needs
      // the view-box box, and without it both would fly off when scaled.
      const anchor = pointAt(CHARGE_PROGRESS)
      if (popup) {
        popup.style.transformBox = 'view-box'
        popup.style.transformOrigin = `${anchor.x}px ${anchor.y}px`
      }
      // Cached once. These are written on every scroll frame, so they must
      // never be re-queried inside apply().
      const charger = sceneEl.querySelector<SVGGElement>('#journey-charger-active')
      const title = sceneEl.querySelector<SVGTextElement>('#jc-title')
      const pct = sceneEl.querySelector<SVGTextElement>('#jc-pct')
      const fill = sceneEl.querySelector<SVGRectElement>('#jc-fill')
      const bolt = sceneEl.querySelector<SVGPathElement>('#jc-bolt')
      const check = sceneEl.querySelector<SVGPathElement>('#jc-check')
      // Only touch the DOM when the words actually change — textContent is a
      // layout write, and at sixty frames a second most of them are no-ops.
      let lastPct = -1
      let lastReady: boolean | null = null

      const end = pointAt(1)
      if (destination) {
        destination.style.transformBox = 'view-box'
        destination.style.transformOrigin = `${end.x}px ${end.y}px`
      }

      /*
        ── Direction ─────────────────────────────────────────────────────

        The two directions now tell different stories, so route progress is
        no longer a pure function of t. It is a small state machine, and it
        lives here alone — nothing downstream asks which way the user is
        going.

        Forward keeps the approved mapping, hold and all. Reverse is
        continuous: the car drives back through the charger without stopping.

        ── Why an anchor, and not two fixed curves ───────────────────────

        A fixed reverse curve teleports. Forward and reverse can only agree
        where both are pinned — p=0 below t=0.08 and p=1 above t=0.94 — and
        anywhere between them the two functions return different positions
        for the same t. Switching at, say, t=0.55 would jump the car by the
        difference.

        So the switch records where the car actually was and rebuilds the
        mapping from that point:

          reverse   p falls linearly from anchorP to 0 as t falls to 0.
                    Monotonic by construction, so it cannot pause at 0.5.

          forward   the approved curve plus the offset it was carrying at the
                    moment of the switch, decayed to nothing over BLEND. The
                    car rejoins the real curve and the freeze stays exact —
                    once decayed, p IS forwardAt(t), not an approximation.

        Both are continuous at the switch by construction: at t = anchorT
        each returns exactly anchorP. The car never leaves the path; only the
        fraction along it is remapped.
      */
      const DIRECTION_EPSILON = 0.0004
      const BLEND = 0.05

      let mode: 'forward' | 'reverse' = 'forward'
      let anchorT = 0
      let anchorP = 0
      let carried = 0
      let lastT = 0
      let lastP = 0

      const progressFor = (t: number): number => {
        const dt = t - lastT
        // A deadzone, so trackpad jitter around a standstill cannot flip the
        // story back and forth and flash the charging card.
        if (Math.abs(dt) > DIRECTION_EPSILON) {
          const heading = dt > 0 ? 'forward' : 'reverse'
          if (heading !== mode) {
            mode = heading
            anchorT = lastT
            anchorP = lastP
            carried = heading === 'forward' ? anchorP - routeProgressAt(anchorT) : 0
          }
        }

        let p: number
        if (mode === 'reverse') {
          p = anchorT > 0 ? anchorP * clamp01(t / anchorT) : 0
        } else {
          const decay = 1 - spanProgress(anchorT, anchorT + BLEND, t)
          p = clamp01(routeProgressAt(t) + carried * decay)
        }

        lastT = t
        lastP = p
        return p
      }

      /** Everything the page shows at master progress `t`. */
      const apply = (t: number) => {
        const p = progressFor(t)
        // Charging is a forward-story event. On reverse the car simply drives
        // through, so every part of the charging UI is held at zero rather
        // than being range-checked — that is what stops it flashing as the
        // boundaries are crossed backwards.
        const forward = mode === 'forward'

        /*
          The master progress, published on the scene element. One dataset
          write per frame, no layout read. It is the only external handle on
          which phase the timeline believes it is in — reverse-engineering
          that from scroll pixels once produced a false regression report.
        */
        sceneEl.dataset.journeyProgress = t.toFixed(4)

        // pathLength is 100 on both strokes, so the dash maths is in percent
        // and never needs retiming when a waypoint moves. The route retracts
        // with the car on the way back, so the two stay connected.
        const dash = String(100 - p * 100)
        route.style.strokeDashoffset = dash
        if (glow) glow.style.strokeDashoffset = dash

        const pose = pointAt(p)
        car.setAttribute(
          'transform',
          `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)}) rotate(${(
            pose.angle * ROTATION_DAMPING
          ).toFixed(2)})`,
        )

        const charge = forward ? spanProgress(CHARGING[0], CHARGING[1], t) : 0
        const ready = forward && charge >= 1

        if (popup) {
          const shown = forward
            ? spanProgress(POPUP_IN[0], POPUP_IN[1], t) *
              (1 - spanProgress(POPUP_OUT[0], POPUP_OUT[1], t))
            : 0
          popup.style.opacity = String(shown)
          // Grows out of the charging point rather than fading in place.
          popup.style.transform = `scale(${(0.94 + 0.06 * shown).toFixed(3)}) translate(0px, ${(
            (1 - shown) * 4
          ).toFixed(2)}px)`
        }

        if (charger) {
          charger.style.opacity = String(
            forward
              ? spanProgress(CHARGER_WAKE[0], CHARGER_WAKE[1], t) *
                  (1 - spanProgress(CHARGER_SLEEP[0], CHARGER_SLEEP[1], t))
              : 0,
          )
        }
        if (fill) fill.setAttribute('width', (BAR_WIDTH * charge).toFixed(2))

        // Guarded: textContent is a layout write, and at sixty frames a
        // second almost every one of these is a no-op.
        const whole = Math.round(charge * 100)
        if (pct && whole !== lastPct) {
          pct.textContent = `${whole}%`
          lastPct = whole
        }
        if (ready !== lastReady) {
          if (title) title.textContent = ready ? 'Ready' : 'Charging'
          if (bolt) bolt.style.opacity = ready ? '0' : '1'
          if (check) check.style.opacity = ready ? '1' : '0'
          lastReady = ready
        }

        if (destination) {
          const arrived = spanProgress(ARRIVAL[0], ARRIVAL[1], t)
          destination.style.opacity = String(0.85 + 0.15 * arrived)
          destination.style.transform = `scale(${(1 + 0.16 * arrived).toFixed(3)})`
        }
      }

      /*
        ── Reduced motion, handled before GSAP gets involved ─────────────

        A plain matchMedia check, not a gsap.matchMedia condition. It was a
        condition, and it silently never fired: QA found the media query
        matching `reduce` while the progress attribute was still undefined,
        no inline dasharray had been written and the car sat at its JSX
        position. The route only LOOKED finished because a path with no
        dasharray renders whole — the reduced-motion branch had never run at
        all, and the state was right by accident rather than by intent.

        Done this way there is no ScrollTrigger to create and no condition to
        misfire: the journey is set to its end state and the hook returns.
      */
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([route, glow].filter(Boolean), { strokeDasharray: 'none' })
        // The end of the story, not a faster version of it: full route, car
        // at the destination, charging complete, popup away.
        apply(1)
        route.style.strokeDashoffset = '0'
        if (glow) glow.style.strokeDashoffset = '0'
        return
      }

      gsap.matchMedia().add(
        {
          desktop: '(min-width: 1024px)',
          handheld: '(max-width: 1023px)',
        },
        (ctx) => {
          const { desktop } = ctx.conditions as Record<string, boolean>

          gsap.set([route, glow].filter(Boolean), { strokeDasharray: 100 })
          apply(0)

          const driver = { t: 0 }
          const tl = gsap.timeline({
            scrollTrigger: {
              // Desktop pins the hero and takes its distance from the pin.
              // Small screens pin nothing: the hero is already taller than the
              // viewport there because the map sits under the copy, so pinning
              // it would hold a section whose bottom is off-screen. The map
              // scrolling past IS the interaction.
              trigger: desktop ? sceneEl : (stage.current ?? sceneEl),
              start: desktop ? 'top 72px' : 'top 85%',
              end: desktop ? '+=200%' : 'bottom 25%',
              pin: desktop ? sceneEl : false,
              pinSpacing: desktop,
              // Pins one frame early, which is what removes the jump you
              // otherwise get as the element switches to fixed.
              anticipatePin: desktop ? 1 : 0,
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          })

          tl.to(driver, {
            t: 1,
            duration: 1,
            ease: 'none',
            onUpdate: () => apply(driver.t),
          })

          /*
            Re-measure once the page settles. ScrollTrigger reads geometry when
            the timeline is built, and at that moment the hero's height comes
            from a class the stylesheet may not have applied and the fonts
            above the fold have not loaded. A range captured then is short, and
            the whole journey completes in the first screen of scrolling.
          */
          requestAnimationFrame(() => ScrollTrigger.refresh())
          if (document.fonts?.ready) {
            void document.fonts.ready.then(() => ScrollTrigger.refresh())
          }

          return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
          }
        },
      )
    }, sceneEl)

    // Kills every tween, ScrollTrigger and matchMedia this context created,
    // and restores the inline styles it wrote. Without it, a hot reload or a
    // client navigation leaves a second set of triggers on the same nodes.
    return () => context.revert()
  }, [scene, stage])
}

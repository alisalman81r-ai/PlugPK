// src/components/home/FreedomBand.tsx
'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import * as React from 'react'

/**
 * The quiet band under the hero: a car plugged in at a charger, and the one
 * thing the product promises, in two lines.
 *
 * ── Why it is here ────────────────────────────────────────────────────
 *
 * The hero is dense — a phone, a map, a car, four readings. This is the
 * breath after it: white, one picture, two sentences, and nothing to click.
 * It says what all of that machinery is for before the page goes on to show
 * how it works.
 *
 * ── The picture ───────────────────────────────────────────────────────
 *
 * A pastel render of a hatchback at a charging post, cut out of its green
 * studio backdrop by scripts/make-freedom-car.mjs so it sits on the white
 * band with no box around it — at 3× the source, with a smoothed, feathered
 * outline, so its edge reads as a photograph and not as a sticker. Its floor
 * shadow is redrawn in the band's ink, so the shadow and the sentence share
 * one colour.
 *
 * ── The scroll ────────────────────────────────────────────────────────
 *
 * The band grows into place as it comes up the screen: from the moment its
 * top edge enters at the bottom of the viewport to the moment its centre
 * reaches the centre, the car scales 0.72 → 1 and the line 0.9 → 1 while it
 * fades up. Then it stops — full size is the resting state, and the page
 * scrolls on past it to the next section as normal. No pinning: the band is
 * never held on screen or made to cost extra scroll.
 *
 * The car travels further than the type so the two separate slightly in depth
 * as they settle, which is what makes it read as the picture arriving rather
 * than the whole band zooming. A spring sits over the raw scroll value, so a
 * flick of the wheel eases in instead of stepping.
 *
 * transform and opacity only, so it stays on the compositor. Under
 * prefers-reduced-motion nothing moves: the band is simply there, full size.
 */

const INK = '#17313A'

/** Scroll progress in, eased by a spring so wheel steps do not show. */
const SPRING = { stiffness: 140, damping: 28, mass: 0.35 }

export function FreedomBand() {
  const ref = React.useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    // 0 when the band's top meets the viewport's bottom; 1 when the band's
    // centre meets the viewport's centre. Clamped beyond both.
    offset: ['start end', 'center center'],
  })
  const progress = useSpring(scrollYProgress, SPRING)

  const carScale = useTransform(progress, [0, 1], [0.72, 1])
  const textScale = useTransform(progress, [0, 1], [0.9, 1])
  const textOpacity = useTransform(progress, [0, 0.7], [0.25, 1])
  const carOpacity = useTransform(progress, [0, 0.5], [0.4, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-white py-[clamp(4.5rem,11vh,8rem)]" aria-labelledby="freedom-heading">
      <div className="container-plug flex flex-col items-center gap-10 text-center md:flex-row md:justify-center md:gap-[clamp(2.5rem,5vw,5rem)] md:text-left">
        <motion.div
          className="shrink-0 origin-center [will-change:transform]"
          style={reduce ? undefined : { scale: carScale, opacity: carOpacity }}
        >
          <Image
            src="/images/home/freedom-car-hd.png"
            alt=""
            width={1170}
            height={581}
            sizes="(max-width: 768px) 18rem, 24rem"
            quality={92}
            className="h-auto w-[18rem] md:w-[clamp(18rem,24vw,24rem)]"
          />
        </motion.div>
        <motion.h2
          id="freedom-heading"
          className="max-w-[46rem] origin-center text-[clamp(1.75rem,2.6vw,2.9rem)] font-bold leading-[1.22] tracking-[-0.025em] [will-change:transform] md:origin-left lg:max-w-none"
          style={reduce ? { color: INK } : { color: INK, scale: textScale, opacity: textOpacity }}
        >
          <span className="block lg:whitespace-nowrap">Drive anywhere in Pakistan, worry-free.</span>
          <span className="block lg:whitespace-nowrap">No range anxiety, just the open road.</span>
        </motion.h2>
      </div>
    </section>
  )
}

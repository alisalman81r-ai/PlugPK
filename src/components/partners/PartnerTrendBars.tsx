// src/components/partners/PartnerTrendBars.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * The illustrative bars in the dashboard preview: thirty days against the
 * thirty before. A gentle rise with a weekly wobble, the previous period flatter
 * and lower. No axis, no numbers, no dates — the shape of the chart, not a claim
 * about anybody's traffic. Decorative, so hidden from assistive tech.
 *
 * Computed, not random, so server and client render the same heights.
 */
const N = 30
const BARS = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1)
  const now = 22 + t * 66 + Math.sin(i * 0.9) * 6 + (i % 7 === 5 ? 6 : 0)
  const prev = 18 + t * 22 + Math.cos(i * 0.7) * 5
  return { now: Math.min(now, 96).toFixed(1), prev: Math.min(prev, 96).toFixed(1) }
})

const EASE_OUT = [0.16, 1, 0.3, 1] as const

export function PartnerTrendBars() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      aria-hidden="true"
      initial={reduce ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      className="relative flex min-h-[160px] items-end gap-0.5 rounded-[14px] border-b border-ink/10 bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] px-1.5 pt-3 sm:min-h-[200px] sm:gap-1 sm:px-2.5"
    >
      {BARS.map((bar, i) => {
        const last = i === BARS.length - 1
        return (
          <span key={i} className="relative flex h-full flex-1 items-end justify-center">
            <motion.i
              style={{ height: `${bar.prev}%`, originY: 1 }}
              variants={{ hidden: { scaleY: 0 }, shown: { scaleY: 1, transition: { duration: 0.9, ease: EASE_OUT, delay: 0.2 + i * 0.02 } } }}
              className="absolute inset-x-0 bottom-0 rounded-[5px_5px_2px_2px] bg-[#E2DED3]"
            />
            <motion.i
              style={{ height: `${bar.now}%`, originY: 1 }}
              variants={{ hidden: { scaleY: 0 }, shown: { scaleY: 1, transition: { duration: 1.1, ease: EASE_OUT, delay: 0.35 + i * 0.04 } } }}
              className={
                last
                  ? 'absolute inset-x-[18%] bottom-0 rounded-[5px_5px_2px_2px] bg-[linear-gradient(180deg,#D4FF3A,#B8E62A)] shadow-[inset_0_0_0_1px_rgba(11,12,14,.18)]'
                  : 'absolute inset-x-[18%] bottom-0 rounded-[5px_5px_2px_2px] bg-[linear-gradient(180deg,#2A2E35,#0B0C0E)]'
              }
            />
          </span>
        )
      })}
    </motion.div>
  )
}

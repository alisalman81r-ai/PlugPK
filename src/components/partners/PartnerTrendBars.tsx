// src/components/partners/PartnerTrendBars.tsx
'use client'

import * as React from 'react'

import { gsap, prefersReduced } from '@/lib/gsap'

/**
 * The illustrative bars in the dashboard preview: thirty days against the
 * thirty before. A gentle rise with a weekly wobble, the previous period flatter
 * and lower. No axis, no numbers, no dates — the shape of the chart, not a claim
 * about anybody's traffic. Decorative, so hidden from assistive tech.
 *
 * Computed, not random, so server and client render the same heights.
 *
 * Motion is page-partner.js's: once the plot is 92% down the viewport, and
 * 0.7s after, the previous period grows (0.9s, expo.out, 0.02s apart), then
 * this period springs up over it (1.1s, back.out(1.6), 0.04s apart, from 0.15s).
 */
const N = 30
const BARS = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1)
  const now = 22 + t * 66 + Math.sin(i * 0.9) * 6 + (i % 7 === 5 ? 6 : 0)
  const prev = 18 + t * 22 + Math.cos(i * 0.7) * 5
  return { now: Math.min(now, 96).toFixed(1), prev: Math.min(prev, 96).toFixed(1) }
})

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export function PartnerTrendBars() {
  const plotRef = React.useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const plot = plotRef.current
    if (!plot || prefersReduced()) return
    const ctx = gsap.context(() => {
      const prevs = plot.querySelectorAll('[data-bar-prev]')
      const nows = plot.querySelectorAll('[data-bar-now]')
      gsap.set([...prevs, ...nows], { scaleY: 0 })
      gsap
        .timeline({ scrollTrigger: { trigger: plot, start: 'top 92%', once: true }, delay: 0.7 })
        .to(prevs, { scaleY: 1, duration: 0.9, ease: 'expo.out', stagger: 0.02 })
        .to(nows, { scaleY: 1, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.04 }, 0.15)
    }, plot)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={plotRef}
      aria-hidden="true"
      className="relative flex min-h-[160px] items-end gap-0.5 rounded-[14px] border-b border-ink/10 bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] px-1.5 pt-3 sm:min-h-[200px] sm:gap-1 sm:px-2.5"
    >
      {BARS.map((bar, i) => {
        const last = i === BARS.length - 1
        return (
          <span key={i} className="relative flex h-full flex-1 items-end justify-center">
            <i
              data-bar-prev=""
              style={{ height: `${bar.prev}%` }}
              className="absolute inset-x-0 bottom-0 origin-bottom rounded-[5px_5px_2px_2px] bg-[#E2DED3]"
            />
            <i
              data-bar-now=""
              style={{ height: `${bar.now}%` }}
              className={
                last
                  ? 'absolute inset-x-[18%] bottom-0 origin-bottom rounded-[5px_5px_2px_2px] bg-[linear-gradient(180deg,#D4FF3A,#B8E62A)] shadow-[inset_0_0_0_1px_rgba(11,12,14,.18)]'
                  : 'absolute inset-x-[18%] bottom-0 origin-bottom rounded-[5px_5px_2px_2px] bg-[linear-gradient(180deg,#2A2E35,#0B0C0E)]'
              }
            />
          </span>
        )
      })}
    </div>
  )
}

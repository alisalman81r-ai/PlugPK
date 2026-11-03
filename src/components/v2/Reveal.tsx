// src/components/v2/Reveal.tsx
'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import * as React from 'react'

/**
 * landing-v2's [data-reveal]: content rises 32px and fades in as it enters the
 * viewport, once, on the brand's expo-out curve.
 *
 * As in the design, revealed content starts hidden and waits for script, so
 * use it for sections below the fold, never for a page's hero or its main
 * tool. With reduced motion, everything renders in place (`initial={false}`).
 * Children of a <RevealGroup> stagger 0.06s apart.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  /** Distance travelled, px. */
  y?: number
}

export function Reveal({ delay = 0, y = 32, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** A grid or list whose direct <RevealItem> children enter one after another. */
export function RevealGroup({ children, stagger = 0.06, ...rest }: HTMLMotionProps<'div'> & { stagger?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * A number that counts up from 0 when it scrolls into view (landing-v2's
 * [data-count]). Renders the final value in the HTML, so it is correct
 * without script and for screen readers.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  React.useEffect(() => {
    const el = ref.current
    if (!el || reduce || value <= 0) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1400)
          const eased = 1 - Math.pow(1 - t, 4)
          el.textContent = Math.round(value * eased).toLocaleString('en-PK')
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, reduce])
  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('en-PK')}
    </span>
  )
}

// src/components/home/HoverCountUp.tsx
'use client'

import * as React from 'react'

/**
 * A figure that counts up from zero each time its card is pointed at.
 *
 * The real value is what the server renders and what stays on screen at rest,
 * so the number is right without JavaScript, for screen readers (the animated
 * digits are aria-hidden and the true value is in an sr-only twin), and for
 * anyone who prefers reduced motion — for them the count never runs.
 *
 * It listens on the nearest `[data-hover-card]` ancestor rather than on itself,
 * so hovering anywhere on the card starts it.
 */
export function HoverCountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [shown, setShown] = React.useState(value)
  const frame = React.useRef<number | null>(null)

  React.useEffect(() => {
    setShown(value)
    const card = ref.current?.closest('[data-hover-card]')
    if (!card) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const run = () => {
      if (frame.current != null) cancelAnimationFrame(frame.current)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs)
        // Ease-out cubic: fast at first, settling onto the real figure.
        const eased = 1 - Math.pow(1 - t, 3)
        setShown(Math.round(value * eased))
        if (t < 1) frame.current = requestAnimationFrame(tick)
        else frame.current = null
      }
      frame.current = requestAnimationFrame(tick)
    }

    card.addEventListener('mouseenter', run)
    card.addEventListener('focusin', run)
    return () => {
      card.removeEventListener('mouseenter', run)
      card.removeEventListener('focusin', run)
      if (frame.current != null) cancelAnimationFrame(frame.current)
    }
  }, [value, durationMs])

  return (
    <span ref={ref}>
      <span aria-hidden="true">{shown.toLocaleString('en-PK')}</span>
      <span className="sr-only">{value.toLocaleString('en-PK')}</span>
    </span>
  )
}

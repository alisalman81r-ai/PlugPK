// src/components/ui/TiltCard.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TiltCardProps {
  children: React.ReactNode
  /** Degrees of rotation at the far edge. Small on purpose. */
  maxTilt?: number
  /** Lifts the card toward the viewer while the pointer is over it. */
  lift?: number
  className?: string
}

/**
 * Wraps a card on a perspective stage so it rotates toward the pointer.
 *
 * A wrapper rather than a change to the card itself: StationCard renders on
 * the map, the saved list and the dashboard as well, and none of those want
 * a card that moves when you pass over it. The effect belongs to this
 * placement, not to the component.
 *
 * The glare is a second, cheaper cue — a soft highlight that tracks the
 * pointer, which is what actually sells a flat surface as tilted. Without it
 * the rotation alone reads as a wobble.
 *
 * Guards match the hero and the route planner: mouse only, nothing attached
 * for coarse pointers or reduced motion, frames throttled through rAF.
 */
export function TiltCard({ children, maxTilt = 6, lift = 10, className }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pose, setPose] = React.useState({ x: 0, y: 0, active: false })

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced || coarse) return

    let raf = 0

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        setPose({ x, y, active: true })
      })
    }

    const onLeave = () => {
      cancelAnimationFrame(raf)
      setPose({ x: 0, y: 0, active: false })
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className={cn('[perspective:1100px]', className)}>
      <div
        style={{
          // Inverted on X so the card leans toward the cursor.
          transform: `rotateX(${-pose.y * 2 * maxTilt}deg) rotateY(${pose.x * 2 * maxTilt}deg) translateZ(${pose.active ? lift : 0}px)`,
        }}
        className="relative h-full [transform-style:preserve-3d] transition-transform duration-[350ms] ease-out motion-reduce:!transform-none motion-reduce:transition-none"
      >
        {children}

        {/* Glare. pointer-events-none so it never intercepts a click on the
            card beneath, and it fades out entirely once the pointer leaves. */}
        <span
          aria-hidden="true"
          style={{
            opacity: pose.active ? 1 : 0,
            background: `radial-gradient(420px circle at ${(pose.x + 0.5) * 100}% ${(pose.y + 0.5) * 100}%, rgba(255,255,255,0.20), transparent 45%)`,
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 motion-reduce:hidden"
        />
      </div>
    </div>
  )
}

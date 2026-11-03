// src/components/auth/AuthRoute.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * The glowing volt route that draws itself along the foot of the brand panel
 * (.auth__route in page-auth.css). Decoration only.
 */
export function AuthRoute({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <motion.path
        d="M-20 880 C 180 878, 330 862, 450 830 S 590 770, 640 740"
        fill="none"
        stroke="#D4FF3A"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ opacity: 0.55, filter: 'drop-shadow(0 0 8px rgba(212,255,58,.7))' }}
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

// src/components/auth/AuthRoute.tsx
import motion from './auth-motion.module.css'

/**
 * The glowing volt route that draws itself along the foot of the brand panel
 * (.auth__route in page-auth.css). Decoration only.
 *
 * Drawn in CSS exactly as the design does it: a 1400 dash slid to 0 over
 * 2.4s after 0.3s, on the design's ease-out. Under reduced motion it is
 * simply there.
 */
export function AuthRoute({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path className={motion.route} d="M-20 880 C 180 878, 330 862, 450 830 S 590 770, 640 740" />
    </svg>
  )
}

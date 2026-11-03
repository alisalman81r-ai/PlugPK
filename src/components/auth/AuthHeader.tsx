// src/components/auth/AuthHeader.tsx
import { cn } from '@/lib/utils'

export interface AuthHeaderProps {
  /** The mono kicker above the title, in volt ink. */
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

/**
 * The heading at the top of an auth card (.acard of landing-v2): a mono
 * eyebrow, Power Grotesk Regular at 38–48px, and a muted line under it.
 */
export function AuthHeader({ eyebrow, title, subtitle, className }: AuthHeaderProps) {
  return (
    <div className={cn('mb-[30px]', className)}>
      {eyebrow ? (
        <p className="mb-3.5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-volt-ink">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="m-0 text-balance font-display text-[clamp(34px,4vw,48px)] leading-none text-ink">{title}</h1>
      {subtitle ? <p className="mt-3 text-pretty text-base leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
  )
}

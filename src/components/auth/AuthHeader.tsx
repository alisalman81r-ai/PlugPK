// src/components/auth/AuthHeader.tsx
import { cn } from '@/lib/utils'

export interface AuthHeaderProps {
  /** A small-caps line above the title, in the brand teal. */
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

/**
 * The heading above an auth form.
 *
 * font-display at a clamped size, matching every other heading on the site.
 * `text-3xl font-black` was the sans face at a weight nothing else uses, so the
 * one screen a new visitor sees first was also the one that looked least like
 * the product they had just come from.
 */
export function AuthHeader({ eyebrow, title, subtitle, className }: AuthHeaderProps) {
  return (
    <div className={cn('mb-7', className)}>
      {eyebrow ? (
        <p className="mb-2.5 text-ui-xs font-bold uppercase tracking-[0.18em] text-plug-cyan-700">{eyebrow}</p>
      ) : null}
      <h1 className="text-balance font-display text-[clamp(1.75rem,2.6vw,2.125rem)] font-bold leading-[1.15] tracking-tight text-slate-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-pretty text-ui leading-relaxed text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  )
}

// src/components/shared/SectionIntro.tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The heading block above a section.
 *
 * Partner Up had four of these written out by hand — "How it works", "What you
 * get", "Plans", "The directory" — and they had already drifted: two carried a
 * lead paragraph and two did not, the eyebrows used `tracking-widest` against
 * the `tracking-[0.14em]` the rest of the site settled on, and the headings were
 * `text-3xl font-black sm:text-4xl` where every other page had moved to a
 * clamped display size. Four copies of a heading is four chances for the next
 * edit to land in three of them.
 *
 * The type matches the card header bands on /map, /routes and /community: the
 * same eyebrow, the same display face, the same clamp. A section intro and a
 * card header are doing the same job at different scales, and they should not
 * look like two different systems doing it.
 */

export interface SectionIntroProps {
  /** The small line above the heading. Kept short — it is a label, not a sentence. */
  eyebrow?: string
  /** An icon for the eyebrow, matching the card headers elsewhere. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** One line at most. If it needs two, the heading is doing too little. */
  lead?: React.ReactNode
  align?: 'left' | 'center'
  /** For a section on a dark band. */
  tone?: 'light' | 'dark'
  className?: string
}

export function SectionIntro({
  eyebrow,
  icon,
  title,
  lead,
  align = 'center',
  tone = 'light',
  className,
}: SectionIntroProps) {
  const centred = align === 'center'
  const dark = tone === 'dark'

  return (
    <div className={cn(centred && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow ? (
        <p
          className={cn(
            'flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em]',
            centred && 'justify-center',
            dark ? 'text-plug-cyan-300' : 'text-plug-blue-600',
          )}
        >
          {icon}
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={cn(
          'mt-3 text-balance font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold leading-[1.12] tracking-tight',
          dark ? 'text-white' : 'text-slate-900',
        )}
      >
        {title}
      </h2>

      {lead ? (
        <p
          className={cn(
            'mt-4 text-pretty text-ui leading-relaxed sm:text-base',
            centred && 'mx-auto max-w-xl',
            // white/65 rather than the white/60 these sections used: at this
            // size the old value sat under 4.5:1 on the darkest band.
            dark ? 'text-white/65' : 'text-slate-500',
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}

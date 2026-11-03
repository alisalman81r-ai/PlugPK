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
 * Styled as landing-v2's .shead: a JetBrains Mono eyebrow in volt ink (volt
 * on dark), a Power Grotesk heading, and a muted lead.
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
            'flex items-center gap-2.5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em]',
            centred && 'justify-center',
            dark ? 'text-volt' : 'text-volt-ink',
          )}
        >
          {icon}
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={cn(
          'mt-[18px] text-balance font-display text-[clamp(30px,3.9vw,56px)] leading-[1.04]',
          dark ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>

      {lead ? (
        <p
          className={cn(
            'mt-5 text-pretty text-[clamp(16px,1.3vw,19px)] leading-[1.6]',
            centred && 'mx-auto max-w-[40rem]',
            // white/65 rather than the white/60 these sections used: at this
            // size the old value sat under 4.5:1 on the darkest band.
            dark ? 'text-white/70' : 'text-muted',
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}

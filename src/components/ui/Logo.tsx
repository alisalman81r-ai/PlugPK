// src/components/ui/Logo.tsx

import { cn } from '@/lib/utils'

/**
 * The plugpk logo: the mark, the wordmark, and optionally the line under it.
 *
 * ── The mark ──────────────────────────────────────────────────────────
 *
 * The landing-v2 mark: a volt tile with soft corners and an ink bolt cut
 * through it. It reads the same on ink and on paper, so it has one colouring.
 *
 * ── Two tones ─────────────────────────────────────────────────────────
 *
 *   dark   for dark grounds: white "plug", volt "pk" — the artwork
 *   light  for light grounds: ink "plug", and "pk" in volt ink, because volt
 *          itself cannot carry type on paper (1.1:1)
 *
 * The wordmark is Power Grotesk drawn at its bold stroke (pg-bold).
 */

const VOLT = '#D4FF3A'
const VOLT_INK = '#3F5200'
const INK = '#0B0C0E'

export interface LogoMarkProps {
  className?: string
  /** Tile colour. Defaults to volt. */
  color?: string
  /** Bolt colour. Defaults to ink. */
  boltColor?: string
}

/** The tile and bolt on their own, 1:1. Size it with className (h-/w-). */
export function LogoMark({ className, color = VOLT, boltColor = INK }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={color} />
      <path d="M18.6 4.5 8.5 18h6.8l-1.9 9.5L23.5 14h-6.8z" fill={boltColor} />
    </svg>
  )
}

export interface LogoProps {
  tone?: 'dark' | 'light'
  /** Height of the wordmark's type, as a Tailwind text- class. The mark scales with it. */
  size?: string
  /** "Powering Pakistan's EV Journey" under the wordmark. */
  tagline?: boolean
  className?: string
}

export function Logo({ tone = 'dark', size = 'text-2xl', tagline = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex flex-col items-start', size, className)}>
      <span className="inline-flex items-center gap-[0.42em]">
        <LogoMark className="h-[1.3em] w-[1.3em] shrink-0" />
        <span className="pg-bold font-display leading-none">
          <span className={tone === 'dark' ? 'text-white' : 'text-ink'}>plug</span>
          <span style={{ color: tone === 'dark' ? VOLT : VOLT_INK }}>pk</span>
        </span>
      </span>
      {tagline ? (
        <span
          className={cn(
            'mt-[0.42em] whitespace-nowrap pl-[0.08em] text-[max(0.36em,9.5px)] font-medium leading-none tracking-[0.07em]',
            tone === 'dark' ? 'text-white/70' : 'text-muted',
          )}
        >
          Powering Pakistan&rsquo;s EV Journey
        </span>
      ) : null}
    </span>
  )
}

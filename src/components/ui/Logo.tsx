// src/components/ui/Logo.tsx

import { cn } from '@/lib/utils'

/**
 * The plug.pk logo: the bolt-and-plug mark, the wordmark, and optionally the
 * line under it.
 *
 * ── The mark ──────────────────────────────────────────────────────────
 *
 * Traced from the brand artwork: a leaning bolt with soft corners, and beside
 * its lower arm a plug head — a sliver parallel to the bolt's cutting edge with
 * one prong pointing right. The corners are rounded by stroking each polygon
 * in its own fill with round joins, which keeps the geometry to a handful of
 * points while the radius stays constant at every size.
 *
 * ── Two tones ─────────────────────────────────────────────────────────
 *
 *   dark   for dark grounds: mint mark and ".pk", white "plug" — the artwork
 *   light  for white grounds: mint cannot carry text on white (1.6:1), so the
 *          mark and ".pk" take the deeper teal (#159E89, 3.3:1, enough for a
 *          bold wordmark at this size) and "plug" goes to slate-900
 */

const MINT = '#6FE8B6'
const TEAL = '#159E89'

export interface LogoMarkProps {
  className?: string
  /** Fill colour. Defaults to the brand mint. */
  color?: string
}

/** The bolt and plug on their own, 1:1. Size it with className (h-/w-). */
export function LogoMark({ className, color = MINT }: LogoMarkProps) {
  return (
    <svg viewBox="4 6 160 160" className={className} aria-hidden="true" focusable="false">
      <g fill={color} stroke={color} strokeLinejoin="round">
        <path strokeWidth={11} d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z" />
        <path strokeWidth={5} d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z" />
      </g>
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
  const accent = tone === 'dark' ? MINT : TEAL
  return (
    <span className={cn('inline-flex flex-col items-start', size, className)}>
      <span className="inline-flex items-center gap-[0.22em]">
        {/* The mark is set a touch taller than the x-height would suggest, as
            in the artwork, and nudged down so it centres on the lowercase. */}
        <LogoMark color={accent} className="h-[1.18em] w-[1.18em] shrink-0 translate-y-[0.04em]" />
        <span className="font-bold leading-none tracking-[-0.035em]">
          <span className={tone === 'dark' ? 'text-white' : 'text-slate-900'}>plug</span>
          <span style={{ color: accent }}>.pk</span>
        </span>
      </span>
      {/*
        The line under the wordmark. The artwork sets it at about a fifth of
        the wordmark's size, which at navbar scale is 5px and unreadable, so
        it has a floor of 9.5px; the tracking tightens at that floor so the
        line stays close to the logo's own width, as in the artwork.
      */}
      {tagline ? (
        <span
          className={cn(
            'mt-[0.42em] whitespace-nowrap pl-[0.08em] text-[max(0.36em,9.5px)] font-medium leading-none tracking-[0.07em]',
            tone === 'dark' ? 'text-white/70' : 'text-slate-500',
          )}
        >
          Powering Pakistan&rsquo;s EV Journey
        </span>
      ) : null}
    </span>
  )
}

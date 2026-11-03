// src/components/cars/BrandMarquee.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The brands, running continuously in a paper strip lifted into the hero
 * (landing-v2's .brands). Each name is a filter: pressing one narrows the
 * catalogue to that brand, pressing it again lets it go.
 *
 * Built in CSS: the track holds the list twice and translates exactly -50%, so
 * at the end of the cycle the second copy sits precisely where the first
 * started and the jump back is invisible. It runs on the compositor and costs
 * no JavaScript. Hovering, focusing or touching the strip pauses it, since a
 * button that moves is hard to press.
 *
 * Only the first copy is in the accessibility tree and the tab order; the
 * second exists for the loop alone. With reduced motion the strip stops and
 * scrolls sideways instead.
 */

export interface BrandMarqueeProps {
  brands: string[]
  /** The brand the catalogue is narrowed to, if exactly one. */
  active: string | null
  onSelect: (brand: string | null) => void
}

export function BrandMarquee({ brands, active, onSelect }: BrandMarqueeProps) {
  const [paused, setPaused] = React.useState(false)
  const resume = React.useRef<number>()

  // Below about eight the loop is visibly short — the same name comes back
  // around too quickly to read as a stream. Repeating the list evens that out.
  const sequence = brands.length < 8 ? [...brands, ...brands] : brands

  return (
    <nav
      aria-label="Filter by brand"
      data-theme="light"
      onTouchStart={() => {
        window.clearTimeout(resume.current)
        setPaused(true)
      }}
      onTouchEnd={() => {
        resume.current = window.setTimeout(() => setPaused(false), 2500)
      }}
      className={cn(
        'group/brands relative z-[3] mx-auto -mt-10 w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] overflow-hidden rounded-[20px] border border-white/60 bg-paper shadow-e4 sm:-mt-12 sm:rounded-[26px]',
        'motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:none]',
        'before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-[2] before:w-9 before:bg-[linear-gradient(90deg,#F4F3EE,transparent)] sm:before:w-[72px]',
        'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-[2] after:w-9 after:bg-[linear-gradient(-90deg,#F4F3EE,transparent)] sm:after:w-[72px]',
      )}
    >
      <div
        className={cn(
          'flex w-max animate-marquee [animation-duration:70s] group-focus-within/brands:[animation-play-state:paused] group-hover/brands:[animation-play-state:paused] motion-reduce:animate-none',
          paused && '[animation-play-state:paused]',
        )}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className={cn(
              'flex shrink-0 items-center gap-0.5 px-2.5 py-2 sm:gap-1.5 sm:px-[clamp(14px,1.7vw,26px)] sm:py-3.5',
              copy === 1 && 'motion-reduce:hidden',
            )}
          >
            {sequence.map((brand, index) => {
              const on = active === brand
              return (
                <button
                  key={`${copy}-${brand}-${index}`}
                  type="button"
                  tabIndex={copy === 1 ? -1 : undefined}
                  aria-pressed={copy === 0 ? on : undefined}
                  onClick={() => onSelect(on ? null : brand)}
                  className={cn(
                    'inline-flex h-[46px] items-center whitespace-nowrap rounded-full px-3.5 font-display text-[19px] leading-none transition-[color,background-color,transform] duration-300 ease-spring sm:h-[52px] sm:px-[clamp(14px,1.7vw,26px)] sm:text-[clamp(20px,1.7vw,26px)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink',
                    on ? 'bg-ink text-white' : 'text-ink/55 hover:-translate-y-0.5 hover:text-ink',
                  )}
                >
                  {brand}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}

// src/components/auth/StandaloneShell.tsx
import Link from 'next/link'

import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

import motion from './auth-motion.module.css'

/**
 * The single centred page of landing-v2 (`.lyb` in page-auth.css), for the
 * screens that stand outside the site's navbar: the business portal's front
 * door, listing a charger, and the car picker after sign-up. A sticky
 * frosted bar with the wordmark and one link, on the dotted chalk ground,
 * with a soft volt glow behind the heading.
 */
export function StandaloneShell({
  aside,
  children,
  width = 'max-w-[920px]',
}: {
  /** The bar's right-hand link or button. */
  aside?: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  return (
    <div
      data-theme="light"
      className="flex min-h-viewport flex-col text-ink [background:radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)_0_0/14px_14px,radial-gradient(80%_50%_at_50%_0%,#FAF9F6,#F4F3EE_70%)]"
    >
      <header className="sticky top-0 z-[2] flex items-center justify-between gap-3 border-b border-ink/10 bg-paper/[0.82] px-[clamp(16px,4vw,48px)] py-3 backdrop-blur-[14px] sm:py-4">
        <Link href="/" aria-label="plugpk home" className="inline-flex min-h-11 items-center rounded-full focus-visible:outline-none focus-visible:shadow-focus">
          <Logo tone="light" size="text-[22px]" />
        </Link>
        {aside}
      </header>

      <main className={cn('relative isolate mx-auto w-full px-[clamp(16px,4vw,32px)] pb-[72px] pt-[clamp(40px,8vw,96px)]', width)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[620px] w-[min(820px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.2),transparent_70%)]"
        />
        {children}
      </main>
    </div>
  )
}

/*
  page-auth.css: the .lyb page rises in like the account screens — the chip,
  then the title (.06s) and the lead (.12s), the cards one after another
  (.2s, .26s, .32s, .38s) and the actions (.46s), each 22px over 0.9s.
*/
export const SHELL_CARD_DELAY = [motion.d20, motion.d26, motion.d32, motion.d38]
/** Rise class for the nth card (from 0), as .lyb__card:nth-child(n). */
export function shellCardRise(index: number) {
  return cn(motion.rise, SHELL_CARD_DELAY[index])
}
export const SHELL_ACTIONS_RISE = cn(motion.rise, motion.d46)

/** The ink chip with a volt square that heads the page (.lyb__chip). */
export function ShellChip({ children }: { children: React.ReactNode }) {
  return (
    <p
      className={cn(
        motion.rise,
        "m-0 inline-flex h-9 items-center gap-2.5 rounded-full bg-ink px-4 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-white before:h-2 before:w-2 before:rounded-[3px] before:bg-volt before:content-['']",
      )}
    >
      {children}
    </p>
  )
}

/** The big centred title (.lyb__title) and lead (.lyb__lead). */
export const SHELL_TITLE = `${motion.rise} ${motion.d06} mx-auto mt-[26px] max-w-[820px] text-balance font-display text-[clamp(38px,6vw,76px)] leading-[1.02]`
export const SHELL_LEAD = `${motion.rise} ${motion.d12} mx-auto mt-[26px] max-w-[700px] text-pretty text-[clamp(16px,1.5vw,19px)] leading-[1.6] text-muted`

/** A back arrow inside SHELL_BAR_LINK: steps 3px left on hover (.auth__back svg). */
export const SHELL_BACK_ICON = 'transition-transform duration-300 ease-spring group-hover/back:-translate-x-[3px]'

/** The bar's link: a quiet pill (.auth__back); a back arrow in it steps left on hover. */
export const SHELL_BAR_LINK =
  'group/back inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:shadow-focus sm:px-4 sm:text-sm'

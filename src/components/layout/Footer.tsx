// src/components/layout/Footer.tsx
'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { LogoMark } from '@/components/ui/Logo'
import { POPULAR_CITIES, SITE_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * The footer, in two layers.
 *
 * ── The panel ─────────────────────────────────────────────────────────
 *
 * Everything a visitor might be looking for, on the site's deepest pine: a
 * closing line with the one action, then the columns — chargers by city,
 * the product, the community, business, account — and on the right, contact
 * and the app. Its bottom-right corner is one large curve, so the layer
 * behind shows through there.
 *
 * ── The reveal ────────────────────────────────────────────────────────
 *
 * Behind it, on a deep forest green, the wordmark. As the footer scrolls up
 * into view the panel lifts away and "plug.pk" rises out of the bottom edge,
 * set enormous in light type, until it sits full-width under the panel. Both
 * are tied to scroll position, through a spring, so the motion follows the
 * wheel rather than playing once. Under reduced motion both are simply in
 * place.
 *
 * ── Only what is true ─────────────────────────────────────────────────
 *
 * No social icons: the project has no social accounts, and icons pointing at
 * profiles that do not exist would be the worst kind of placeholder. The app
 * is not released, so its card and store pills say "Coming soon" and link to
 * the app banner rather than to a store. The city links open the real map
 * search for that city.
 */

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Chargers in',
    links: POPULAR_CITIES.map((city) => ({ label: city, href: `/map?q=${encodeURIComponent(city)}` })),
  },
  {
    heading: 'Plug.pk',
    links: [
      { label: 'Charging map', href: '/map' },
      { label: 'Plan a route', href: '/routes' },
      { label: 'EV services', href: '/services' },
      { label: 'Cars', href: '/cars' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Discussions', href: '/community' },
      { label: 'EV clubs', href: '/community/clubs' },
    ],
  },
  {
    heading: 'Business',
    links: [
      { label: 'Partner Up', href: '/partners' },
      { label: 'List your business', href: '/for-businesses' },
      { label: 'Business sign-up', href: '/business/signup' },
      { label: 'Business portal', href: '/business/dashboard' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Your dashboard', href: '/dashboard' },
    ],
  },
]

const LEGAL_LINKS: FooterLink[] = [{ label: 'Data and image credits', href: '/credits' }]

const LINK_CLASS =
  'group/link relative inline-flex w-fit items-center text-[15px] text-white/70 transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:outline-none motion-reduce:transition-none'

const UNDERLINE_CLASS =
  'absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-plug-cyan-400 transition-transform duration-300 ease-out group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 motion-reduce:transition-none'

/** A store pill for an app that is not out yet: shaped like the link it will become. */
function StorePill({ label, glyph }: { label: string; glyph: React.ReactNode }) {
  return (
    <span className="inline-flex h-11 items-center gap-2.5 rounded-full border border-white/25 pl-4 pr-2 text-[14px] font-medium text-white/85">
      {glyph}
      {label}
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-plug-cyan-300">
        Soon
      </span>
    </span>
  )
}

const APPLE = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M16.37 12.54c-.02-2.1 1.72-3.12 1.8-3.17-.98-1.44-2.51-1.63-3.05-1.65-1.3-.13-2.54.77-3.2.77-.66 0-1.67-.75-2.75-.73-1.41.02-2.72.82-3.45 2.09-1.47 2.55-.38 6.32 1.06 8.39.7 1.01 1.53 2.15 2.62 2.11 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.62.68 2.73.66 1.13-.02 1.85-1.03 2.54-2.05.8-1.17 1.13-2.3 1.15-2.36-.03-.01-2.2-.85-2.22-3.35zM14.3 6.37c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.53.62-1 1.61-.88 2.56.93.07 1.88-.47 2.46-1.16z" />
  </svg>
)

const PLAY = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M4.2 2.6c-.24.25-.38.64-.38 1.14v16.52c0 .5.14.89.38 1.14l.06.06 9.26-9.26v-.2L4.26 2.54l-.06.06zm12.4 12.5-3.08-3.09v-.2l3.08-3.09.07.04 3.66 2.08c1.04.59 1.04 1.56 0 2.15l-3.66 2.08-.07.03zm-.07.04L13.4 12 4.2 21.26c.34.36.9.4 1.54.05l10.8-6.17m0-6.28L5.74 2.7c-.64-.36-1.2-.31-1.54.05L13.4 12l3.12-3.14z" />
  </svg>
)

export function Footer() {
  const year = new Date().getFullYear()
  const ref = React.useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  // 0 as the footer's top meets the viewport's bottom, 1 as its bottom does.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  // The panel lifts away over the last part of the scroll...
  const panelY = useTransform(progress, [0.3, 1], [0, -36])
  // ...while the wordmark rises out of the bottom edge.
  const markY = useTransform(progress, [0.3, 0.95], ['75%', '0%'])
  const markOpacity = useTransform(progress, [0.3, 0.65], [0, 1])

  return (
    <footer ref={ref} className="relative overflow-hidden bg-[#0C3A31]">
      {/* ── The panel ──────────────────────────────────────────────── */}
      <motion.div
        style={reduce ? undefined : { y: panelY }}
        className="relative z-10 rounded-br-[4rem] bg-plug-navy-950 sm:rounded-br-[6rem] lg:rounded-br-[9rem]"
      >
        <div className="container-plug">
          {/* Closing line and the one action. */}
          <div className="flex flex-col gap-8 border-b border-white/10 py-14 sm:flex-row sm:items-end sm:justify-between lg:py-16">
            <h2 className="max-w-xl text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Ready to find your <span className="text-[#6FE8B6]">next charge?</span>
            </h2>
            <Link
              href="/map"
              className="group/cta inline-flex h-14 shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[#6FE8B6] px-7 text-[15px] font-semibold text-[#062A22] transition-colors duration-200 hover:bg-[#8FF2CB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE8B6] focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 sm:self-auto"
            >
              Find a charger
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="shrink-0 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          </div>

          {/* The columns, and contact and the app on the right. */}
          <div className="grid gap-x-8 gap-y-12 pb-20 pt-14 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(15rem,17rem)] lg:pb-28">
            <nav aria-label="Footer" className="contents">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <h3 className="mb-5 text-[15px] font-semibold text-white">{column.heading}</h3>
                  <ul className="flex flex-col gap-3">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={LINK_CLASS}>
                          {link.label}
                          <span aria-hidden="true" className={UNDERLINE_CLASS} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="flex flex-col gap-8 sm:col-span-2 lg:col-span-1">
              <div>
                <h3 className="mb-5 text-[15px] font-semibold text-white">Get in touch</h3>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="inline-flex h-11 items-center gap-2.5 rounded-full border border-white/25 px-4 text-[14px] text-white/85 transition-colors duration-200 hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400"
                >
                  <Mail size={15} className="shrink-0 text-plug-cyan-300" aria-hidden="true" />
                  {SITE_CONFIG.email}
                </a>
              </div>

              <div>
                <h3 className="mb-5 text-[15px] font-semibold text-white">Application</h3>
                <div className="flex flex-wrap gap-2.5">
                  <StorePill label="App Store" glyph={APPLE} />
                  <StorePill label="Play Store" glyph={PLAY} />
                </div>
              </div>

              {/* The app card, where the reference has its QR code: there is
                  no app to scan for yet, so it says so and points at the banner. */}
              <Link
                href="/#app"
                className="group/app flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0C3A31]">
                  <LogoMark className="h-7 w-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-white">The plug.pk app</span>
                  <span className="block text-[13px] text-white/60">Coming soon to iOS and Android</span>
                </span>
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="ml-auto shrink-0 text-white/40 transition-transform duration-200 group-hover/app:-translate-y-0.5 group-hover/app:translate-x-0.5 group-hover/app:text-white"
                />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── The reveal ─────────────────────────────────────────────── */}
      <div className="relative pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-plug flex flex-col items-start justify-between gap-3 pt-8 text-[13px] text-white/70 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2">
            <MapPin size={13} className="text-[#6FE8B6]" aria-hidden="true" />
            Built for EV drivers in Pakistan
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>
              &copy; {year} {SITE_CONFIG.name}. All rights reserved.
            </span>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white/70 focus-visible:text-white focus-visible:outline-none"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* The wordmark, rising out of the bottom edge. aria-hidden: the
            copyright line above already names the site. */}
        <div aria-hidden="true" className="-mb-[0.05em] mt-6 overflow-hidden px-[1vw] lg:mt-2">
          <motion.p
            style={reduce ? undefined : { y: markY, opacity: markOpacity }}
            className={cn(
              'select-none whitespace-nowrap pb-[0.06em] pt-[0.04em] text-center font-black leading-[0.9] tracking-[-0.06em]',
              'text-[clamp(5.5rem,31vw,42rem)]',
            )}
          >
            <span className="text-[#E9FAF3]">plug</span>
            <span className="text-[#6FE8B6]">.pk</span>
          </motion.p>
        </div>
      </div>
    </footer>
  )
}

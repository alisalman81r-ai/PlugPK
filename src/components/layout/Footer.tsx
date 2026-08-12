// src/components/layout/Footer.tsx
import { ArrowUpRight, Mail, Zap } from 'lucide-react'
import Link from 'next/link'

import { SITE_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

/**
 * Every href here resolves to a real route. The previous footer listed
 * seventeen internal links of which eleven — /about, /contact, /help, /blog,
 * /careers, /terms, /privacy, /cookies, /advertise, /add-station, /report —
 * returned 404, alongside four social profiles that were never real
 * accounts. A footer full of dead ends is the least premium thing a site can
 * do, so this lists only what exists and stays short because of it.
 */
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Charge',
    links: [
      { label: 'Charging map', href: '/map' },
      { label: 'Plan a route', href: '/routes' },
      { label: 'EV services', href: '/services' },
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

/**
 * Underline that wipes in from the left on hover and focus. Scale on a
 * pseudo-free span keeps it on the compositor — no layout, no repaint of the
 * text itself.
 */
const LINK_CLASS =
  'group/link relative inline-flex w-fit items-center text-ui-sm text-white/55 transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:outline-none motion-reduce:transition-none'

const UNDERLINE_CLASS =
  'absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-cyan-400 transition-transform duration-300 ease-out group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 motion-reduce:transition-none'

/**
 * Echoes the PortMeter used on every station card — the product's own signal
 * for availability. Reusing that shape here ties the closing frame back to
 * the interface rather than ending on a generic divider.
 */
function SegmentedRule() {
  return (
    <span aria-hidden="true" className="relative block h-px w-full bg-white/[0.09]">
      {/* A charged leading run rather than 24 loose dashes. The first pass
          split the full width into equal segments, which read as a broken
          line instead of a level. Keeping the rule continuous and letting
          one bright run sit at its head says the same thing quietly. */}
      <span className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-plug-blue-500 to-cyan-400" />
    </span>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-slate-950">
      {/* Single background idea, deliberately: one cool glow rising behind
          the wordmark. No photograph here — the hero already carries the
          photography, and text this large needs a clean field to sit on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.22),transparent_65%)]"
      />

      <div className="container-plug relative z-10">
        {/* ── Closing CTA ───────────────────────────────────────── */}
        <section className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:py-20">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 text-ui-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              <Zap size={13} className="fill-cyan-300 text-cyan-300" aria-hidden="true" />
              Start charging
            </span>

            <h2 className="max-w-2xl text-[clamp(2rem,5.5vw,3.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-white">
              Ready to find your
              <br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                next charge?
              </span>
            </h2>
          </div>

          <Link
            href="/map"
            className="group/cta inline-flex h-14 w-full shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-base font-semibold text-slate-950 transition-all duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none sm:w-auto"
          >
            Find a charger
            <ArrowUpRight
              size={18}
              className="shrink-0 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </section>

        <SegmentedRule />

        {/* ── Navigation ────────────────────────────────────────── */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 pt-12 sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:gap-x-10"
        >
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-5 text-ui-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-3.5">
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

          {/* The only contact detail the project actually holds. No invented
              social profiles — the four that used to sit here pointed at
              accounts that do not exist. */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:w-56">
            <h3 className="mb-5 text-ui-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Get in touch
            </h3>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="group/mail inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-ui-sm text-white/75 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 motion-reduce:transition-none"
            >
              <Mail size={15} className="shrink-0 text-cyan-300" aria-hidden="true" />
              {SITE_CONFIG.email}
            </a>
            <p className="mt-4 text-ui-xs leading-relaxed text-white/50">
              {SITE_CONFIG.tagline}
            </p>
          </div>
        </nav>
      </div>

      {/* ── Brand moment ──────────────────────────────────────────
          The closing frame.

          Three things this has to get right, all of which the first pass got
          wrong. `leading-none` plus bottom padding, because a line box
          shorter than the glyphs cuts the descenders off `p` and `g`. A
          filled gradient rather than a hairline stroke, because a 1px stroke
          simply disappears at this size. And a much wider clamp, so the mark
          actually spans the frame instead of floating in the middle of it.

          aria-hidden: the accessible name is already carried by the
          copyright line directly below, so this would only repeat it. */}
      <div className="relative z-10 px-4 pb-2">
        <p
          aria-hidden="true"
          className={cn(
            'select-none whitespace-nowrap pb-[0.12em] text-center font-black leading-none tracking-[-0.055em]',
            'text-[clamp(4rem,25vw,21rem)]',
            // Fades top-to-bottom so the mark reads as rising out of the
            // floor rather than sitting flat on it.
            'bg-gradient-to-b from-white/[0.17] via-white/[0.09] to-white/[0.02] bg-clip-text text-transparent',
          )}
        >
          {SITE_CONFIG.name.toLowerCase()}
        </p>
      </div>

      {/* ── Legal ─────────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/[0.08]">
        <div className="container-plug flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-ui-xs text-white/55">
            &copy; {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-ui-xs text-white/50">Built for EV drivers in Pakistan</p>
        </div>
      </div>
    </footer>
  )
}

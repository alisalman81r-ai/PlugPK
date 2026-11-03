// src/components/layout/Footer.tsx

import { Mail } from '@/components/ui/icons'
import Link from 'next/link'

import { NAV_TOOLS, POPULAR_CITIES, SITE_CONFIG } from '@/lib/constants'

/**
 * The landing-v2 footer, revealed from under the page.
 *
 * ── The reveal ─────────────────────────────────────────────────────────
 *
 * On a large enough screen the footer is `position: sticky; bottom: 0` under
 * <main>, which sits above it (z-2) with rounded bottom corners. Scrolling to
 * the end lifts the page off the footer like a sheet. Below 960×780 the footer
 * may be taller than the screen, so it scrolls normally there.
 *
 * ── Only what is true ─────────────────────────────────────────────────
 *
 * No social icons: the project has no social accounts. No store badges: there
 * are no listings. The city links open the real map search for that city. The
 * one contact route is SITE_CONFIG.email.
 *
 * Every link is at least 44px tall on a phone.
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
    heading: 'Charging',
    links: [
      { label: 'The charging map', href: '/map' },
      ...POPULAR_CITIES.map((city) => ({
        label: `Chargers in ${city}`,
        href: `/map?q=${encodeURIComponent(city)}`,
      })),
    ],
  },
  {
    heading: 'We are plugpk',
    links: [
      { label: 'Plan a route', href: '/routes' },
      { label: 'Cars', href: '/cars' },
      { label: 'EV services', href: '/services' },
      { label: 'Community', href: '/community' },
      { label: 'EV clubs', href: '/community/clubs' },
      ...NAV_TOOLS,
    ],
  },
  {
    heading: 'Business and account',
    links: [
      { label: 'Partner Up', href: '/partners' },
      { label: 'Business portal', href: '/business' },
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Data and image credits', href: '/credits' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

const LINK =
  'block py-1.5 text-[15px] text-white/60 transition-[color,translate] duration-300 ease-out hover:translate-x-1 hover:text-volt max-sm:flex max-sm:min-h-11 max-sm:items-center max-sm:py-0'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      data-theme="dark"
      className="relative z-[1] bg-[#070809] pb-[calc(4rem+env(safe-area-inset-bottom))] text-white lg:pb-0 [@media(min-width:960px)_and_(min-height:780px)]:sticky [@media(min-width:960px)_and_(min-height:780px)]:bottom-0"
    >
      <div className="mx-auto w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] pt-[clamp(100px,10vw,140px)]">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
          <nav aria-label="Footer" className="contents">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="mb-[22px] text-[15px] font-semibold text-white">{column.heading}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div>
            <h3 className="mb-[22px] text-[15px] font-semibold text-white">Contact</h3>
            <p className="-mt-2.5 mb-[18px] max-w-[26rem] text-[15px] text-white/55">
              Questions, a wrong pin, a listing to report or a business to add — write to us.
            </p>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="mb-10 inline-flex h-12 items-center gap-2.5 rounded-full border border-white/20 px-[22px] text-[15px] font-semibold text-white transition-colors duration-300 hover:border-volt hover:text-volt"
            >
              <Mail size={18} aria-hidden="true" />
              {SITE_CONFIG.email}
            </a>
            <h3 className="mb-[22px] text-[15px] font-semibold text-white">Apps</h3>
            <p className="-mt-2.5 max-w-[26rem] text-[15px] text-white/55">
              Apps for iOS and Android are coming soon. Until then, everything works in your phone&rsquo;s browser.
            </p>
          </div>
        </div>

        <div className="mt-[72px] flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/[0.09] pt-6 text-sm text-white/60">
          <span>Built for EV drivers in Pakistan</span>
          <a href={`mailto:${SITE_CONFIG.email}`} className="transition-colors hover:text-volt">
            Contact: {SITE_CONFIG.email}
          </a>
          <span className="lg:ml-auto">
            &copy; {year} plugpk. All rights reserved.
            <Link href="/credits" className="ml-4 text-white/80 transition-colors hover:text-volt">
              Credits
            </Link>
            <Link href="/terms#partners" className="ml-4 text-white/80 transition-colors hover:text-volt">
              Terms for partners
            </Link>
          </span>
        </div>

        {/* The wordmark, edge to edge. Decorative: the brand is named above. */}
        <div
          aria-hidden="true"
          className="pg-bold mt-6 flex select-none items-end justify-center overflow-hidden pb-[0.02em] font-display text-[clamp(84px,19vw,300px)] leading-[0.9] tracking-[-0.01em]"
        >
          plug<span className="text-volt">pk</span>
        </div>
      </div>
    </footer>
  )
}

// src/components/layout/Footer.tsx

import { Mail } from '@/components/ui/icons'
import Link from 'next/link'

import { NAV_TOOLS, POPULAR_CITIES, SITE_CONFIG } from '@/lib/constants'

/**
 * The footer, built the way go-electra.com builds theirs.
 *
 * ── Two layers, and a curtain ─────────────────────────────────────────
 *
 * A near-black green panel (the hero's edge, #031914) holds everything: the
 * link columns on the left, contact and the app on the right, and a small row
 * at its foot. Its bottom-right corner is one large curve.
 *
 * Behind it, on the hero's dark green (#10362C), the legal line and "plug.pk"
 * set in solid white, edge to edge. That layer is `position: sticky; bottom:
 * 0`, so it pins itself to the bottom of the viewport as soon as the footer
 * arrives and waits there, hidden under the panel. The panel scrolls up and
 * uncovers it like a curtain lifting — nothing is animated by script, so
 * reduced-motion needs no special case.
 *
 * There used to be a floating "The plug.pk app / Coming soon" card pinned
 * over the wordmark's last letters, where the reference puts its QR code. On
 * desktop it sat on top of the wordmark it was meant to decorate, for an app
 * that does not exist. The app's status is one plain line in the right rail.
 *
 * ── Only what is true ─────────────────────────────────────────────────
 *
 * No social icons: the project has no social accounts. No store badges or
 * store logos: there are no listings. The city links open the real map search
 * for that city. The one contact route is the address the site publishes
 * everywhere else, SITE_CONFIG.email — no phone or WhatsApp number exists to
 * print.
 *
 * ── Tap targets ───────────────────────────────────────────────────────
 *
 * Every link is at least 44px tall. They were 18px lines of text 10px apart,
 * which on a phone is a column of near-misses.
 */

/** The landing page's greens: the hero's deepest edge for the panel, its lit green for the reveal. */
const NAVY = '#031914'
const TEAL = '#10362C'

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
    heading: 'We are Plug.pk',
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
    /*
      One way in for a business. "Partner Up" and "List your business" sat
      next to each other here, leading to two different landing pages that
      said different things about price; there is one page now.
    */
    heading: 'Business and account',
    links: [
      { label: 'Partner Up', href: '/partners' },
      { label: 'Business portal', href: '/business/dashboard' },
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Data and image credits', href: '/credits' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

const LINK =
  'inline-flex min-h-11 items-center text-[15px] text-white transition-opacity duration-200 hover:opacity-70 focus-visible:underline focus-visible:outline-none'

const PILL =
  'inline-flex h-11 items-center gap-2 rounded-full border border-white/80 px-5 text-[15px] text-white'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative" style={{ backgroundColor: TEAL }}>
      {/* ── The panel: the curtain ─────────────────────────────────── */}
      <div
        className="relative z-10 rounded-br-[5rem] lg:rounded-br-[8rem]"
        style={{ backgroundColor: NAVY }}
      >
        <div className="container-plug pb-16 pt-20 lg:pb-20 lg:pt-24">
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,15rem))_1fr_auto]">
            <nav aria-label="Footer" className="contents">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <h3 className="mb-3 text-[15px] font-semibold text-white">{column.heading}</h3>
                  <ul className="flex flex-col">
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

            {/* The reference's empty fourth column: space before the right rail. */}
            <div aria-hidden="true" className="hidden lg:block" />

            <div className="flex flex-col gap-10 sm:col-span-2 lg:col-span-1">
              <div>
                <h3 className="mb-3 text-[15px] font-semibold text-white">Contact</h3>
                <p className="mb-4 max-w-[17rem] text-[14px] leading-relaxed text-white/70">
                  Questions, a wrong pin, a listing to report or a business to add — write to us.
                </p>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className={`${PILL} transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                >
                  <Mail size={14} aria-hidden="true" />
                  {SITE_CONFIG.email}
                </a>
              </div>
              <div>
                <h3 className="mb-3 text-[15px] font-semibold text-white">Apps</h3>
                {/* Where the header's "Download App · Soon" button went: a
                    status line, not a control, because there is nothing to
                    download. */}
                <p className="max-w-[17rem] text-[14px] leading-relaxed text-white/70">
                  Apps for iOS and Android are coming soon. Until then, everything works in your
                  phone&apos;s browser.
                </p>
              </div>
            </div>
          </div>

          {/* The small row at the panel's foot. */}
          <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-1 text-[14px] text-white">
            <span className="inline-flex min-h-11 items-center">Built for EV drivers in Pakistan</span>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-flex min-h-11 items-center transition-opacity hover:opacity-70"
            >
              Contact: {SITE_CONFIG.email}
            </a>
          </div>
        </div>
      </div>

      {/* ── The layer underneath: pinned to the bottom of the viewport ── */}
      <div className="sticky bottom-0 z-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-plug flex justify-end pt-4 text-[13px] text-white">
          <p className="flex flex-wrap items-center justify-end gap-x-4">
            <span className="inline-flex min-h-11 items-center">
              &copy; {year} {SITE_CONFIG.name}. All rights reserved.
            </span>
            <Link href="/credits" className="inline-flex min-h-11 items-center hover:underline">
              Credits
            </Link>
            <Link href="/terms#partners" className="inline-flex min-h-11 items-center hover:underline">
              Terms for partners
            </Link>
          </p>
        </div>

        <div aria-hidden="true" className="relative overflow-hidden">
          <p className="select-none whitespace-nowrap px-[0.5vw] pb-[0.14em] pt-2 text-center font-black leading-[0.9] tracking-[-0.06em] text-white text-[clamp(5rem,26vw,36rem)]">
            plug.pk
          </p>
        </div>
      </div>
    </footer>
  )
}

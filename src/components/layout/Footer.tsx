// src/components/layout/Footer.tsx

import { ArrowUpRight, Mail } from 'lucide-react'
import Link from 'next/link'

import { LogoMark } from '@/components/ui/Logo'
import { POPULAR_CITIES, SITE_CONFIG } from '@/lib/constants'

/**
 * The footer, built the way go-electra.com builds theirs.
 *
 * ── Two layers, and a curtain ─────────────────────────────────────────
 *
 * A dark navy panel (#142936) holds everything: the link columns on the
 * left, contact and the app on the right, and a small row at its foot. Its
 * bottom-right corner is one large curve.
 *
 * Behind it, on teal (#3E8A91), the legal line and "plug.pk" set in solid
 * white, edge to edge. That layer is `position: sticky; bottom: 0`, so it
 * pins itself to the bottom of the viewport as soon as the footer arrives and
 * waits there, hidden under the panel. The panel scrolls up at normal speed
 * and uncovers it like a curtain lifting — nothing is animated by script,
 * which is exactly how the reference behaves (measured: the wordmark holds
 * at the same screen position while the panel travels 700px past it). With
 * no motion to reduce, reduced-motion needs no special case.
 *
 * The floating app card sits over the wordmark's last letters at the bottom
 * right, as the reference's QR card does. There is no app to scan for yet,
 * so it carries the mark and "Coming soon" instead of a QR code.
 *
 * ── Only what is true ─────────────────────────────────────────────────
 *
 * No social icons: the project has no social accounts. The store pills say
 * "Soon" rather than linking to stores that have no listing. The city links
 * open the real map search for that city.
 */

const NAVY = '#142936'
const TEAL = '#3E8A91'

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
    heading: 'Main',
    links: [
      { label: 'Our charging stations', href: '/map' },
      ...POPULAR_CITIES.map((city) => ({ label: `Our stations in ${city}`, href: `/map?q=${encodeURIComponent(city)}` })),
    ],
  },
  {
    heading: 'We are Plug.pk',
    links: [
      { label: 'Plan a route', href: '/routes' },
      { label: 'EV services', href: '/services' },
      { label: 'Cars', href: '/cars' },
      { label: 'Community', href: '/community' },
      { label: 'EV clubs', href: '/community/clubs' },
    ],
  },
  {
    heading: 'Business and account',
    links: [
      { label: 'Partner Up', href: '/partners' },
      { label: 'List your business', href: '/for-businesses' },
      { label: 'Business portal', href: '/business/dashboard' },
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/signup' },
      { label: 'Data and image credits', href: '/credits' },
    ],
  },
]

const LINK =
  'text-[15px] text-white transition-opacity duration-200 hover:opacity-70 focus-visible:underline focus-visible:outline-none'

const PILL =
  'inline-flex h-11 items-center gap-2 rounded-full border border-white/80 px-5 text-[15px] text-white'

const APPLE = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
    <path d="M16.37 12.54c-.02-2.1 1.72-3.12 1.8-3.17-.98-1.44-2.51-1.63-3.05-1.65-1.3-.13-2.54.77-3.2.77-.66 0-1.67-.75-2.75-.73-1.41.02-2.72.82-3.45 2.09-1.47 2.55-.38 6.32 1.06 8.39.7 1.01 1.53 2.15 2.62 2.11 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.62.68 2.73.66 1.13-.02 1.85-1.03 2.54-2.05.8-1.17 1.13-2.3 1.15-2.36-.03-.01-2.2-.85-2.22-3.35zM14.3 6.37c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.53.62-1 1.61-.88 2.56.93.07 1.88-.47 2.46-1.16z" />
  </svg>
)

const GOOGLE = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
    <path d="M21.35 11.1H12v2.98h5.35c-.23 1.26-.95 2.33-2.02 3.05v2.5h3.26c1.9-1.75 3-4.34 3-7.4 0-.39-.03-.77-.09-1.13zM12 22c2.7 0 4.97-.9 6.63-2.43l-3.26-2.5c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22zm-5.58-8.07a6 6 0 0 1 0-3.86V7.49H3.06a10 10 0 0 0 0 9.02l3.36-2.58zM12 5.97c1.47 0 2.8.5 3.84 1.5l2.88-2.88A10 10 0 0 0 3.06 7.49l3.36 2.58C7.2 7.72 9.4 5.97 12 5.97z" />
  </svg>
)

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
                  <h3 className="mb-5 text-[15px] font-semibold text-white">{column.heading}</h3>
                  <ul className="flex flex-col gap-2.5">
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
                <h3 className="mb-5 text-[15px] font-semibold text-white">Contact</h3>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className={`${PILL} transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                >
                  <Mail size={14} aria-hidden="true" />
                  {SITE_CONFIG.email}
                </a>
              </div>
              <div>
                <h3 className="mb-5 text-[15px] font-semibold text-white">Application</h3>
                <div className="flex flex-col items-start gap-2.5">
                  <span className={PILL}>
                    {APPLE} App Store <span className="text-[12px] text-white/60">· Soon</span>
                  </span>
                  <span className={PILL}>
                    {GOOGLE} Play Store <span className="text-[12px] text-white/60">· Soon</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* The small row at the panel's foot. */}
          <div className="mt-20 flex flex-wrap items-center gap-x-10 gap-y-3 text-[14px] text-white">
            <span>Built for EV drivers in Pakistan</span>
            <a href={`mailto:${SITE_CONFIG.email}`} className="transition-opacity hover:opacity-70">
              Here to help
            </a>
          </div>
        </div>
      </div>

      {/* ── The layer underneath: pinned to the bottom of the viewport ── */}
      <div className="sticky bottom-0 z-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-plug flex justify-end pt-6 text-[13px] text-white">
          <p className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            <span>
              &copy; {year} {SITE_CONFIG.name}. All rights reserved.
            </span>
            <Link href="/credits" className="hover:underline">
              Credits
            </Link>
            <Link href="/partners" className="hover:underline">
              Terms for partners
            </Link>
          </p>
        </div>

        <div aria-hidden="true" className="relative overflow-hidden">
          <p className="select-none whitespace-nowrap px-[0.5vw] pb-[0.14em] pt-2 text-center font-black leading-[0.9] tracking-[-0.06em] text-white text-[clamp(5rem,26vw,36rem)]">
            plug.pk
          </p>

          {/* The floating app card, over the last letters. */}
          <Link
            href="/#app"
            aria-hidden="false"
            aria-label="The plug.pk app, coming soon"
            className="absolute bottom-6 right-6 hidden w-44 flex-col items-center rounded-2xl bg-white/45 px-4 pb-4 pt-9 text-center shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:bg-white/55 lg:flex"
          >
            <span
              className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: TEAL }}
            >
              <LogoMark color="#FFFFFF" className="h-8 w-8" />
            </span>
            <span className="text-[14px] leading-snug" style={{ color: NAVY }}>
              The plug.pk app
            </span>
            <span className="mt-3 flex h-24 w-full flex-col items-center justify-center rounded-xl bg-white text-[13px] font-semibold" style={{ color: NAVY }}>
              Coming soon
              <span className="mt-1 flex items-center gap-1 text-[12px] font-normal text-slate-500">
                iOS · Android <ArrowUpRight size={12} />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </footer>
  )
}

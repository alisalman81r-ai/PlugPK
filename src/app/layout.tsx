// src/app/layout.tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * One face for the whole interface: Figtree, headings included.
 *
 * ── Why Figtree ────────────────────────────────────────────────────────
 *
 * The palette is taken from a fintech reference set in Matter, a commercial
 * geometric grotesque. Figtree is the closest open face to it: low contrast,
 * round but not circular, and narrower than Poppins, which it replaced. Poppins
 * is almost compass-drawn, so at display sizes its counters closed up and
 * headings read heavy; Figtree keeps them open, and its tighter set means a
 * heading holds on fewer lines.
 *
 * ── Why these are local files and not next/font/google ─────────────────
 *
 * They were fetched from fonts.googleapis.com at compile time until that proved
 * unreliable here: TLS on this machine is intercepted by antivirus, Node's
 * connections are intermittently aborted, and the loader's answer to a failed
 * download is three retries and then silence. One dev session served the
 * entire site in a fallback face — the build succeeds, the page renders, and
 * nothing anywhere says the typeface is missing.
 *
 * scripts/fetch-fonts.mjs pulls the latin-subset files into src/app/fonts/,
 * and next/font/local self-hosts and preloads them exactly as the Google
 * loader did. Run it again to add a weight.
 *
 * ── Weights ────────────────────────────────────────────────────────────
 *
 *   400  body copy
 *   500  font-medium
 *   600  font-semibold   — headings and card titles
 *   700  font-bold
 *
 * font-extrabold and font-black both resolve to 700 — see the fontWeight note
 * in tailwind.config.ts — so no heavier file is shipped.
 */
const figtree = localFont({
  variable: '--font-sans',
  /*
    `swap` rather than `optional`: the fallback stack in tailwind.config.ts is
    metric-different from Figtree, so a failed swap would leave the site in
    system-ui permanently on a slow connection. A brief flash of the fallback is
    the better trade for a face this central.
  */
  display: 'swap',
  src: [
    { path: './fonts/figtree-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/figtree-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/figtree-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/figtree-700.woff2', weight: '700', style: 'normal' },
  ],
})

// Supplies --font-jetbrains for the `font-mono` utility. Without it that
// variable is undefined and every mono style falls back to generic monospace.
const jetbrainsMono = localFont({
  variable: '--font-jetbrains',
  display: 'swap',
  src: [
    { path: './fonts/jetbrains-mono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/jetbrains-mono-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/jetbrains-mono-700.woff2', weight: '700', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: {
    default: "Plug.pk — Pakistan's EV Ecosystem Platform",
    template: '%s | Plug.pk',
  },
  description:
    'Find EV charging stations, plan long-distance routes, and connect with EV owners across Pakistan.',
  // Resolves every relative image and canonical path — including the generated
  // opengraph-image — to plug.pk rather than localhost:3000.
  metadataBase: new URL(SITE_CONFIG.url),
  keywords: [
    'EV charging Pakistan',
    'electric vehicle charging',
    'charging stations Pakistan',
    'EV route planner Pakistan',
    'BYD charging Pakistan',
    'MG ZS EV charging',
  ],
  /*
    No `url` and no `images` here, on purpose.

    `url: 'https://plug.pk'` was inherited by every page that did not set its
    own, so a car page or a station shared to WhatsApp announced itself as the
    homepage. No og:url is better than a wrong one.

    The image was /og-image.jpg, which never existed. The share card is now
    src/app/opengraph-image.tsx, which Next attaches to every route below the
    root automatically — naming an image here would override it.
  */
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: SITE_CONFIG.name,
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations and plan EV routes across Pakistan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations and plan EV routes across Pakistan.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Only html/body live here. Site chrome (navbar, footer, tab bar) belongs to
 * the (main) route group, so the (auth) group and the onboarding flow render
 * without it — a route-group layout nests inside the root, it cannot replace it.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${figtree.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}

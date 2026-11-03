// src/app/layout.tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * The landing-v2 type system: Poppins for the interface, Power Grotesk for
 * display, JetBrains Mono for numbers, units and labels.
 *
 * ── Why these are local files and not next/font/google ─────────────────
 *
 * They were fetched from fonts.googleapis.com at compile time until that proved
 * unreliable here: TLS on this machine is intercepted by antivirus, Node's
 * connections are intermittently aborted, and the loader's answer to a failed
 * download is three retries and then silence. scripts/fetch-fonts.mjs pulls
 * the latin-subset files into src/app/fonts/, and next/font/local self-hosts
 * and preloads them exactly as the Google loader did.
 *
 * ── Weights ────────────────────────────────────────────────────────────
 *
 *   Poppins 400, 500, 600, 700. font-extrabold and font-black resolve to 700
 *   — see the fontWeight note in tailwind.config.ts.
 *
 *   Power Grotesk 400 only: it is the one weight licensed. Heavier display
 *   weights are drawn with the pg-medium and pg-bold stroke utilities, and
 *   font-synthesis is off so the browser never smears a fake bold over it.
 */
const poppins = localFont({
  variable: '--font-sans',
  display: 'swap',
  src: [
    { path: './fonts/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-700.woff2', weight: '700', style: 'normal' },
  ],
})

/* Power Grotesk Regular (Power Type Foundry), from landing-v2/assets/fonts. */
const powerGrotesk = localFont({
  variable: '--font-display',
  display: 'swap',
  src: [{ path: './fonts/power-grotesk-400.woff2', weight: '400', style: 'normal' }],
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

/*
  JetBrains Mono's 0 has a dot in its counter, and it is the only zero the font
  has: the `zero` feature changes nothing. These files hold JetBrains Mono's own
  0 at each weight with that dot removed — nothing else — and the face is
  limited to U+0030, so the browser takes only the zero from it. Because it
  does not cover the space character, it is never the "first available font",
  so line height and every other glyph still come from JetBrains Mono.
  Derived from JetBrains Mono, SIL Open Font License 1.1.
*/
const plainZero = localFont({
  variable: '--font-plain-zero',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0030' }],
  src: [
    { path: './fonts/plain-zero-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/plain-zero-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/plain-zero-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/plain-zero-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/plain-zero-800.woff2', weight: '800', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: {
    default: "plugpk — Pakistan's EV Ecosystem Platform",
    template: '%s | plugpk',
  },
  description:
    'Find EV charging stations, plan long-distance routes, and connect with EV owners across Pakistan.',
  // Resolves every relative image and canonical path — including the generated
  // opengraph-image — to plugpk rather than localhost:3000.
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
    title: "plugpk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations and plan EV routes across Pakistan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "plugpk — Pakistan's EV Ecosystem Platform",
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
    <html lang="en" className={`${poppins.variable} ${powerGrotesk.variable} ${jetbrainsMono.variable} ${plainZero.variable}`}>
      <body className="bg-chalk font-sans text-ink antialiased [font-synthesis:none] selection:bg-volt selection:text-ink">{children}</body>
    </html>
  )
}

// src/app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono, Poppins } from 'next/font/google'
import './globals.css'

/**
 * One face for the whole interface: Poppins, headings included.
 *
 * ── What this replaced, and why the pairing went ───────────────────────
 *
 * Body was Inter and every h1–h6 was Playfair Display, a high-contrast serif.
 * That pairing is a legitimate one and it is not what this product wants: a
 * serif heading over a technical dashboard reads editorial, and the site is a
 * charging map, a route planner and an operator console. A single geometric sans
 * across both is quieter and more consistent, which is what "professional" means
 * here far more than any particular typeface does.
 *
 * ── Weights, and why all six are loaded ────────────────────────────────
 *
 * Poppins is not a variable font on Google Fonts, so every weight is a separate
 * file — roughly 15KB each, latin-subset, self-hosted and preloaded by next/font.
 * Six is more than one would choose from scratch, and each one is answering an
 * existing call site rather than a guess:
 *
 *   400  body copy
 *   500  font-medium        — 134 uses
 *   600  font-semibold      — 469 uses
 *   700  font-bold          — 315 uses
 *   800  font-extrabold and the display-lg/xl/2xl steps
 *   900  font-black         —  62 uses
 *
 * 900 was very nearly dropped, on the grounds that Poppins Black is close to
 * circular and its counters tighten at display sizes. That was the wrong call:
 * 62 places ask for `font-black` explicitly, and a weight that is asked for and
 * not loaded is not absent — the browser fakes it by smearing the 800, which
 * looks far worse than a heavy face used deliberately.
 *
 * What did change is the display scale in tailwind.config.ts: `display-2xl` and
 * `display-xl` moved from 900 to 800, because at 4.5rem the open letterforms
 * carry the weight better. `font-black` still renders a real 900 wherever an
 * author reached for it.
 */
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  /*
    `swap` rather than `optional`: the fallback stack in tailwind.config.ts is
    metric-different from Poppins, so a failed swap would leave the site in
    system-ui permanently on a slow connection. A brief flash of the fallback is
    the better trade for a face this central.
  */
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

// Supplies --font-jetbrains for the `font-mono` utility. Without it that
// variable is undefined and every mono style falls back to generic monospace.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: "Plug.pk — Pakistan's EV Ecosystem Platform",
    template: '%s | Plug.pk',
  },
  description:
    'Find EV charging stations, plan long-distance routes, and connect with EV owners across Pakistan.',
  // Required for the OG and Twitter image paths below to resolve to plug.pk
  // rather than localhost:3000.
  metadataBase: new URL('https://plug.pk'),
  keywords: [
    'EV charging Pakistan',
    'electric vehicle charging',
    'charging stations Pakistan',
    'EV route planner Pakistan',
    'BYD charging Pakistan',
    'MG ZS EV charging',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://plug.pk',
    siteName: 'Plug.pk',
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations and plan EV routes across Pakistan.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations and plan EV routes across Pakistan.',
    images: ['/og-image.jpg'],
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
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}

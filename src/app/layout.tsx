// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

/** Body, labels, buttons — everything that is not a heading. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

/**
 * Headings only.
 *
 * Playfair is a display face and is treated as one: globals.css points every
 * h1–h6 at it and nothing else. That is deliberate rather than lazy — its
 * stroke contrast is what makes a 6rem heading land, and the same contrast at
 * 13px closes the counters up, so the eyebrows, meta rows and table cells stay
 * on Inter.
 */
const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800', '900'],
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
    <html lang="en" className={`${inter.variable} ${display.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}

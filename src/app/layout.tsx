// src/app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import './globals.css'

/**
 * The site is set in a serif.
 *
 * Source Serif 4 rather than a display face like Playfair: the headings are
 * only part of the job here, and a high-contrast display serif at 13px — the
 * eyebrows, the meta rows, the table cells — closes up and stops being
 * readable. This one carries 200 through 900, so the same family covers a
 * 6rem heading and an 11px label.
 */
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
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
    <html lang="en" className={`${serif.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  )
}

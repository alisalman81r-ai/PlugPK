// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

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
  description: 'Find EV charging stations, plan long-distance routes, and connect with EV owners across Pakistan. The complete EV platform for Pakistan.',
  metadataBase: new URL('https://plug.pk'),
  keywords: [
    'EV charging Pakistan',
    'electric vehicle charging',
    'charging stations Pakistan',
    'EV route planner Pakistan',
    'BYD charging Pakistan',
    'MG ZS EV charging',
    'Lahore EV charging',
    'Islamabad EV charging',
    'Karachi EV charging',
  ],
  authors: [{ name: 'Plug.pk' }],
  creator: 'Plug.pk',
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://plug.pk',
    siteName: 'Plug.pk',
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations, plan routes, and connect with EV owners across Pakistan.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Plug.pk — Pakistan's EV Ecosystem Platform",
    description: 'Find EV charging stations, plan routes, and connect with EV owners across Pakistan.',
    images: ['/og-image.jpg'],
    creator: '@plugpk',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  )
}

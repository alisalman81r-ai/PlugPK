// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Plug.pk — EV charging stations across Pakistan',
    template: '%s | Plug.pk',
  },
  description:
    'Find, compare and plan around every public EV charging station in Pakistan — live status, connector types, tariffs and amenities.',
  metadataBase: new URL('https://plug.pk'),
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: 'Plug.pk',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

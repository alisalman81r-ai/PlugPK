// src/app/manifest.ts
import type { MetadataRoute } from 'next'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * /manifest.webmanifest — what a phone uses when somebody adds the site to
 * their home screen.
 *
 * Colours are the palette's, from tailwind.config.ts: Pine (#05241E) for the
 * splash and status bar, the same ground the navbar menus and dark bands use,
 * so the app opens onto a colour the site already owns.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    short_name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#05241E',
    theme_color: '#05241E',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}

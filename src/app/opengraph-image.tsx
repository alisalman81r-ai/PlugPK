// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * The share card for every page that does not draw its own.
 *
 * The root metadata used to point at /og-image.jpg, a file that was never
 * added, so every link shared to WhatsApp or X unfurled with a broken image.
 * This is generated instead: the brand's pine ground, the mark and wordmark in
 * the logo's mint, and the tagline. Nothing on it is a figure, so nothing on it
 * can go stale.
 *
 * A file convention at the root is inherited by every route below it, which is
 * exactly the fallback wanted; a page with a better image (a car's photo)
 * names its own in its metadata.
 */
export const alt = `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`
// Edge, not Node: Next 14's Node build of next/og resolves its bundled font
// through fileURLToPath, which throws "Invalid URL" on Windows and fails the
// build there. The Edge build ships the same renderer as wasm and works on
// every platform; the image is cached after its first request either way.
export const runtime = 'edge'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #0D1817 0%, #05241E 55%, #0B332C 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="150" height="150" viewBox="4 6 160 160">
            <g fill="#6FE8B6" stroke="#6FE8B6" strokeLinejoin="round">
              <path strokeWidth={11} d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z" />
              <path
                strokeWidth={5}
                d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z"
              />
            </g>
          </svg>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, letterSpacing: '-0.04em' }}>
            <span>plug</span>
            <span style={{ color: '#6FE8B6' }}>.pk</span>
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 48, fontWeight: 600, color: '#FFFFFF' }}>
          {SITE_CONFIG.tagline}
        </div>
        <div style={{ marginTop: 18, fontSize: 30, color: 'rgba(255,255,255,0.7)' }}>
          Charging map · Route planner · Electrified cars · Owners&apos; community
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 12,
            background: 'linear-gradient(90deg, #0B332C, #26CDB2)',
          }}
        />
      </div>
    ),
    size,
  )
}

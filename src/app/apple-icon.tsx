// src/app/apple-icon.tsx
import { ImageResponse } from 'next/og'

/**
 * The home-screen icon iOS asks for. It wants a PNG — Safari ignores an SVG
 * apple-touch-icon — so this draws the same mark as icon.svg at 180px.
 * iOS rounds the corners itself, so the tile is square.
 */
// Edge, not Node: Next 14's Node build of next/og resolves its bundled font
// through fileURLToPath, which throws "Invalid URL" on Windows and fails the
// build there. The Edge build ships the same renderer as wasm and works on
// every platform; the image is cached after its first request either way.
export const runtime = 'edge'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05241E',
        }}
      >
        <svg width="132" height="132" viewBox="4 6 160 160">
          <g fill="#6FE8B6" stroke="#6FE8B6" strokeLinejoin="round">
            <path strokeWidth={11} d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z" />
            <path
              strokeWidth={5}
              d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z"
            />
          </g>
        </svg>
      </div>
    ),
    size,
  )
}

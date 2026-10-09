// scripts/build-app-pwa-icons.mjs
//
// Renders the installable-app icons for the app prototype into
// public/app-prototype/icons/: the mint lightning mark on a pine square, as
// DESIGN.md describes the app icon. Run after changing the mark:
//
//   node scripts/build-app-pwa-icons.mjs
//
//   icon-192.png, icon-512.png   rounded square, for the manifest ("any")
//   maskable-512.png             full-bleed square with the mark inside the
//                                safe zone, so Android can crop it to any shape
//   apple-touch-icon.png         180 px, square (iOS rounds the corners itself)

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = join(process.cwd(), 'public/app-prototype/icons')
const PINE = '#05241E'
const MINT = '#6FE8B6'
const MARK = `<g fill="${MINT}" stroke="${MINT}" stroke-linejoin="round"><path stroke-width="11" d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z"/><path stroke-width="5" d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z"/></g>`

// size, how much of the tile the mark fills, corner radius as a share of size
const ICONS = [
  ['icon-192.png', 192, 0.66, 0.22],
  ['icon-512.png', 512, 0.66, 0.22],
  ['maskable-512.png', 512, 0.5, 0],
  ['apple-touch-icon.png', 180, 0.66, 0],
]

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, size, fill, radius] of ICONS) {
  const mark = Math.round(size * fill)
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${PINE};border-radius:${Math.round(size * radius)}px">
      <svg width="${mark}" height="${mark}" viewBox="4 6 160 160">${MARK}</svg>
    </div></body></html>`)
  await page.screenshot({ path: join(OUT, file), omitBackground: true })
  console.log(`wrote icons/${file}`)
}
await browser.close()

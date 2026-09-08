// scripts/fetch-fonts.mjs
//
// Downloads the webfonts the site uses into src/app/fonts/, so the build never
// asks Google for them.
//
// ── Why the fonts are not fetched at build time any more ─────────────
//
// next/font/google downloads from fonts.googleapis.com during dev compile and
// during `next build`. When that request fails the loader retries three times
// and then gives up silently: the page still renders, in the fallback stack,
// and nothing in the output says the typeface is missing. On this machine it
// failed 76 times in one dev session — TLS is intercepted by antivirus
// (SSLKEYLOGFILE points at aswMonFltProxy), which intermittently aborts Node's
// connections — and the whole site rendered in a serif for as long as that
// server was up.
//
// A typeface is not a build-time dependency worth having. These files are 8-31
// KB each, they change only when the design does, and next/font/local gives the
// same self-hosting, preloading and size-adjust handling as the Google loader
// with no network in the path.
//
// Run this again only to add a weight or refresh the files:
//
//   node scripts/fetch-fonts.mjs
//
// It writes the latin subset only, matching the `subsets: ['latin']` the loader
// declared. Google serves latin-ext and devanagari for Poppins too; nothing in
// this product sets type in either.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'src', 'app', 'fonts')

// Google returns woff2 only to a browser UA. Ask as one.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const FAMILIES = [
  { name: 'Poppins', file: 'poppins', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'JetBrains Mono', file: 'jetbrains-mono', weights: [400, 500, 600, 700] },
]

/**
 * The @font-face blocks for one subset, keyed by weight.
 *
 * Google prefixes each block with a `/* subset *\/` comment and that comment is
 * the only thing distinguishing three otherwise identical blocks, so the parse
 * keys off it rather than off unicode-range.
 */
function parseSubset(css, subset) {
  const found = new Map()
  const blocks = css.split('@font-face').slice(1)
  let current = null

  // Track which subset comment most recently preceded a block.
  const commentOrder = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\//g)].map((m) => m[1])

  blocks.forEach((block, i) => {
    current = commentOrder[i] ?? current
    if (current !== subset) return
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1]
    const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1]
    if (weight && url) found.set(Number(weight), url)
  })

  return found
}

async function main() {
  await mkdir(OUT, { recursive: true })
  let written = 0
  let bytes = 0

  for (const family of FAMILIES) {
    const query = `${family.name.replace(/ /g, '+')}:wght@${family.weights.join(';')}`
    const cssUrl = `https://fonts.googleapis.com/css2?family=${query}&display=swap`

    const res = await fetch(cssUrl, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`${family.name}: CSS request returned ${res.status}`)
    const css = await res.text()

    const latin = parseSubset(css, 'latin')

    for (const weight of family.weights) {
      const url = latin.get(weight)
      if (!url) throw new Error(`${family.name} ${weight}: no latin face in the CSS`)

      const font = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!font.ok) throw new Error(`${family.name} ${weight}: font request returned ${font.status}`)
      const buffer = Buffer.from(await font.arrayBuffer())

      const name = `${family.file}-${weight}.woff2`
      await writeFile(join(OUT, name), buffer)
      written += 1
      bytes += buffer.length
      console.log(`  ${name.padEnd(28)} ${String(Math.round(buffer.length / 1024)).padStart(3)} KB`)
    }
  }

  console.log('')
  console.log(`${written} files, ${Math.round(bytes / 1024)} KB total, in src/app/fonts/`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})

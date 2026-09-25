// scripts/make-hero-scene.mjs
//
// Builds the hero's right-hand scene from the landing-page design, so the
// page shows exactly that picture behind its live phone and cards:
//
//   public/images/hero/hero-scene-v4.png      the map, route, pins, glow, car,
//                                          charger and the car's ground shadow
//   public/images/hero/hero-car-thumb.png  the small car on the phone's
//                                          battery card
//   public/images/hero/hero-station-thumb.png  the charger on its station card
//
//   node scripts/make-hero-scene.mjs <reference.png>
//
// <reference.png> is the 1775 × 886 design. Its right-hand composition is a
// 935 × 760 frame whose top-left corner sits at (840, 100); HeroShowcase lays
// its phone and cards out on that same frame.
//
// ── Why a picture and not a drawing ───────────────────────────────────
//
// The design's map is not the survey outline of Pakistan: it is a stylised
// silhouette with its own vein network, relief and lighting, and the car's
// shadow is rendered light falling on a floor. Redrawn in SVG it was always
// close and never the same. Cut from the design, it is the same.
//
// What stays live on the page is everything with words or figures in it —
// the phone and the cards — so that text is sharp at any resolution and the
// figures come from the database.
//
// ── The holes where the design's own cards were ───────────────────────
//
// The design has its cards baked in. Each is filled from its surroundings —
// a bilinear blend of the four edges around it, then softened — so what shows
// through the live card's translucent glass is the scene continuing under it,
// not the design's text.

import sharp from 'sharp'

const SRC = process.argv[2]
if (!SRC) throw new Error('usage: node scripts/make-hero-scene.mjs <reference.png>')

/** The design frame's origin in the reference. */
const ORIGIN = { x: 840, y: 100 }

/**
 * The scene: from the design's phone frame (whose outer edge runs from
 * x ≈ 1137 at the top to ≈ 1131 at the foot) to the right edge of the frame. The live phone covers its left
 * edge exactly as the design's did.
 */
const SCENE = { left: 1134, top: 100, width: 1775 - 1134, height: 760 }

/** The design's baked-in cards and tagline, in reference pixels, padded. */
const HOLES = [
  { x0: 1166, y0: 154, x1: 1343, y1: 257 }, // 150 kW
  { x0: 1540, y0: 165, x1: 1729, y1: 269 }, // 72% battery
  { x0: 1505, y0: 311, x1: 1729, y1: 399 }, // Lahore → Islamabad
  { x0: 1530, y0: 460, x1: 1723, y1: 547 }, // 2.4 km away
  { x0: 1241, y0: 726, x1: 1417, y1: 797 }, // bottom card
  { x0: 1478, y0: 792, x1: 1722, y1: 828 }, // tagline
]

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const at = (x, y) => (y * W + x) * 3

// Fill each hole from its border.
for (const h of HOLES) {
  const w = h.x1 - h.x0
  const hh = h.y1 - h.y0
  for (let y = h.y0 + 1; y < h.y1; y++) {
    const v = (y - h.y0) / hh
    for (let x = h.x0 + 1; x < h.x1; x++) {
      const u = (x - h.x0) / w
      const L = at(h.x0, y), R = at(h.x1, y), T = at(x, h.y0), B = at(x, h.y1)
      const i = at(x, y)
      for (let c = 0; c < 3; c++) {
        const horiz = data[L + c] * (1 - u) + data[R + c] * u
        const vert = data[T + c] * (1 - v) + data[B + c] * v
        data[i + c] = Math.round((horiz + vert) / 2)
      }
    }
  }
}

// Soften the filled areas so no seam of the interpolation shows.
const filled = await sharp(data, { raw: { width: W, height: info.height, channels: 3 } }).png().toBuffer()
const blurred = await sharp(filled).blur(10).raw().toBuffer()
for (const h of HOLES) {
  for (let y = h.y0 + 1; y < h.y1; y++)
    for (let x = h.x0 + 1; x < h.x1; x++) {
      const i = at(x, y)
      for (let c = 0; c < 3; c++) data[i + c] = blurred[i + c]
    }
}

// Alpha: solid, fading out over the top and bottom 28px and the right 20px so
// the scene settles into the page's own ground wherever the frame ends. The
// left edge fades over 10px where the phone covers it, and widens below the
// phone's foot, where a hard edge would show as a line.
const { width: sw, height: sh } = SCENE
const out = Buffer.alloc(sw * sh * 4)
const ramp = (d, n) => Math.min(1, Math.max(0, d / n))
for (let y = 0; y < sh; y++)
  for (let x = 0; x < sw; x++) {
    const i = at(SCENE.left + x, SCENE.top + y)
    const o = (y * sw + x) * 4
    out[o] = data[i]
    out[o + 1] = data[i + 1]
    out[o + 2] = data[i + 2]
    // Below the phone's foot (frame y ≈ 690) nothing covers the left edge, and
    // the ground there is lighter than the page, so the fade widens to 110px.
    const foot = Math.min(1, Math.max(0, (y - 660) / 60))
    const left = 10 + 100 * foot * foot
    const a = ramp(y, 28) * ramp(sh - 1 - y, 56) * ramp(sw - 1 - x, 20) * ramp(x, left)
    out[o + 3] = Math.round(255 * a * a * (3 - 2 * a))
  }

await sharp(out, { raw: { width: sw, height: sh, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile('public/images/hero/hero-scene-v4.png')

// The thumbnail is a plain rectangle: the card it sits on is the same dark
// teal it was rendered on, and the page fades its left edge in CSS.
await sharp(SRC)
  .extract({ left: 1014, top: 232, width: 91, height: 62 })
  .png({ compressionLevel: 9 })
  .toFile('public/images/hero/hero-car-thumb.png')

// The charger on the phone's station card, the design's own thumbnail.
await sharp(SRC)
  .extract({ left: 873, top: 578, width: 47, height: 51 })
  .png({ compressionLevel: 9 })
  .toFile('public/images/hero/hero-station-thumb.png')

console.log(
  `wrote public/images/hero/hero-scene-v4.png (${sw}x${sh}, frame x ${SCENE.left - ORIGIN.x}) and the two phone thumbnails`,
)

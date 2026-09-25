// scripts/make-freedom-car.mjs
//
// Cuts the car-at-a-charger illustration out of its pale green backdrop, for
// FreedomBand, which sets it on white:
//
//   node scripts/make-freedom-car.mjs <source.png>
//   -> public/images/home/freedom-car-hd.png
//
// <source.png> is the 465 × 220 render. The outlines below are traced in its
// pixel space.
//
// ── Smooth, not sharp ─────────────────────────────────────────────────
//
// Three things keep the edge soft enough to read as a photograph and not as a
// sticker:
//   · the work is done at 3× the source, upscaled with Lanczos, so the output
//     has the pixels for a smooth edge on a high-density screen;
//   · the car's outline is a Catmull-Rom curve through the traced points, not
//     straight segments between them, and the charger's corners are rounded;
//   · the mask is pulled 0.8 source px inside the trace, so no backdrop
//     colour rides along the rim, then feathered by about a source pixel.
//
// ── Why traced, not keyed ─────────────────────────────────────────────
//
// Everything in the render is pastel: the charger's shaded side, the cable,
// the car's mint nose and the floor shadow are all close to the backdrop and
// to each other. Every automatic rule tried either cut into the charger and
// the cable or kept the shadow as a green slab. So the objects are traced
// polygons, rasterised at 4× for a clean edge.
//
// ── The shadow ────────────────────────────────────────────────────────
//
// Outside the objects, the only thing kept is how much darker each pixel is
// than the backdrop would be there. That becomes a shadow in the band's ink
// (#17313A), blurred and faded toward the render's edges, so it falls off
// softly on white instead of reading as a green smudge. The backdrop itself is
// predicted from the render's border (a Coons blend of the four edges), which
// works because it is a smooth gradient.

import sharp from 'sharp'

const SRC = process.argv[2]
if (!SRC) throw new Error('usage: node scripts/make-freedom-car.mjs <source.png>')
const OUT = 'public/images/home/freedom-car-hd.png'

const CHARGER = [
  [76, 30], [98, 24], [139, 22], [139.5, 162], [133.5, 165], [133.5, 176], [83, 176], [83, 168], [76, 166],
]
const CAR = [
  [211, 80], [250, 71], [290, 70], [336, 76], [361, 94], [382, 120], [385.5, 150], [380, 164], [368, 172],
  [345, 169], [290, 184], [283, 193], [272, 197.5], [258, 194.5], [250, 190], [200, 187], [150, 179],
  [145.5, 168], [143, 150], [146, 132], [157, 118], [186, 102],
]
const CABLE = 'M76 108 C68 118, 70 150, 84 158 C100 164, 125 150, 139 131 C146 124, 152 120, 158 118'

/** Working scale over the source. */
const S = 3

const srcMeta = await sharp(SRC).metadata()
const w0 = srcMeta.width, h0 = srcMeta.height
const { data, info } = await sharp(SRC)
  .removeAlpha()
  .resize(w0 * S, h0 * S, { kernel: 'lanczos3' })
  .raw()
  .toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info

// ── The objects' mask ─────────────────────────────────────────────────
const poly = (pts) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`
/** A closed Catmull-Rom curve through the points, as cubic Béziers. */
function smoothClosed(pts) {
  const n = pts.length
  const p = (i) => pts[(i + n) % n]
  let d = `M ${p(0)[0]} ${p(0)[1]}`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1), [x1, y1] = p(i), [x2, y2] = p(i + 1), [x3, y3] = p(i + 2)
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6]
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6]
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${x2} ${y2}`
  }
  return d + ' Z'
}
// Supersampled 4× over the working scale, then brought down with Lanczos.
const SS = S * 4
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w0 * SS}" height="${h0 * SS}" viewBox="0 0 ${w0} ${h0}">
  <g stroke-linejoin="round">
    <path d="${poly(CHARGER)}" fill="#fff" />
    <path d="${smoothClosed(CAR)}" fill="#fff" />
    <!-- The pull-in: the outlines stroked in black eat 0.8px off every edge
         and round the charger's corners. -->
    <path d="${poly(CHARGER)}" fill="none" stroke="#000" stroke-width="1.6" />
    <path d="${smoothClosed(CAR)}" fill="none" stroke="#000" stroke-width="1.6" />
  </g>
</svg>`
const mask = await sharp(Buffer.from(maskSvg))
  .resize(w, h, { kernel: 'lanczos3' })
  .blur(0.9 * S)
  .extractChannel(0)
  .raw()
  .toBuffer()

/*
  The cable is too thin to trace to the pixel — a fixed stroke along the
  traced path sat half a pixel off it and dragged a pale arc of backdrop along
  one side. So the trace only marks a corridor, 7 source px wide, and inside it
  the cable is whatever is darker than the backdrop: its own darkness is its
  alpha, and its colour is un-mixed from the backdrop behind it.
*/
const corridorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w0 * SS}" height="${h0 * SS}" viewBox="0 0 ${w0} ${h0}">
  <path d="${CABLE}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" />
</svg>`
const corridor = await sharp(Buffer.from(corridorSvg))
  .resize(w, h, { kernel: 'lanczos3' })
  .blur(1.5 * S)
  .extractChannel(0)
  .raw()
  .toBuffer()

// ── The backdrop, predicted from the border ───────────────────────────
const at = (x, y) => {
  const i = (y * w + x) * 3
  return [data[i], data[i + 1], data[i + 2]]
}
//
// Fitted, not interpolated from all four edges: the shadow runs off the
// bottom edge under the car and off the left edge beside the charger, so
// those edges are not backdrop. The fit uses only border pixels the shadow
// never reaches — the whole top row, the left column above the charger's
// shadow, the right column — and a bilinear surface in x and y through them,
// which is all a soft studio gradient needs.
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const samples = []
for (let x = 2 * S; x < w - 2 * S; x += 2 * S) samples.push([x, 2 * S])
for (let y = 2 * S; y < 140 * S; y += 2 * S) samples.push([2 * S, y])
for (let y = 2 * S; y < h - 2 * S; y += 2 * S) samples.push([w - 3 * S, y])
/** Least squares for value ≈ a + b·x + c·y + d·x·y over the samples. */
function fit(value) {
  const A = Array.from({ length: 4 }, () => [0, 0, 0, 0])
  const r = [0, 0, 0, 0]
  for (const [x, y] of samples) {
    const f = [1, x, y, x * y]
    const v = value(at(x, y))
    for (let i = 0; i < 4; i++) {
      r[i] += f[i] * v
      for (let j = 0; j < 4; j++) A[i][j] += f[i] * f[j]
    }
  }
  for (let i = 0; i < 4; i++) {
    let p = i
    for (let k = i + 1; k < 4; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k
    ;[A[i], A[p]] = [A[p], A[i]]
    ;[r[i], r[p]] = [r[p], r[i]]
    for (let k = i + 1; k < 4; k++) {
      const f = A[k][i] / A[i][i]
      for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]
      r[k] -= f * r[i]
    }
  }
  const coef = [0, 0, 0, 0]
  for (let i = 3; i >= 0; i--) {
    let t = r[i]
    for (let j = i + 1; j < 4; j++) t -= A[i][j] * coef[j]
    coef[i] = t / A[i][i]
  }
  return (x, y) => coef[0] + coef[1] * x + coef[2] * y + coef[3] * x * y
}
const backdropLum = fit(lum)
const backdropCh = [0, 1, 2].map((c) => fit((p) => p[c]))

// ── The shadow, as ink ────────────────────────────────────────────────
const shade = Buffer.alloc(w * h)
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const k = y * w + x
    const b = backdropLum(x, y)
    const darker = (b - lum(at(x, y))) / b
    const edgeFade = Math.max(0, Math.min(1, x / (45 * S), (w - 1 - x) / (45 * S), (h - 1 - y) / (16 * S)))
    shade[k] = Math.round(255 * Math.max(0, Math.min(1, (darker - 0.035) * 2.2)) * edgeFade)
  }
const shadeSoft = await sharp(shade, { raw: { width: w, height: h, channels: 1 } }).blur(3 * S).extractChannel(0).raw().toBuffer()

// ── Composite: objects in their own colour, shadow in ink beneath ─────
const INK = [23, 49, 58]
const SHADOW_MAX = 0.6
const out = Buffer.alloc(w * h * 4)
for (let k = 0; k < w * h; k++) {
  const x = k % w, y = (k / w) | 0
  const m = mask[k] / 255
  const P = [data[k * 3], data[k * 3 + 1], data[k * 3 + 2]]

  // The cable: its darkness against the backdrop, inside its corridor only.
  let ca = 0
  const cor = corridor[k] / 255
  const B = backdropCh.map((f) => f(x, y))
  if (cor > 0 && m < 1) {
    const darker = (lum(B) - lum(P)) / lum(B)
    const t = Math.min(1, Math.max(0, (darker - 0.1) / 0.3))
    ca = t * t * (3 - 2 * t) * cor
  }
  const cableC = P.map((v, c) => (ca > 0.02 ? Math.min(255, Math.max(0, (v - (1 - ca) * B[c]) / ca)) : v))

  // The shadow never doubles under the cable.
  const sRaw = (shadeSoft[k] / 255) * SHADOW_MAX * (1 - cor)

  // Stack, back to front: shadow, cable, objects — premultiplied, then straight.
  let pr = 0, pg = 0, pb = 0, a = 0
  const over = (col, al) => {
    pr = col[0] * al + pr * (1 - al)
    pg = col[1] * al + pg * (1 - al)
    pb = col[2] * al + pb * (1 - al)
    a = al + a * (1 - al)
  }
  over(INK, sRaw)
  over(cableC, ca)
  over(P, m)
  out[k * 4] = a > 0 ? Math.round(pr / a) : 0
  out[k * 4 + 1] = a > 0 ? Math.round(pg / a) : 0
  out[k * 4 + 2] = a > 0 ? Math.round(pb / a) : 0
  out[k * 4 + 3] = Math.round(a * 255)
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .trim({ threshold: 0 })
  .png({ compressionLevel: 9 })
  .toFile(OUT)
const meta = await sharp(OUT).metadata()
console.log(`wrote ${OUT} (${meta.width}x${meta.height})`)

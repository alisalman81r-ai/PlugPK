// scripts/clean-onboarding-car.mjs
//
// Makes public/images/home/freedom-car-clean.png from freedom-car-hd.png for the app
// prototype's welcome screen: removes the baked-in dark shadow and halo, then
// gives the outline a clean anti-aliased edge. The app draws its own shadow.
//
//   node scripts/clean-onboarding-car.mjs

import sharp from 'sharp'

const SRC = 'public/images/home/freedom-car-hd.png'
const OUT = 'public/images/home/freedom-car-clean.png'

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
// Shadow and halo: anything not solid, or solid but dark. The car's own dark
// parts (windows, grille) are enclosed by its light body, so a fill from the
// outside never reaches them.
const isBackground = (p) => {
  const i = p * 4
  return data[i + 3] < 235 || lum(i) < 70
}

const gone = new Uint8Array(W * H)
const stack = []
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x)
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1)
while (stack.length) {
  const p = stack.pop()
  if (gone[p] || !isBackground(p)) continue
  gone[p] = 1
  const x = p % W, y = (p / W) | 0
  if (x > 0) stack.push(p - 1)
  if (x < W - 1) stack.push(p + 1)
  if (y > 0) stack.push(p - W)
  if (y < H - 1) stack.push(p + W)
}

// Alpha mask: kept pixels opaque, then shave one pixel off the outline (the
// fringe) and soften it so the edge is smooth rather than jagged.
const mask = Buffer.alloc(W * H)
for (let p = 0; p < W * H; p++) mask[p] = gone[p] ? 0 : 255
const eroded = Buffer.alloc(W * H)
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const p = y * W + x
    let v = mask[p]
    if (v && (x === 0 || y === 0 || x === W - 1 || y === H - 1 || !mask[p - 1] || !mask[p + 1] || !mask[p - W] || !mask[p + W])) v = 0
    eroded[p] = v
  }
const soft = await sharp(eroded, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer()

const out = Buffer.from(data)
for (let p = 0; p < W * H; p++) out[p * 4 + 3] = soft[p]
// Trim the empty margin so the image sizes predictably in the layout.
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim().png({ compressionLevel: 9 }).toFile(OUT)
console.log('Wrote', OUT)

// scripts/car-plates.mjs
//
// Puts a plug.pk number plate on every catalogue photograph.
//
// The plate is drawn as SVG and warped onto each car by the four corners in
// scripts/car-plate-corners.json — [top-left, top-right, bottom-right,
// bottom-left] in pixels of the 811x608 frame — so it takes the bumper's
// perspective. Each quad covers whatever plate the source photo had: a show
// plate, a blacked-out box, or the bare mount. A quad taller than a plate (a
// big cover box) gets a dark holder with a plate of true shape centred in it.
//
// Run it against photos WITHOUT plates — the cut-outs of commit 95c4aab:
//   git archive 95c4aab public/images/cars | tar -x -C /tmp/orig
//   node scripts/car-plates.mjs scripts/car-plate-corners.json /tmp/orig/public/images/cars public/images/cars
// then copy the same files into data/catalogue-images and bump
// CAR_PHOTO_EDITION in src/lib/db/car-queries.ts.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const PW = 520, PH = 112, SS = 3
// `holder` > PH sets the plate on a dark holder that tall height, centred, so a
// quad taller than a plate (a big cover box) still gets a plate of true shape.
export function plateSvg(scale = SS, holder = PH) {
  const W = PW * scale, H = Math.round(holder * scale), dy = (holder - PH) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${PW} ${holder}">
  ${holder > PH ? `<rect width="${PW}" height="${holder}" rx="10" fill="#16191A"/><g transform="translate(0 ${dy})">` : '<g>'}
  <rect x="2" y="2" width="${PW - 4}" height="${PH - 4}" rx="10" fill="#FFFFFF" stroke="#0B332C" stroke-width="4"/>
  <rect x="9" y="9" width="${PW - 18}" height="${PH - 18}" rx="6" fill="none" stroke="#0B332C" stroke-width="1.5" opacity="0.35"/>
  <g transform="translate(78 18) scale(0.47)">
    <g fill="#159E89" stroke="#159E89" stroke-linejoin="round" transform="translate(-4 -6)">
      <path stroke-width="11" d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z"/>
      <path stroke-width="5" d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z"/>
    </g>
  </g>
  <text x="160" y="80" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="70" letter-spacing="-2.5"><tspan fill="#0B332C">plug</tspan><tspan fill="#159E89">.pk</tspan></text>
  </g>
</svg>`
}

// Homography mapping unit-plate (u,v) in [0,PW]x[0,PH] to dst quad.
function homography(src, dst) {
  const A = [], b = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [X, Y] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X)
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y)
  }
  // Gaussian elimination
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]
    for (let r = 0; r < 8; r++) if (r !== c) {
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  const h = b.map((v, i) => v / A[i][i]); h.push(1)
  return h
}
function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g
  const det = a * A + b * B + c * C
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det)
}

export async function apply(srcFile, outFile, quad) {
  const img = sharp(srcFile)
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const aspect = (d(quad[0], quad[1]) + d(quad[3], quad[2])) / (d(quad[0], quad[3]) + d(quad[1], quad[2]))
  const MIN = 2.6 // flattest a plate appears at these camera angles
  const holder = aspect < MIN ? PH * (MIN / aspect) : PH
  const plate = await sharp(Buffer.from(plateSvg(SS, holder))).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pw = plate.info.width, ph = plate.info.height, pd = plate.data
  const Hm = homography([[0, 0], [pw, 0], [pw, ph], [0, ph]], quad)
  const Hi = invert3(Hm)
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1])
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 1), x1 = Math.min(info.width - 1, Math.ceil(Math.max(...xs)) + 1)
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 1), y1 = Math.min(info.height - 1, Math.ceil(Math.max(...ys)) + 1)
  const N = 4 // supersamples per axis
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let r = 0, g = 0, bl = 0, a = 0
    for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
      const X = x + (sx + 0.5) / N, Y = y + (sy + 0.5) / N
      const w = Hi[6] * X + Hi[7] * Y + Hi[8]
      const u = (Hi[0] * X + Hi[1] * Y + Hi[2]) / w, v = (Hi[3] * X + Hi[4] * Y + Hi[5]) / w
      if (u < 0 || v < 0 || u >= pw || v >= ph) continue
      const k = ((v | 0) * pw + (u | 0)) * 4, al = pd[k + 3] / 255
      r += pd[k] * al; g += pd[k + 1] * al; bl += pd[k + 2] * al; a += al
    }
    if (!a) continue
    const cov = a / (N * N), o = (y * info.width + x) * ch
    // premultiplied average; slight shade so the plate sits in the photo's light
    const shade = 0.96
    data[o] = data[o] * (1 - cov) + (r / (N * N)) * shade
    data[o + 1] = data[o + 1] * (1 - cov) + (g / (N * N)) * shade
    data[o + 2] = data[o + 2] * (1 - cov) + (bl / (N * N)) * shade
  }
  await sharp(data, { raw: info }).jpeg({ quality: 90, mozjpeg: true }).toFile(outFile)
}

if (process.argv[1]?.endsWith('car-plates.mjs')) {
  const [, , cj, srcDir, outDir, only] = process.argv
  const corners = JSON.parse(fs.readFileSync(cj, 'utf8'))
  fs.mkdirSync(outDir, { recursive: true })
  for (const [file, quad] of Object.entries(corners)) {
    if (only && !only.split(',').includes(file)) continue
    if (!quad) continue
    await apply(path.join(srcDir, file), path.join(outDir, file), quad)
    console.log('ok', file)
  }
}

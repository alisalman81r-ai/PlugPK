// scripts/fetch-car-images.mjs
//
// Pulls a photograph for each car in src/data/cars.ts from Wikimedia Commons,
// via Wikipedia, and writes an attribution manifest.
//
// Why this route: Commons images carry an explicit licence, which manufacturer
// press photos and image-search results do not. A car photo is somebody's
// copyright, and a commercial site cannot use one just because it was
// reachable. Everything downloaded here is CC or public domain, and the licence
// and author are recorded per file so the credit can be honoured.
//
// The Commons API host does not resolve from this environment, so the metadata
// comes from en.wikipedia.org — which can serve imageinfo for Commons-hosted
// files — and the bytes come from upload.wikimedia.org, which does resolve.
//
// Usage: node scripts/fetch-car-images.mjs [--dry]
//   --dry  report what would be downloaded, write nothing

import fs from 'node:fs'
import path from 'node:path'

const DRY = process.argv.includes('--dry')
const OUT_DIR = path.join('public', 'images', 'cars')
const MANIFEST = path.join('scripts', 'car-image-credits.json')
const UA = 'PlugPK-image-fetch/1.0 (https://plug.pk; car catalogue illustration)'

/**
 * Candidate Wikipedia articles per car id, best first.
 *
 * Several of these cars are sold here under a different name than the one the
 * article uses — the Deepal L07 is the SL03 renamed, the GUGO AION V is Aion's
 * car — so a single guessed title would miss them. Listing alternatives is the
 * difference between finding a photo and silently giving up.
 */
const ARTICLES = {
  'byd-atto-2': ['BYD Atto 2', 'BYD Yuan Up'],
  'dongfeng-vigo': ['Dongfeng Vigo', 'Dongfeng Nammi'],
  'jaecoo-j6': ['Jaecoo J6', 'Jaecoo'],
  'byd-atto-3-advanced': ['BYD Atto 3'],
  'omoda-e5': ['Omoda E5', 'Chery Omoda 5', 'Omoda 5'],
  'forthing-friday-bev': ['Forthing Friday', 'Forthing', 'Dongfeng Fengxing'],
  'mg-zs-ev': ['MG ZS EV', 'MG ZS'],
  // Kept separate from the petrol HS for the same reason as the ZS.
  'dongfeng-007': ['Nammi 007', 'Dongfeng Nammi 007', 'Dongfeng Nammi'],
  'gugo-aion-v': ['Aion V', 'GAC Aion V'],
  'riddara-rd6': ['Riddara RD6', 'Radar RD6', 'Riddara'],
  'deepal-l07': ['Deepal SL03', 'Changan Deepal SL03'],
  'xpeng-g6': ['Xpeng G6', 'XPeng G6'],
  'byd-seal': ['BYD Seal'],
  'deepal-s07': ['Deepal S7', 'Changan Deepal S7', 'Deepal S07'],
  'byd-sealion-7-advanced': ['BYD Sealion 7'],
  'kia-ev5': ['Kia EV5'],
  'deepal-e07': ['Deepal E07', 'Changan Deepal E07'],
  'kia-ev9-gt-line': ['Kia EV9'],
  'chery-tiggo-7-phev': ['Chery Tiggo 7', 'Chery Tiggo 7 Pro'],
  'deepal-s05-reev': ['Deepal S05', 'Changan Deepal S05'],
  'forthing-friday-reev': ['Forthing Friday', 'Forthing', 'Dongfeng Fengxing'],
  'jaecoo-j7-phev': ['Jaecoo J7', 'Jaecoo'],
  'omoda-7': ['Omoda 7', 'Omoda 5'],
  'chery-tiggo-8-phev': ['Chery Tiggo 8'],
  'chery-tiggo-9-phev': ['Chery Tiggo 9', 'Chery Tiggo 8'],
  'haval-h6-phev': ['Haval H6'],
  'mg-hs-phev': ['MG HS'],
  'gwm-tank-500-phev': ['Tank 500', 'GWM Tank 500'],

  // The second batch. Several are sold here under a different name than the
  // article uses — the Sealion 6 is the Song Plus DM-i, the Tiggo Cross is a
  // Tiggo 4 derivative — so each lists its alternatives.
  'toyota-corolla-cross-hev': ['Toyota Corolla Cross'],
  'haval-jolion-hev': ['Haval Jolion'],
  'haval-h6-hev': ['Haval H6'],
  'gwm-tank-300-hev': ['GWM Tank 300', 'Tank 300', 'Great Wall Tank 300'],
  'chery-tiggo-cross-hev': ['Chery Tiggo Cross', 'Chery Tiggo 4', 'Chery Tiggo'],
  'byd-sealion-6': ['BYD Sealion 6', 'BYD Song Plus', 'BYD Song'],
  'dfsk-seres-3': ['Seres 3', 'DFSK Seres 3', 'Seres (marque)', 'Aito'],
  'hyundai-ioniq-5': ['Hyundai Ioniq 5'],
}

/**
 * Tokens the chosen filename must contain, so a wrong car cannot slip through.
 *
 * This is the guard that matters. A Wikipedia article often illustrates several
 * generations and related models, and an article-level match is not a
 * car-level match — "Chery Tiggo 8" leads with a Tiggo 8, but its gallery holds
 * Tiggo 7s too. A filename check is crude but it is checkable, and a wrong
 * photo on a price page is worse than no photo.
 */
const REQUIRE = {
  'byd-atto-2': [['atto', 'yuan']],
  'dongfeng-vigo': [['vigo']],
  'jaecoo-j6': [['jaecoo'], ['j6']],
  'byd-atto-3-advanced': [['atto'], ['3']],
  'omoda-e5': [['omoda'], ['e5', 'e 5']],
  'forthing-friday-bev': [['friday']],
  // The petrol ZS and the ZS EV are the same article and look alike from the
  // side; the EV's closed front panel is the only tell, so require the badge in
  // the filename rather than trusting the lead image.
  'mg-zs-ev': [['zs'], ['ev']],
  'dongfeng-007': [['007']],
  'gugo-aion-v': [['aion']],
  'riddara-rd6': [['riddara', 'radar', 'rd6']],
  'deepal-l07': [['deepal', 'sl03']],
  'xpeng-g6': [['xpeng'], ['g6']],
  'byd-seal': [['seal']],
  'deepal-s07': [['deepal'], ['s7', 's07']],
  'byd-sealion-7-advanced': [['sealion']],
  'kia-ev5': [['ev5']],
  'deepal-e07': [['deepal'], ['e07']],
  'kia-ev9-gt-line': [['ev9']],
  'chery-tiggo-7-phev': [['tiggo'], ['7']],
  'deepal-s05-reev': [['deepal'], ['s05', 's5']],
  'forthing-friday-reev': [['friday']],
  'jaecoo-j7-phev': [['jaecoo'], ['j7']],
  'omoda-7': [['omoda'], ['7']],
  'chery-tiggo-8-phev': [['tiggo'], ['8']],
  'chery-tiggo-9-phev': [['tiggo'], ['9']],
  'haval-h6-phev': [['haval'], ['h6']],
  'mg-hs-phev': [['hs']],
  'gwm-tank-500-phev': [['tank'], ['500']],

  // The hybrids look identical to their petrol siblings from outside, and the
  // articles cover both, so these require the model but not the drivetrain —
  // a Jolion is a Jolion. Where the two are genuinely different cars, as with
  // Tank 300 against Tank 500, the number is required.
  'toyota-corolla-cross-hev': [['corolla'], ['cross']],
  'haval-jolion-hev': [['jolion']],
  'haval-h6-hev': [['haval', 'h6'], ['h6']],
  'gwm-tank-300-hev': [['tank'], ['300']],
  // 'tiggo' alone matched a 2018 Tiggo 5x — a different car with a similar
  // name. The model word is required, which is what makes this a miss rather
  // than a wrong photograph on a price page.
  'chery-tiggo-cross-hev': [['tiggo'], ['cross']],
  'byd-sealion-6': [['sealion', 'song']],
  // 'dfsk' alone matched a Fengon 500, a petrol SUV from the same maker. Only
  // the Seres name will do.
  'dfsk-seres-3': [['seres'], ['3']],
  'hyundai-ioniq-5': [['ioniq'], ['5']],
}

/**
 * Filenames that are not a photograph of the whole car.
 *
 * An article's media list holds interiors, dashboards, badges, chargeport
 * close-ups and engine bays alongside the car. Any of those on a listing card
 * reads as a mistake, and the lead-image sort alone does not exclude them —
 * some articles have no lead image at all, so the first match can be a
 * steering wheel.
 */
const NOT_THE_CAR = [
  'interior', 'interieur', 'innenraum', 'dashboard', 'dash ', 'cockpit',
  'badge', 'logo', 'emblem', 'wheel', 'seat', 'engine', 'motor ', 'boot',
  'trunk', 'charge port', 'chargeport', 'charging port', 'headlight',
  'taillight', 'tail light', 'detail', 'instrument', 'screen', 'display',
]

/** Licences acceptable for a commercial page, with attribution. */
const OK_LICENCE = /^(cc[ -]?by([ -]sa)?([ -]\d(\.\d)?)?|cc0|public domain|pd)/i

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

/** Files an article uses, lead image first. */
async function mediaList(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(
    title.replace(/ /g, '_'),
  )}`
  const data = await getJson(url)
  const images = (data.items ?? []).filter(
    (item) => item.type === 'image' && item.title && (item.srcset ?? []).length > 0,
  )
  // Lead image first: it is the infobox photo, which is the car itself rather
  // than an interior shot or a badge close-up.
  return images.sort((a, b) => Number(Boolean(b.leadImage)) - Number(Boolean(a.leadImage)))
}

async function fileInfo(fileTitle) {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo` +
    `&iiprop=extmetadata|url|size&iiextmetadatafilter=LicenseShortName|Artist|LicenseUrl` +
    `&titles=${encodeURIComponent(fileTitle)}`
  const data = await getJson(url)
  const page = Object.values(data.query?.pages ?? {})[0]
  const info = (page?.imageinfo ?? [])[0]
  if (!info) return null

  const meta = info.extmetadata ?? {}
  const strip = (html) =>
    (html ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  return {
    licence: meta.LicenseShortName?.value ?? null,
    licenceUrl: meta.LicenseUrl?.value ?? null,
    author: strip(meta.Artist?.value) || null,
    descriptionUrl: info.descriptionurl ?? null,
    width: info.width ?? 0,
  }
}

function matchesCar(carId, fileTitle) {
  const name = fileTitle.toLowerCase().replace(/_/g, ' ')
  if (NOT_THE_CAR.some((word) => name.includes(word))) return false

  const groups = REQUIRE[carId] ?? []
  // Every group must be satisfied by at least one of its alternatives.
  return groups.every((alternatives) => alternatives.some((token) => name.includes(token)))
}

/** A width big enough for a card and a detail hero, without being a wallpaper. */
function thumbUrl(srcset) {
  const src = srcset[0].src.startsWith('//') ? `https:${srcset[0].src}` : srcset[0].src
  return src.replace(/\/\d+px-/, '/1280px-').split('?')[0]
}

const carsSource = fs.readFileSync(path.join('src', 'data', 'cars.ts'), 'utf8')
const carIds = [...carsSource.matchAll(/^ {4}id: '([^']+)',$/gm)].map((match) => match[1])

if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true })

const credits = []
const missing = []

for (const carId of carIds) {
  const titles = ARTICLES[carId] ?? []
  let done = false

  for (const title of titles) {
    if (done) break

    let images
    try {
      images = await mediaList(title)
    } catch {
      continue
    }

    for (const image of images) {
      if (!matchesCar(carId, image.title)) continue

      const info = await fileInfo(image.title)
      if (!info?.licence || !OK_LICENCE.test(info.licence)) continue
      // Too small to fill a 16:10 card without looking soft.
      if (info.width && info.width < 800) continue

      const url = thumbUrl(image.srcset)
      const ext = (url.match(/\.(jpg|jpeg|png)$/i)?.[1] ?? 'jpg').toLowerCase()
      const file = `${carId}.${ext === 'jpeg' ? 'jpg' : ext}`

      if (!DRY) {
        const response = await fetch(url, { headers: { 'User-Agent': UA } })
        if (!response.ok) continue
        const bytes = Buffer.from(await response.arrayBuffer())
        if (bytes.length < 15_000) continue
        fs.writeFileSync(path.join(OUT_DIR, file), bytes)
      }

      credits.push({
        carId,
        file: `cars/${file}`,
        article: title,
        commonsFile: image.title.replace(/^File:/, ''),
        licence: info.licence,
        licenceUrl: info.licenceUrl,
        author: info.author,
        source: info.descriptionUrl,
      })
      console.log(`  ok    ${carId.padEnd(24)} ${info.licence.padEnd(14)} ${image.title.slice(5, 60)}`)
      done = true
      break
    }

    await sleep(150) // courtesy pause between articles
  }

  if (!done) {
    missing.push(carId)
    console.log(`  MISS  ${carId}`)
  }
}

/**
 * Emits the credits module the app actually imports.
 *
 * This used to write only the JSON manifest, while src/data/carImageCredits.ts
 * was maintained by hand — under a header saying it was generated by this
 * script. Adding cars therefore downloaded seven CC BY-SA photographs and
 * credited none of them, which is a licence breach rather than an untidy file:
 * BY-SA requires the photographer to be named wherever the image appears.
 * Generating it here means the credit cannot fall behind the images again.
 */
function creditsModule(entries) {
  const rows = [...entries]
    .sort((a, b) => a.carId.localeCompare(b.carId))
    .map((credit) => {
      const url = credit.licenceUrl ? `'${credit.licenceUrl}'` : 'null'
      return [
        `  '${credit.carId}': {`,
        `    author: ${JSON.stringify(credit.author)},`,
        `    licence: ${JSON.stringify(credit.licence)},`,
        `    licenceUrl: ${url},`,
        `    source: ${JSON.stringify(credit.source)},`,
        '  },',
      ].join('\n')
    })

  return `// src/data/carImageCredits.ts
//
// GENERATED by scripts/fetch-car-images.mjs — do not edit by hand.
//
// Every car photograph comes from Wikimedia Commons under a CC or public-domain
// licence. Most are CC BY-SA, which requires the photographer to be credited
// wherever the image appears, so this map exists to put that credit next to the
// photo rather than only in a file nobody opens.
//
// Regenerate with: node scripts/fetch-car-images.mjs

export interface ImageCredit {
  author: string
  licence: string
  licenceUrl: string | null
  /** The Commons file page, which carries the full licence terms. */
  source: string
}

export const carImageCredits: Record<string, ImageCredit> = {
${rows.join('\n')}
}

/**
 * The credit for one car, or undefined if that car has no photograph.
 *
 * A function rather than letting callers index the map, so a car id with no
 * entry is a plain undefined at the call site rather than an unchecked lookup
 * that only fails once somebody renders it.
 */
export function getImageCredit(carId: string): ImageCredit | undefined {
  return carImageCredits[carId]
}
`
}

if (!DRY) {
  fs.writeFileSync(MANIFEST, `${JSON.stringify({ credits, missing }, null, 2)}\n`)
  fs.writeFileSync(path.join('src', 'data', 'carImageCredits.ts'), creditsModule(credits))
  console.log(`\nwrote ${MANIFEST} and src/data/carImageCredits.ts`)
}

console.log(`\n${credits.length} images, ${missing.length} without one`)
if (missing.length > 0) console.log(`missing: ${missing.join(', ')}`)

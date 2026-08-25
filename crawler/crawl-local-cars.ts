// crawler/crawl-local-cars.ts
//
// Step 2: prove the extraction pipeline end to end — discover links on a listing
// page, follow them, pull typed fields off each detail page, report what worked
// and how it was obtained.
//
// The target is this project's own site on localhost. That is deliberate: it
// exercises exactly the mechanism a real crawl needs, against a page whose terms
// nobody has to check and whose owner is the person running it. No third-party
// site is touched, nothing is written anywhere, and Prisma is not imported.
// Choosing a real source is a decision for the next step.
//
// Run:  npm run crawl:local
//       npm run crawl:local -- 5        (stop after 5 detail pages)

import { absolute, attribute, text } from './extract'
import { CrawlSession } from './session'
import { readJsonLd, readMeta } from './structured'
import type { CrawlReport, Field, ScrapedCar } from './types'

const BASE = process.env.CRAWL_BASE ?? 'http://localhost:3000'
const LIST_URL = `${BASE}/cars`

/** Routes under /cars that are not a car. */
const NOT_A_CAR = new Set(['compare'])

/**
 * Link discovery anchors on the URL shape, not on the card's markup.
 *
 * These cards carry no semantic hook of any kind — no `<article>`, no `data-*`,
 * only generated utility classes like `rounded-[calc(1.5rem-1.5px)]`. A selector
 * written against those survives until the next design tweak. The href pattern
 * is the one thing about a card that is a contract.
 */
async function discover(session: CrawlSession, limit: number): Promise<string[]> {
  const { page } = await session.fetch(LIST_URL)

  try {
    const hrefs = await page
      .locator('a[href^="/cars/"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') ?? ''),
      )

    // Deduplicated: a card links to the same car from both its photo and its
    // title, so a naive list crawls every car twice.
    const slugs = new Set<string>()
    for (const href of hrefs) {
      const match = /^\/cars\/([a-z0-9-]+)$/.exec(href)
      if (match?.[1] && !NOT_A_CAR.has(match[1])) slugs.add(match[1])
    }

    return [...slugs].slice(0, limit)
  } finally {
    await page.close()
  }
}

/**
 * Does this image plausibly belong to this car?
 *
 * The guard exists because the DOM-only first version failed exactly here. On a
 * car with no photograph of its own, `main img` matched the first image in the
 * document — which belonged to a related-cars rail — and the crawler reported a
 * complete record with another car's photograph in it. It looked perfect.
 *
 * That is the same failure the car-image fetch script guards against with
 * filename tokens, and it is worth guarding twice: a wrong photograph is the
 * hardest kind of bad data to notice, because nothing about it is empty.
 *
 * A URL that cannot be checked is not condemned — only one that is checkable and
 * names a different car.
 */
function imageLooksRight(url: string | null, slug: string): string | undefined {
  if (url === null) return undefined

  const decoded = decodeURIComponent(url).toLowerCase()
  const stem = /\/([^/?#]+)\.(?:jpe?g|png|webp|avif)/.exec(decoded)?.[1]
  if (!stem) return undefined

  // An opaque name — an upload id, a hash — says nothing either way.
  if (!/[a-z]{3}/.test(stem.replace(/[0-9a-f-]{16,}/g, ''))) return undefined

  const words = slug.split('-').filter((word) => word.length > 2)
  const overlaps = words.some((word) => stem.includes(word))

  return overlaps ? undefined : `filename "${stem}" does not mention "${slug}"`
}

/** Splits `og:title` on the separator the site chose: "BYD Atto 2 — PKR 72.9 Lakh". */
function splitOgTitle(title: string): { name: string; price: string | null } {
  const parts = title.split(/\s+[—–|·-]\s+/)
  const name = parts[0]?.trim() ?? title
  const rest = parts.slice(1).join(' ').trim()
  return { name, price: rest.length > 0 ? rest : null }
}

async function scrapeOne(session: CrawlSession, slug: string): Promise<ScrapedCar> {
  const url = `${BASE}/cars/${slug}`
  const { page, status } = await session.fetch(url)

  try {
    /*
      Structured data first, meta tags second, DOM last.

      Each field takes the best source that actually produced a value, and
      records which one, so a source quietly dropping its JSON-LD shows up as a
      strategy change rather than as fields going empty.
    */
    const ld = await readJsonLd(page)
    const meta = await readMeta(page)
    const og = meta['og:title'] ? splitOgTitle(meta['og:title']) : null

    let name: Field<string>
    if (ld?.name) {
      name = { raw: ld.name, value: ld.name, selector: 'ld+json Car.name', via: 'json-ld' }
    } else if (og?.name) {
      name = { raw: meta['og:title'] ?? null, value: og.name, selector: 'og:title', via: 'meta' }
    } else {
      // The DOM fallback reads only the model — the h1 on this page is "Atto 2",
      // not "BYD Atto 2" — which is exactly why it is the last resort.
      name = { ...(await text(page, 'h1')), via: 'dom' }
    }

    let price: Field<string>
    if (ld?.price !== undefined) {
      const rendered = `${ld.priceCurrency ?? ''} ${ld.price}`.trim()
      price = { raw: rendered, value: rendered, selector: 'ld+json Offer.price', via: 'json-ld' }
    } else if (og?.price) {
      price = { raw: meta['og:title'] ?? null, value: og.price, selector: 'og:title', via: 'meta' }
    } else {
      price = {
        raw: null,
        value: null,
        selector: 'ld+json Offer.price → og:title',
        error: 'no machine-readable price on the page',
      }
    }

    let image: Field<string>
    if (ld?.image) {
      image = { raw: ld.image, value: absolute(ld.image, url), selector: 'ld+json Car.image', via: 'json-ld' }
    } else if (meta['og:image']) {
      const raw = meta['og:image']
      image = { raw, value: absolute(raw, url), selector: 'og:image', via: 'meta' }
    } else {
      const dom = await attribute(page, 'main img', 'src')
      image = { ...dom, value: absolute(dom.value, url), via: 'dom' }
    }

    const suspect = imageLooksRight(image.value, slug)
    if (suspect) image = { ...image, suspect }

    return {
      sourceId: slug,
      provenance: { url, fetchedAt: new Date().toISOString(), status },
      name,
      price,
      imageUrl: image,
      // Typed and unit-carrying from JSON-LD. The DOM equivalent produced
      // duplicate labels, because the page renders headline specs and a full
      // table from the same data.
      specs: ld?.properties ?? {},
    }
  } finally {
    await page.close()
  }
}

async function main(): Promise<number> {
  const limit = Number(process.argv[2] ?? 5)
  const session = new CrawlSession()
  const report: CrawlReport<ScrapedCar> = {
    ok: [],
    failed: [],
    startedAt: new Date().toISOString(),
    finishedAt: '',
  }

  console.log(`\nLocal extraction test\n  base:  ${BASE}\n  limit: ${limit} detail pages\n`)

  let suspects = 0

  try {
    await session.open()

    const slugs = await discover(session, limit)
    console.log(`  discovered ${slugs.length} car links on ${LIST_URL}\n`)

    for (const slug of slugs) {
      try {
        const car = await scrapeOne(session, slug)
        report.ok.push(car)

        const fields: Field<unknown>[] = [car.name, car.price, car.imageUrl]
        const filled = fields.filter((field) => field.value !== null).length
        const flagged = fields.filter((field) => field.suspect).length
        suspects += flagged

        console.log(
          `  OK    ${slug.padEnd(26)} ${filled}/3 fields · ${
            Object.keys(car.specs).length
          } specs · via ${car.name.via}${flagged > 0 ? `  ⚠ ${flagged} suspect` : ''}`,
        )
        for (const field of fields) {
          if (field.suspect) console.log(`          suspect: ${field.selector} — ${field.suspect}`)
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        report.failed.push({ url: `${BASE}/cars/${slug}`, reason })
        console.log(`  FAIL  ${slug.padEnd(26)} ${reason}`)
      }
    }
  } catch (error) {
    console.error('\n  Crawl could not start:', error instanceof Error ? error.message : error)
    return 1
  } finally {
    await session.close()
  }

  report.finishedAt = new Date().toISOString()

  // One record in full. Printing only counts is how the first version of this
  // reported "3/3 fields" on a record holding the wrong car's photograph.
  const sample = report.ok[0]
  if (sample) {
    console.log('\n  ── one record in full ──')
    console.log(
      JSON.stringify(sample, null, 2)
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n'),
    )
  }

  console.log(
    `\n  ${report.ok.length} scraped, ${report.failed.length} failed, ${suspects} field(s) flagged\n`,
  )
  return report.failed.length === 0 && report.ok.length > 0 ? 0 : 1
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })

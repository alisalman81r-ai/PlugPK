// crawler/structured.ts

import type { Page } from '@playwright/test'

/**
 * Reading a page's machine-readable data before touching its markup.
 *
 * ── Why this comes first ──────────────────────────────────────────────
 *
 * The first pass of this crawler read the DOM with CSS selectors, and the very
 * first record it produced was wrong in two ways at once: `dl dd` picked up a
 * battery figure where the price should have been, and `main img` returned a
 * *different car's* photograph, because the car being crawled had no image of
 * its own and the first `<img>` in the document belonged to a related-cars rail.
 *
 * Neither was a coding slip — both are what DOM scraping is like. A selector
 * describes where something happens to sit, and where things sit is the part of
 * a page that changes most often and means least.
 *
 * JSON-LD is the opposite. It exists to be read by machines, its vocabulary is
 * schema.org rather than one site's markup, its values arrive already typed, and
 * it carries units. A site that publishes it is telling you what its page means
 * instead of leaving you to infer it from a layout.
 *
 * So the order is: structured data, then `og:` meta tags, then the DOM. Each
 * field records which of the three produced it — so when a source quietly stops
 * publishing JSON-LD, that shows up as a strategy change in the report rather
 * than as fields going mysteriously empty.
 */

/** Where a value came from. Recorded per field, not per page. */
export type Strategy = 'json-ld' | 'meta' | 'dom'

/** The slice of schema.org/Car and /Vehicle this crawler reads. */
export interface StructuredCar {
  name?: string
  brand?: string
  model?: string
  category?: string
  price?: number
  priceCurrency?: string
  image?: string
  /** additionalProperty entries, flattened to "Battery capacity" → "45.12 kWh". */
  properties: Record<string, string>
}

/** schema.org types worth reading as a car. */
const CAR_TYPES = new Set(['Car', 'Vehicle', 'Product', 'MotorizedVehicle'])

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number') return String(value)
  return undefined
}

/**
 * Pulls the named node out of whatever wrapper the page used.
 *
 * A page may ship one object, an array of them, or a `@graph`. All three are
 * valid JSON-LD and all three occur in the wild, so all three are handled rather
 * than assuming the shape this project happens to emit today.
 */
function findCarNode(parsed: unknown): Record<string, unknown> | null {
  const queue: unknown[] = [parsed]

  while (queue.length > 0) {
    const node = queue.shift()
    if (Array.isArray(node)) {
      queue.push(...node)
      continue
    }
    if (node === null || typeof node !== 'object') continue

    const record = node as Record<string, unknown>
    const type = asString(record['@type'])
    if (type && CAR_TYPES.has(type)) return record

    if ('@graph' in record) queue.push(record['@graph'])
  }

  return null
}

function readProperties(node: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  const list = node['additionalProperty']
  if (!Array.isArray(list)) return out

  for (const entry of list) {
    if (entry === null || typeof entry !== 'object') continue
    const property = entry as Record<string, unknown>
    const name = asString(property['name'])
    const value = asString(property['value'])
    if (!name || !value) continue

    // The unit is kept joined to the value. "45.12" on its own invites the next
    // step to guess kWh, and a guessed unit is a wrong figure waiting to happen.
    const unit = asString(property['unitText'])
    out[name] = unit ? `${value} ${unit}` : value
  }

  return out
}

/** Every ld+json block on the page, parsed leniently. */
export async function readJsonLd(page: Page): Promise<StructuredCar | null> {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
    .catch(() => [] as string[])

  for (const block of blocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(block)
    } catch {
      // A malformed block is not fatal — a page can carry several, and the
      // next one may be fine.
      continue
    }

    const node = findCarNode(parsed)
    if (!node) continue

    const brand = node['brand']
    const offers = node['offers']
    const offer =
      offers !== null && typeof offers === 'object' && !Array.isArray(offers)
        ? (offers as Record<string, unknown>)
        : null

    const price = offer ? Number(offer['price']) : Number.NaN

    return {
      name: asString(node['name']),
      brand:
        brand !== null && typeof brand === 'object'
          ? asString((brand as Record<string, unknown>)['name'])
          : asString(brand),
      model: asString(node['model']),
      category: asString(node['vehicleConfiguration']),
      price: Number.isFinite(price) ? price : undefined,
      priceCurrency: offer ? asString(offer['priceCurrency']) : undefined,
      image: asString(node['image']),
      properties: readProperties(node),
    }
  }

  return null
}

/**
 * The `og:` and `twitter:` tags, as a fallback.
 *
 * Weaker than JSON-LD — `og:title` is prose, so "BYD Atto 2 — PKR 72.9 Lakh"
 * arrives as one string needing a split on a character the site chose — but far
 * stronger than a CSS selector, because these tags exist for machines and are
 * usually the last thing a redesign touches.
 */
export async function readMeta(page: Page): Promise<Record<string, string>> {
  return page
    .locator('meta[property^="og:"], meta[name^="twitter:"]')
    .evaluateAll((nodes) => {
      const out: Record<string, string> = {}
      for (const node of nodes) {
        const element = node as HTMLMetaElement
        const key = element.getAttribute('property') ?? element.getAttribute('name')
        const content = element.getAttribute('content')
        if (key && content && content.trim().length > 0) out[key] = content.trim()
      }
      return out
    })
    .catch(() => ({}))
}

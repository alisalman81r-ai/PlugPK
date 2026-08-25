// crawler/types.ts

/**
 * What the crawler produces.
 *
 * ── Why this is not the application's `Car` type ──────────────────────
 *
 * It would be shorter to scrape straight into `Car` from src/data/cars.ts, and
 * it would be wrong. `Car` is a contract the site depends on: a price is an
 * integer number of rupees, a category is one of four exact strings, and the
 * data module's first rule is that nothing in it is invented. A crawled value
 * satisfies none of that on arrival — it is a string of unknown quality, from a
 * page that may have changed shape, and it might be absent, malformed, or in a
 * unit nobody declared.
 *
 * Scraping directly into the application shape forces a decision at the worst
 * possible moment: the extractor would have to guess a number for "1.05 Cr
 * (ex-factory)" while it is still mid-crawl, and a wrong guess would enter the
 * catalogue looking exactly like a verified figure.
 *
 * So the crawler has its own shape. Everything is optional, everything keeps the
 * raw text it came from, and normalising into `Car` is a separate, reviewable
 * step. That is also what makes it possible to diff a re-crawl against the last
 * one and see what a site actually changed.
 */

/** Where a value came from, kept so any figure can be traced back. */
export interface Provenance {
  /** The page it was read from. */
  url: string
  /** ISO timestamp of the crawl. */
  fetchedAt: string
  /** HTTP status the page returned. */
  status: number
}

/**
 * One extracted field.
 *
 * The raw text is kept alongside any parsed value. When a price reads
 * "PKR 1.05 Cr (ex-factory)", the number is useful and the qualifier is the part
 * that stops somebody quoting it as the on-road price.
 */
export interface Field<T> {
  /** Exactly what was on the page, untouched. */
  raw: string | null
  /** The parsed value, or null when nothing could be parsed from `raw`. */
  value: T | null
  /** The selector, meta key or JSON-LD path that produced it. */
  selector: string
  /**
   * Which strategy won: structured data, a meta tag, or the DOM.
   *
   * Recorded per field rather than per page, because a source can publish
   * JSON-LD for its price and nothing at all for its photograph. It is also an
   * early warning: a field that used to arrive via 'json-ld' and now arrives
   * via 'dom' means the site changed what it publishes, and the DOM rule
   * standing behind it is now load-bearing and probably fragile.
   */
  via?: 'json-ld' | 'meta' | 'dom'
  /** Set when extraction failed, saying how rather than just that it did. */
  error?: string
  /**
   * Set when a value was found but failed a sanity check.
   *
   * Separate from `error` on purpose. An absent field is a gap; a field holding
   * something that cannot be right is a hazard, and the two need different
   * handling downstream. The first DOM-scraped run returned another car's
   * photograph on a car that had none of its own, and reported full health.
   */
  suspect?: string
}

/**
 * A car as scraped: loose, optional, and traceable.
 *
 * Deliberately a subset of what the app stores. The crawler's job is to read
 * what a page says, not to fill every column — a field the source does not
 * publish stays absent here rather than being invented downstream.
 */
export interface ScrapedCar {
  /** Stable identifier from the source, usually its URL slug. */
  sourceId: string
  provenance: Provenance
  name: Field<string>
  price: Field<string>
  /** Absolute URL of the main photograph, if the page has one. */
  imageUrl: Field<string>
  /** Everything else the page offered, as label → value, unparsed. */
  specs: Record<string, string>
}

/**
 * The outcome of a crawl.
 *
 * Failures are returned rather than thrown. A crawl of forty pages that dies on
 * the eleventh has wasted ten successes, and the interesting information — which
 * pages failed and why — is exactly what an exception discards.
 */
export interface CrawlReport<T> {
  ok: T[]
  failed: { url: string; reason: string }[]
  startedAt: string
  finishedAt: string
}

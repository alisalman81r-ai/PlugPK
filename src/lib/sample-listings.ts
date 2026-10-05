// src/lib/sample-listings.ts

import { safeHref } from '@/lib/validate'

/**
 * Which listings are examples, and which stored websites are safe to show.
 *
 * ── Why this exists ───────────────────────────────────────────────────
 *
 * The six stations in the database (and their 23 reviews) are the sample data
 * the site was built against — the same rows as MOCK_STATIONS in mock-data.ts.
 * Their websites point at atlaspower.example.pk, their reviewers are invented,
 * and their stored rating/reviewCount columns (4.8 from 142 reviews, and so
 * on) do not match the reviews actually held against them.
 *
 * The product owner chose to keep them, because an empty map tells a first
 * visitor nothing about what the site does — but to show them honestly:
 *
 *   - they carry an "Example listing" label wherever a station is shown,
 *   - their photos are labelled as example photos, not presented as the site,
 *   - nothing calls them verified (there is no verification process),
 *   - ratings come from the Review rows, never the stored columns (queries.ts),
 *   - and no example.pk website is ever rendered as a link.
 *
 * ── Why the ids are written out here ───────────────────────────────────
 *
 * Identified by id, not by a column, because the schema has no "sample" flag
 * and this module is imported by client components: reading MOCK_STATIONS to
 * get the ids would ship the whole fixture file to every browser, which is the
 * thing the map was just cleaned of. These must stay in step with the `id`s of
 * MOCK_STATIONS in src/lib/mock-data.ts. When a real operator replaces one,
 * remove its id here.
 */
export const SAMPLE_STATION_IDS: ReadonlySet<string> = new Set([
  'stn-001',
  'stn-002',
  'stn-003',
  'stn-004',
  'stn-005',
  'stn-006',
])

/** True for the sample stations described above. */
export function isSampleListing(id: string | null | undefined): boolean {
  return typeof id === 'string' && SAMPLE_STATION_IDS.has(id)
}

/** The label every surface shows on a sample listing, so it reads the same everywhere. */
export const SAMPLE_LISTING_LABEL = 'Example listing'

/**
 * Hosts reserved for documentation (RFC 2606) and the sample data's own
 * stand-ins. A link to one of these goes nowhere a driver can use.
 */
const PLACEHOLDER_HOST = /(^|\.)example\.(pk|com|org|net)$/i

/**
 * A stored website, only when it is safe and real enough to link to.
 *
 * http(s) only — `javascript:` or `data:` in a stored value would run script on
 * click — and never a placeholder domain. Null means "render no link at all".
 */
export function publicWebsite(raw: string | null | undefined): string | null {
  const href = safeHref(raw)
  if (!href) return null
  return PLACEHOLDER_HOST.test(new URL(href).hostname) ? null : href
}

// crawler/sources/evdb.ts

import { blockedAdapter } from './types'

/**
 * EV Database — ev-database.org
 *
 * ── What was actually checked, on 2026-08-25 ──────────────────────────
 *
 *   https://ev-database.org/                  HTTP 200 — the site is reachable
 *   https://ev-database.org/robots.txt        "User-agent: *" and a Sitemap
 *                                             line. No Disallow at all.
 *   /api  /developers  /terms  /terms-of-use
 *   /about  /imprint                          all HTTP 404
 *
 * So: no public API, and no terms-of-use page at any conventional path.
 *
 * ── Why this is blocked despite a permissive robots.txt ───────────────
 *
 * robots.txt governs crawling. It does not grant a licence to reuse what is
 * crawled, and those are different questions. EV Database is a commercial
 * specification database whose entire product is the compiled dataset; copying a
 * substantial part of it into a competing commercial catalogue is a
 * database-rights and terms question, not a robots question.
 *
 * An empty Disallow is also not the same as consent. It is what a default
 * configuration looks like.
 *
 * The instruction for this phase was explicit: where no official API is
 * available to this project, build the adapter structure and report what access
 * would be required, without attempting to work around the absence. Scraping
 * 1,000 vehicle pages here would be technically easy, which is exactly why the
 * decision has to be a licensing one rather than a technical one.
 *
 * ── What would unblock it ─────────────────────────────────────────────
 *
 * Written permission or a data licence from EV Database, or a commercial API
 * agreement if one exists on request. Their contact form is the route. Until one
 * of those exists, `access()` refuses and `fetch()` throws.
 *
 * The field trust below is set now so that the day access is granted, the
 * priority system already knows what this source is good for — standardised EV
 * engineering figures — and what it is not: anything Pakistani.
 */
export const evdbAdapter = blockedAdapter({
  id: 'evdb',
  name: 'EV Database',
  baseUrl: 'https://ev-database.org',
  defaultTrust: 80,
  fieldTrust: {
    batteryCapacityKwh: 90,
    usableBatteryCapacityKwh: 92,
    rangeKm: 88,
    realWorldRangeKm: 92,
    dcChargingKw: 90,
    acChargingKw: 90,
    chargeTime10To80Min: 88,
    acceleration0To100Sec: 85,
    topSpeedKph: 85,
    // It holds no Pakistani data. Zero, so a null from here can never outrank a
    // real figure from a local source.
    pakistanPrice: 0,
    availability: 0,
    officialDistributor: 0,
  },
  reason:
    'No public API, and no terms-of-use page found at any conventional path. robots.txt permits crawling but grants no reuse licence, and this is a commercial specification database whose product is the compiled dataset. Bulk extraction into a commercial catalogue needs written permission first.',
  requires: [
    'a written data licence or API agreement from EV Database (ev-database.org contact form)',
    'confirmation of permitted reuse scope: which fields, how many records, what attribution',
    'an API key, if a commercial API is offered on request',
  ],
})

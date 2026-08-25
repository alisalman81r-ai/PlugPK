// crawler/sources/evspecsx.ts

import { blockedAdapter } from './types'

/**
 * EVSpecsX — could not be located.
 *
 * ── What was actually checked, on 2026-08-25 ──────────────────────────
 *
 *   evspecsx.com, www.evspecsx.com     no DNS
 *   evspecsx.io, evspecsx.org          no DNS
 *   evspecs.com, ev-specs.com          no DNS
 *   GitHub repository search "evspecsx"   0 results
 *
 * Nothing resolves and nothing is published under the name. I could not confirm
 * this source exists as a public, reachable data provider, so there is nothing
 * here to write an adapter against — an implementation would be a guess at a
 * response shape from a server nobody has seen.
 *
 * ── Why this one matters most, and why the gap is worth naming ─────────
 *
 * This was the source expected to carry the Pakistan-specific information:
 * local availability, PKR pricing, official distributor, warranty. Those are
 * exactly the fields Open EV Data does not have and cannot have, so this is the
 * gap in the whole pipeline rather than one missing source among four.
 *
 * The `fieldTrust` below is therefore set high for the Pakistani fields and zero
 * for the global engineering ones: whatever eventually fills this slot should
 * win on local price and availability and lose on battery chemistry. Encoding
 * that now means the priority system is already correct on the day a real source
 * arrives.
 *
 * ── What is needed ────────────────────────────────────────────────────
 *
 * The actual URL. If EVSpecsX is a private or pre-launch product, an API
 * endpoint and key. If the intended source was something else — a Pakistani
 * marketplace, a distributor price list, a PDF from an assembler — say which,
 * and this adapter can be pointed at it. A distributor's own published price
 * list would be a better source than any aggregator, and would need no crawler
 * at all.
 */
export const evspecsxAdapter = blockedAdapter({
  id: 'evspecsx',
  name: 'EVSpecsX',
  baseUrl: 'https://evspecsx.com',
  defaultTrust: 60,
  fieldTrust: {
    // Whatever fills this slot should be authoritative on Pakistan and silent
    // on global engineering figures.
    pakistanPrice: 95,
    availability: 95,
    officialDistributor: 95,
    warranty: 90,
    batteryWarranty: 90,
    priceCurrency: 95,
    batteryChemistry: 0,
    batteryVoltage: 0,
    realWorldRangeKm: 0,
  },
  reason:
    'No domain resolves (evspecsx.com, .io, .org, evspecs.com, ev-specs.com) and no repository is published under the name. The source could not be located, so its existence and access terms are unverified.',
  requires: [
    'the actual URL or API endpoint for EVSpecsX',
    'an API key, if it is a private or pre-launch product',
    'or the name of the intended Pakistan-specific source instead — a distributor price list would be stronger than any aggregator, and would need no crawler',
  ],
})

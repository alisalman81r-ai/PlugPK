// crawler/sources/vehdb.ts

import { blockedAdapter } from './types'

/**
 * VehDB
 *
 * ── What was actually checked, on 2026-08-25 ──────────────────────────
 *
 *   vehdb.com, vehdb.io, vehdb.org, veh-db.com   no DNS
 *   api.vehdb.com                                HTTP 200
 *   api.vehdb.com/robots.txt                     "User-agent: * / Allow: /"
 *   api.vehdb.com/v1/vehicles                    404
 *   api.vehdb.com/<nonsense>                     404  (so not a wildcard 200)
 *
 * The host that answers is a Laravel web application, not a data endpoint: it
 * returns HTML, sets an XSRF-TOKEN cookie, ships a full Content-Security-Policy,
 * and its own analytics payload declares `user_plan: 'guest'`. That is a
 * commercial product with accounts and paid tiers behind a sign-in.
 *
 * ── Why this is blocked ───────────────────────────────────────────────
 *
 * Three independent reasons, any one of which would be enough:
 *
 * 1. It responds with `x-robots-tag: noindex, nofollow`. The permissive
 *    robots.txt and that header contradict each other, and when an operator
 *    sends conflicting signals the restrictive one is the one to honour.
 *
 * 2. The data is behind an account. `user_plan: 'guest'` means the useful
 *    responses require authentication, and this phase's rules forbid working
 *    around a login wall.
 *
 * 3. The API surface is undocumented from outside. /v1/vehicles is a 404, and
 *    the honest way to find the real routes is to be given them, not to probe a
 *    stranger's server until something returns 200. Probing further would itself
 *    be the kind of behaviour that gets a crawler blocked, deservedly.
 *
 * The primary domain not resolving at all also leaves genuine doubt about
 * whether this is the "VehDB" that was meant. Worth confirming before anyone
 * spends money on it.
 *
 * ── What would unblock it ─────────────────────────────────────────────
 *
 * An account and an API key, plus the API documentation, plus written
 * confirmation that the plan permits storing and re-publishing specifications in
 * a commercial catalogue. Field trust is left at a modest default because
 * nothing about this source's accuracy has been verified.
 */
export const vehdbAdapter = blockedAdapter({
  id: 'vehdb',
  name: 'VehDB',
  baseUrl: 'https://api.vehdb.com',
  defaultTrust: 50,
  fieldTrust: {
    // Nothing is elevated. Trust is earned by verification, and none has
    // happened — the source has never returned a record to check.
    pakistanPrice: 0,
    availability: 0,
  },
  reason:
    'The primary domain does not resolve; api.vehdb.com is a plan-gated Laravel application serving HTML behind a sign-in, and it sets x-robots-tag: noindex, nofollow. Data access requires an account, the API surface is undocumented, and probing for endpoints is not an acceptable way to discover it.',
  requires: [
    'confirmation that api.vehdb.com is the intended "VehDB" — the primary domain does not resolve',
    'an account and API key',
    'the API documentation (route shapes, rate limits, pagination)',
    'written confirmation that the plan permits storing and re-publishing specs commercially',
  ],
})

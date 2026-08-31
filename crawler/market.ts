// crawler/market.ts
//
// Which brands this catalogue is about.
//
// ── Why a scope list exists at all ────────────────────────────────────
//
// Open EV Data is a global dataset of ~1,321 electric vehicles. This catalogue
// is the cars sold in Pakistan — 36 of them. Discovery works exactly as Phase 4
// specified: a car a source describes that the catalogue lacks becomes a
// CarCandidate, never a Car, and waits for a person. The trouble is arithmetic
// rather than correctness. Almost every record is a car that is not sold here
// and never will be, so a live run raises ~1,303 candidates that are
// individually valid and collectively unusable — and an operator who opens that
// queue once does not open it again.
//
// A Porsche Taycan is not a defect in the matcher and not a data-quality
// problem. It is simply not in scope, and saying so at the point of discovery
// is cheaper and more honest than asking somebody to reject it by hand.
//
// ── This file is data, not logic ──────────────────────────────────────
//
// The list below is a market judgement, and it is meant to be edited by a person
// when the market changes. It is not a heuristic, there is no scoring in it, and
// nothing here infers scope from a figure. If Audi begins selling here, the fix
// is one line in MARKET_BRANDS — not a change to how matching or identity works.
//
// Being out of scope is also deliberately NOT the same as being wrong. A record
// filtered here is recorded with a stated reason (see crawler/discover.ts), so a
// brand that was excluded can be found later and reconsidered. Nothing is
// deleted and nothing is silently dropped.
//
// ── What this must not become ─────────────────────────────────────────
//
// A gate on *identity*. Whether a record describes the same vehicle as a
// catalogue row is decided by crawler/identity.ts and crawler/match.ts, and
// neither should ever consult this file. Market scope answers "should we be
// tracking this car at all", which is a question asked before identity, once.

/**
 * Spellings a source may use for a brand the catalogue spells differently.
 *
 * Mirrors the intent of BRAND_ALIASES in crawler/match.ts, kept separate because
 * that one exists to match a record to a row and this one exists to decide
 * whether the record is in scope. Merging them would tie a market decision to
 * the matcher's internals.
 */
const BRAND_ALIASES: Record<string, string> = {
  byd: 'byd',
  gwm: 'gwm',
  'great wall': 'gwm',
  'great wall motors': 'gwm',
  haval: 'haval',
  changan: 'changan',
  deepal: 'deepal',
  'changan deepal': 'deepal',
  kia: 'kia',
  hyundai: 'hyundai',
  mg: 'mg',
  chery: 'chery',
  jaecoo: 'jaecoo',
  omoda: 'omoda',
  toyota: 'toyota',
  // The Seres 3 is sold here as a DFSK, which is the name on the catalogue row.
  seres: 'dfsk',
  dfsk: 'dfsk',
  xpeng: 'xpeng',
  dongfeng: 'dongfeng',
  // Riddara is the export name; Radar is the same marque in its home market.
  riddara: 'riddara',
  radar: 'riddara',
  // GUGO badges the Aion V locally.
  gugo: 'gugo',
  aion: 'gugo',
}

/**
 * A brand reduced to the key the catalogue uses.
 *
 * Returns '' for a brand that is absent or blank, which callers must treat as
 * "unknown", never as "out of scope" — a record with no brand at all is an
 * extraction problem, and discover.ts already refuses it before scope is
 * considered.
 */
export function marketBrandKey(brand: string | null | undefined): string {
  if (typeof brand !== 'string') return ''
  const key = brand.trim().toLowerCase()
  if (key.length === 0) return ''
  return BRAND_ALIASES[key] ?? key
}

/**
 * The brands the catalogue currently covers.
 *
 * Seventeen, matching the brands the 36 authored rows carry. Deliberately a
 * literal list rather than something derived from the Car table at runtime:
 * derived scope would silently widen the moment somebody added a car, which is
 * the opposite of a scope decision, and it would make a crawl's behaviour depend
 * on database state that changes underneath it.
 */
export const MARKET_BRANDS: ReadonlySet<string> = new Set([
  'byd',
  'chery',
  'dfsk',
  'deepal',
  'dongfeng',
  'forthing',
  'gugo',
  'gwm',
  'haval',
  'hyundai',
  'jaecoo',
  'kia',
  'mg',
  'omoda',
  'riddara',
  'toyota',
  'xpeng',
])

/**
 * True when a brand is known and outside the catalogue's market.
 *
 * Unknown-or-blank returns **false**, not true. The distinction matters: a
 * missing brand is a record we could not read, and treating that as
 * "out of market" would file an extraction failure under a market decision and
 * hide it. discover.ts refuses those separately, as unusable.
 */
export function isOutOfMarket(brand: string | null | undefined): boolean {
  const key = marketBrandKey(brand)
  if (key.length === 0) return false
  return !MARKET_BRANDS.has(key)
}

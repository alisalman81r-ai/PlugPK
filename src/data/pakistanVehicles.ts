// src/data/pakistanVehicles.ts

/**
 * The Pakistan EV / PHEV / EREV catalogue.
 *
 * This is the single source of truth for *which* electrified vehicles exist in
 * the Pakistani market. It deliberately holds identity only — brand, model,
 * powertrain, availability, body type — and no specifications. A range or a
 * charging figure is a promise to a driver planning a 400km trip, and a
 * plausible-looking invented number is worse than no number at all.
 *
 * Where the specs live
 * ────────────────────
 * MOCK_EV_MODELS in src/lib/mock-data.ts carries real figures (range, battery,
 * connectors, DC speed) for the ten cars the route planner does its maths
 * with. That is a spec overlay on this catalogue, not a competing list: each of
 * its entries names the catalogue id it describes, and
 * getVehicleSpecs()/getSpeccedVehicles() in src/lib/vehicles.ts join the two.
 * When a car here gains verified figures, it gets an entry there — nothing in
 * this file changes.
 *
 * Extending it (batteries, prices, images, variants)
 * ──────────────────────────────────────────────────
 * Add optional fields to `Vehicle`, or a parallel keyed table joined on `id`
 * the way the spec overlay already is. Both leave the rows below untouched,
 * which is the point of keeping identity and detail apart.
 *
 * How availability was assigned
 * ─────────────────────────────
 * `official` — sold through a local assembler or authorised distributor.
 * `imported` — routinely brought in by commercial importers; not a franchise.
 * `rare-import` — a handful in the country, one-off private imports.
 *
 * Where a source described a group as "official/imported" the stronger of the
 * two is used, since a franchise listing does not stop being one because grey
 * imports also exist. Nothing here is dated per-unit: the list reflects what
 * was present, sold or commonly imported as of 2026, and upcoming models are
 * out of scope by design.
 *
 * Body type note: the union below has no `wagon` member, so the Taycan Cross
 * and Sport Turismo are `other`. Widening the union later only means re-tagging
 * those two rows.
 *
 * Currently empty
 * ───────────────
 * Every brand and model was removed on request — first sixteen brands, then
 * the rest. The shape below is intact and the table, the helpers and the page
 * all still work against it; there is simply nothing in it. Git history holds
 * the 145 rows that were here if any of them are wanted back.
 */

export type Powertrain = 'BEV' | 'PHEV' | 'EREV'

export type Availability = 'official' | 'imported' | 'rare-import'

export type BodyType =
  | 'sedan'
  | 'suv'
  | 'crossover'
  | 'hatchback'
  | 'coupe'
  | 'convertible'
  | 'pickup'
  | 'van'
  | 'other'

export interface Vehicle {
  id: string
  brand: string
  model: string
  powertrain: Powertrain
  availability: Availability
  bodyType: BodyType
}

export const pakistanEVVehicles: Vehicle[] = [
  // Empty on request. Every brand and model that was here has been removed.
  //
  // The types above, the helpers in src/lib/vehicles.ts, the Vehicle table and
  // the /vehicles page all still work — they just have nothing to show, and say
  // so rather than pretending. Adding a row back here and re-running
  // `npm run db:seed` is all it takes to fill them again.
]

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
 * Brands deliberately absent
 * ──────────────────────────
 * Volkswagen, Volvo, Zeekr, XPeng, Land Rover, Lucid, Rivian, Genesis, MINI,
 * Lotus, Maserati, Ferrari, Lamborghini, Seres, JMEV and Alektra were listed
 * here and have been removed on request. Nothing references them any more —
 * they are gone from the table too, not just from this file — so re-adding one
 * means adding its rows back here and re-running the seed.
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
  // ─── BYD ──────────────────────────────────────────────────────────
  { id: 'byd-atto-2', brand: 'BYD', model: 'Atto 2', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'byd-atto-3', brand: 'BYD', model: 'Atto 3', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'byd-seal', brand: 'BYD', model: 'Seal', powertrain: 'BEV', availability: 'official', bodyType: 'sedan' },
  { id: 'byd-sealion-7', brand: 'BYD', model: 'Sealion 7', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'byd-dolphin', brand: 'BYD', model: 'Dolphin', powertrain: 'BEV', availability: 'imported', bodyType: 'hatchback' },
  { id: 'byd-han', brand: 'BYD', model: 'Han', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'byd-tang', brand: 'BYD', model: 'Tang', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'byd-sealion-6', brand: 'BYD', model: 'Sealion 6', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── MG ───────────────────────────────────────────────────────────
  { id: 'mg-zs-ev', brand: 'MG', model: 'ZS EV', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'mg-4', brand: 'MG', model: 'MG 4', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },
  { id: 'mg-5-ev', brand: 'MG', model: 'MG 5 EV', powertrain: 'BEV', availability: 'official', bodyType: 'sedan' },
  { id: 'mg-cyberster', brand: 'MG', model: 'Cyberster', powertrain: 'BEV', availability: 'imported', bodyType: 'convertible' },

  // ─── Deepal ───────────────────────────────────────────────────────
  { id: 'deepal-s07', brand: 'Deepal', model: 'S07', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'deepal-l07', brand: 'Deepal', model: 'L07', powertrain: 'BEV', availability: 'official', bodyType: 'sedan' },
  { id: 'deepal-sl03', brand: 'Deepal', model: 'SL03', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  // The S05 comes both ways, and a powertrain is one value per row, so it is
  // two rows rather than a "BEV/EREV" string no filter could read.
  { id: 'deepal-s05', brand: 'Deepal', model: 'S05', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'deepal-s05-erev', brand: 'Deepal', model: 'S05 EREV', powertrain: 'EREV', availability: 'imported', bodyType: 'suv' },

  // ─── Jaecoo ───────────────────────────────────────────────────────
  { id: 'jaecoo-j6', brand: 'Jaecoo', model: 'J6', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'jaecoo-j7-phev', brand: 'Jaecoo', model: 'J7 PHEV', powertrain: 'PHEV', availability: 'official', bodyType: 'suv' },

  // ─── Kia ──────────────────────────────────────────────────────────
  { id: 'kia-ev5', brand: 'Kia', model: 'EV5', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'kia-ev6', brand: 'Kia', model: 'EV6', powertrain: 'BEV', availability: 'official', bodyType: 'crossover' },
  { id: 'kia-ev9', brand: 'Kia', model: 'EV9', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'kia-niro-ev', brand: 'Kia', model: 'Niro EV', powertrain: 'BEV', availability: 'official', bodyType: 'crossover' },
  { id: 'kia-sorento-phev', brand: 'Kia', model: 'Sorento PHEV', powertrain: 'PHEV', availability: 'official', bodyType: 'suv' },

  // ─── Hyundai ──────────────────────────────────────────────────────
  { id: 'hyundai-ioniq-5', brand: 'Hyundai', model: 'Ioniq 5', powertrain: 'BEV', availability: 'imported', bodyType: 'crossover' },
  { id: 'hyundai-ioniq-6', brand: 'Hyundai', model: 'Ioniq 6', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'hyundai-kona-electric', brand: 'Hyundai', model: 'Kona Electric', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'hyundai-tucson-phev', brand: 'Hyundai', model: 'Tucson PHEV', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── ORA (GWM) ────────────────────────────────────────────────────
  { id: 'ora-03', brand: 'ORA', model: 'ORA 03', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },
  { id: 'ora-5', brand: 'ORA', model: 'ORA 5', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },

  // ─── Dongfeng ─────────────────────────────────────────────────────
  { id: 'dongfeng-box', brand: 'Dongfeng', model: 'Box', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },
  { id: 'dongfeng-vigo', brand: 'Dongfeng', model: 'Vigo', powertrain: 'BEV', availability: 'official', bodyType: 'pickup' },

  // ─── GUGO ─────────────────────────────────────────────────────────
  { id: 'gugo-gigi', brand: 'GUGO', model: 'GIGI', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },
  { id: 'gugo-box', brand: 'GUGO', model: 'Box', powertrain: 'BEV', availability: 'official', bodyType: 'hatchback' },
  { id: 'gugo-aion-v', brand: 'GUGO', model: 'AION V', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },

  // ─── BMW ──────────────────────────────────────────────────────────
  { id: 'bmw-i4', brand: 'BMW', model: 'i4', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'bmw-i5', brand: 'BMW', model: 'i5', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'bmw-i7', brand: 'BMW', model: 'i7', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'bmw-ix', brand: 'BMW', model: 'iX', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'bmw-ix1', brand: 'BMW', model: 'iX1', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'bmw-ix3', brand: 'BMW', model: 'iX3', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'bmw-xm', brand: 'BMW', model: 'XM', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── Mercedes-Benz ────────────────────────────────────────────────
  { id: 'mercedes-eqa', brand: 'Mercedes-Benz', model: 'EQA', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-eqb', brand: 'Mercedes-Benz', model: 'EQB', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-eqc', brand: 'Mercedes-Benz', model: 'EQC', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-eqe', brand: 'Mercedes-Benz', model: 'EQE', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'mercedes-eqe-suv', brand: 'Mercedes-Benz', model: 'EQE SUV', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-eqs', brand: 'Mercedes-Benz', model: 'EQS', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'mercedes-eqs-suv', brand: 'Mercedes-Benz', model: 'EQS SUV', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-g-580-eq', brand: 'Mercedes-Benz', model: 'G 580 with EQ Technology', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-c300e', brand: 'Mercedes-Benz', model: 'C300e', powertrain: 'PHEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'mercedes-e300e', brand: 'Mercedes-Benz', model: 'E300e', powertrain: 'PHEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'mercedes-s580e', brand: 'Mercedes-Benz', model: 'S580e', powertrain: 'PHEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'mercedes-glc300e', brand: 'Mercedes-Benz', model: 'GLC300e', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'mercedes-gle350de', brand: 'Mercedes-Benz', model: 'GLE350de', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── Tesla ────────────────────────────────────────────────────────
  { id: 'tesla-model-3', brand: 'Tesla', model: 'Model 3', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'tesla-model-y', brand: 'Tesla', model: 'Model Y', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'tesla-model-s', brand: 'Tesla', model: 'Model S', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'tesla-model-x', brand: 'Tesla', model: 'Model X', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'tesla-cybertruck', brand: 'Tesla', model: 'Cybertruck', powertrain: 'BEV', availability: 'imported', bodyType: 'pickup' },

  // ─── Audi ─────────────────────────────────────────────────────────
  { id: 'audi-e-tron', brand: 'Audi', model: 'e-tron', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'audi-q4-e-tron', brand: 'Audi', model: 'Q4 e-tron', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'audi-q8-e-tron', brand: 'Audi', model: 'Q8 e-tron', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'audi-e-tron-gt', brand: 'Audi', model: 'e-tron GT', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'audi-rs-e-tron-gt', brand: 'Audi', model: 'RS e-tron GT', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'audi-q6-e-tron', brand: 'Audi', model: 'Q6 e-tron', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'audi-q5-tfsi-e', brand: 'Audi', model: 'Q5 TFSI e', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'audi-q7-tfsi-e', brand: 'Audi', model: 'Q7 TFSI e', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── Porsche ──────────────────────────────────────────────────────
  { id: 'porsche-taycan', brand: 'Porsche', model: 'Taycan', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'porsche-taycan-cross-turismo', brand: 'Porsche', model: 'Taycan Cross Turismo', powertrain: 'BEV', availability: 'imported', bodyType: 'other' },
  { id: 'porsche-taycan-sport-turismo', brand: 'Porsche', model: 'Taycan Sport Turismo', powertrain: 'BEV', availability: 'imported', bodyType: 'other' },
  { id: 'porsche-macan-electric', brand: 'Porsche', model: 'Macan Electric', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'porsche-cayenne-e-hybrid', brand: 'Porsche', model: 'Cayenne E-Hybrid', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'porsche-cayenne-s-e-hybrid', brand: 'Porsche', model: 'Cayenne S E-Hybrid', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'porsche-panamera-e-hybrid', brand: 'Porsche', model: 'Panamera E-Hybrid', powertrain: 'PHEV', availability: 'imported', bodyType: 'sedan' },

  // ─── Hummer ───────────────────────────────────────────────────────
  { id: 'hummer-ev-pickup', brand: 'Hummer', model: 'EV Pickup', powertrain: 'BEV', availability: 'imported', bodyType: 'pickup' },
  { id: 'hummer-ev-suv', brand: 'Hummer', model: 'EV SUV', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },

  // ─── Rolls-Royce ──────────────────────────────────────────────────
  { id: 'rolls-royce-spectre', brand: 'Rolls-Royce', model: 'Spectre', powertrain: 'BEV', availability: 'rare-import', bodyType: 'coupe' },
  { id: 'rolls-royce-spectre-black-badge', brand: 'Rolls-Royce', model: 'Spectre Black Badge', powertrain: 'BEV', availability: 'rare-import', bodyType: 'coupe' },

  // ─── Jaguar ───────────────────────────────────────────────────────
  { id: 'jaguar-i-pace', brand: 'Jaguar', model: 'I-Pace', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },

  // ─── Lexus ────────────────────────────────────────────────────────
  { id: 'lexus-ux-300e', brand: 'Lexus', model: 'UX 300e', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'lexus-rz', brand: 'Lexus', model: 'RZ', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'lexus-nx-450h-plus', brand: 'Lexus', model: 'NX 450h+', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'lexus-rx-450h-plus', brand: 'Lexus', model: 'RX 450h+', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── Toyota ───────────────────────────────────────────────────────
  { id: 'toyota-bz4x', brand: 'Toyota', model: 'bZ4X', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },
  { id: 'toyota-bz3', brand: 'Toyota', model: 'bZ3', powertrain: 'BEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'toyota-prius-prime', brand: 'Toyota', model: 'Prius Prime', powertrain: 'PHEV', availability: 'imported', bodyType: 'sedan' },
  { id: 'toyota-rav4-phev', brand: 'Toyota', model: 'RAV4 PHEV', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },
  { id: 'toyota-harrier-phev', brand: 'Toyota', model: 'Harrier PHEV', powertrain: 'PHEV', availability: 'imported', bodyType: 'suv' },

  // ─── Nissan ───────────────────────────────────────────────────────
  { id: 'nissan-leaf', brand: 'Nissan', model: 'Leaf', powertrain: 'BEV', availability: 'imported', bodyType: 'hatchback' },
  { id: 'nissan-ariya', brand: 'Nissan', model: 'Ariya', powertrain: 'BEV', availability: 'imported', bodyType: 'suv' },

  // ─── Omoda (Chery) ────────────────────────────────────────────────
  { id: 'omoda-e5', brand: 'Omoda', model: 'E5', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },

  // ─── Forthing ─────────────────────────────────────────────────────
  { id: 'forthing-friday', brand: 'Forthing', model: 'Friday', powertrain: 'BEV', availability: 'official', bodyType: 'suv' },
  { id: 'forthing-friday-reev', brand: 'Forthing', model: 'Friday REEV', powertrain: 'EREV', availability: 'official', bodyType: 'suv' },

]
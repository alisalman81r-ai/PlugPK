// src/data/cars.ts

/**
 * The Pakistan EV / PHEV / REEV car database.
 *
 * One authored, reviewable source for every electrified car on sale here, with
 * the figures a buyer actually compares on: price, battery, range, power,
 * charging speeds and — for the ones that still burn something — engine size.
 *
 * Two rules govern every row, and they are why several fields are null:
 *
 *   1. Nothing is invented. A figure appears here only if it was supplied. A
 *      missing DC speed is `null`, never a plausible number, because a buyer
 *      reads these as facts about a car they are about to spend crores on.
 *   2. Nothing is silently converted. Prices are stored in rupees as integers
 *      and carry the original wording in `price.display`, so "1.0649 Cr" is
 *      still recognisable next to the 10,649,000 the filters sort on.
 *
 * Ranges quoted as a span keep both ends — `range` is the low figure and
 * `rangeMax` the high one — rather than being flattened to an average nobody
 * published. `notes` carries anything the source said imprecisely, such as the
 * Omoda 7's "90+ km", so the qualifier survives instead of being rounded away.
 *
 * Images: 25 of the 28 have a photograph in /public/images/cars/, fetched from
 * Wikimedia Commons under a CC or public-domain licence by
 * scripts/fetch-car-images.mjs. Most are CC BY-SA, which requires the
 * photographer to be credited, so src/data/carImageCredits.ts holds the
 * attribution and the detail page prints it beneath the photo.
 *
 * Three are null — the Forthing Friday (both versions) and the Dongfeng 007,
 * which Commons has no photograph of. PhotoFrame renders a fallback for a null
 * source, so those cost a placeholder rather than a broken <img>. Drop a
 * licensed file into that directory and set the path here to fill one in.
 *
 * Scaling: this is a plain module, typed and diffable, and the shape below is
 * open. Adding torque, seats, dimensions or a warranty means adding a field,
 * not restructuring — and src/lib/cars.ts is the only place that reads it, so
 * a move to the database later touches one file.
 *
 * ── Provenance, and the rows marked "indicative" ──────────────────────
 *
 * The first 28 rows came from a supplied price list, which is why their figures
 * are exact and their gaps are null.
 *
 * The rows after them close two holes in that list: the Hybrid category, which
 * was empty even though full hybrids are the biggest electrified segment on sale
 * in Pakistan, and a handful of EVs and PHEVs the list missed. Their engineering
 * figures — battery, power, engine, electric range — are the manufacturer's
 * published specifications for the model.
 *
 * Their PKR prices are not from a price list, and they say so: every one carries
 * "(indicative)" inside `price.display`. That string is printed verbatim on the
 * card, in the comparison and on the detail page, so the caveat travels with the
 * number to every surface instead of sitting in a footnote on one of them.
 * Pakistani prices move with the budget, the exchange rate and each assembler's
 * own revisions, so these need checking against the dealer's current list before
 * this page is published. Rule 1 still holds inside each row: where a figure was
 * not published for a model, it is null rather than estimated.
 *
 * A full hybrid has no plug. For those rows `dcCharging`, `acCharging` and
 * `connector` are null — not zero — and `notes` says why, because a buyer
 * comparing a Corolla Cross HEV against an Atto 3 needs to know the first one
 * cannot be charged at all rather than that its charging speed is unknown.
 */

export type CarCategory = 'EV' | 'PHEV' | 'REEV' | 'Hybrid'

export type ConnectorStandard = 'CCS2' | 'Type 2' | 'GB/T' | 'CHAdeMO'

export interface CarPrice {
  /** Rupees. Equal to `max` when a car has a single published price. */
  min: number
  max: number
  /** As published, e.g. "PKR 1.33–1.70 Cr". Never recomputed from min/max. */
  display: string
}

export interface Car {
  id: string
  slug: string
  brand: string
  model: string

  /**
   * The trim this row describes, or null.
   *
   * Added in Phase 4.1 (see the column comment in prisma/schema.prisma) and made
   * public here so a declared trim survives to the page. Before this the field
   * existed in the database and was rendered only in the admin portal, so the
   * catalogue, the detail page, the comparison and the SEO strings could not show
   * it — which is why the three suggested model/variant splits were held: they
   * would have moved the trim out of `model`, and `model` is the public h1, the
   * breadcrumb and the card title, so the trim would simply have disappeared.
   *
   * **`null` means "this row declares no variant". It never means "any variant".**
   * That distinction is load-bearing for the matcher — a variant-sensitive figure
   * from a variant-declaring source is refused against a row that declares none —
   * so the field is required rather than optional. An optional field would admit a
   * third state, `undefined`, meaning "nobody considered it", and blurring that
   * into "declares none" is exactly the ambiguity Phase 4.1 exists to remove.
   *
   * Nothing infers this. It is not derived from `model`, from a crawl date, or
   * from a figure that happens to match a trim. All 36 authored rows below state
   * `null` explicitly, and the one row that declares a variant does so in the
   * database, set deliberately by scripts/declare-variant-identity.ts.
   */
  variant: string | null

  fullName: string
  category: CarCategory

  price: CarPrice

  /** Usable battery in kWh. Null where none was published. */
  batteryCapacity: number | null
  batteryUnit: 'kWh'

  /** Full-charge driving range for an EV, in km. */
  range: number | null
  /** The upper figure when the range was quoted as a span. */
  rangeMax: number | null
  rangeUnit: 'km'

  /** Electric-only range for a PHEV or REEV, in km. */
  electricRange: number | null
  electricRangeMax: number | null

  power: number | null
  powerUnit: 'hp'

  /** 0–100 km/h. */
  acceleration: number | null
  accelerationUnit: 'sec'

  dcCharging: number | null
  dcChargingUnit: 'kW'
  acCharging: number | null
  acChargingUnit: 'kW'

  /** Null where the source did not state the standard. */
  connector: ConnectorStandard[] | null

  /** Petrol engine displacement in cc, for PHEVs and REEVs. */
  engineCapacity: number | null

  // ── Not supplied for any car yet. Present so the detail page and the
  //    comparison can render them the moment they are, without a refactor.
  torque: number | null
  topSpeed: number | null
  seats: number | null

  /**
   * ── The rest of the spec sheet ──────────────────────────────────────
   *
   * A researched car has about thirty-five facts; the fields above are fourteen
   * of them. These are the remainder, so a detail page can render a real spec
   * sheet instead of a paragraph of prose in `notes`.
   *
   * **Optional, not required-and-nullable — deliberately, and unlike `variant`.**
   * `variant: string | null` is required because there the distinction carries
   * meaning: null asserts "this row declares no variant" and the matcher acts on
   * it, so `undefined` would be a third state that blurs a load-bearing fact.
   * Nothing gates on whether a wheelbase is absent or unconsidered, so requiring
   * all thirty-six rows to write out twenty-one explicit nulls would add seven
   * hundred lines of noise and hide the rows that do carry data.
   *
   * Same rule as everything else here: present only if a source stated it.
   * Spans keep both ends — ground clearance quoted 145-170 mm, consumption
   * 19-21 kWh/100km — because averaging invents a figure nobody published.
   */
  bodyType?: string | null
  driveType?: string | null
  /** Motor output in kW. `power` above stays the hp figure the cards show. */
  motorPowerKw?: number | null
  modelYear?: number | null
  /** Which cycle produced `range`, e.g. 'CLTC'. Null when unproven. */
  rangeStandard?: string | null
  /** What owners report, as against what a test cycle produced. */
  realWorldRange?: number | null
  realWorldRangeMax?: number | null
  /** kWh per 100 km. */
  consumption?: number | null
  consumptionMax?: number | null
  /** Hours for a full AC charge; minutes for 10-80% on DC. */
  acChargingHours?: number | null
  dcChargingMinutes?: number | null
  /** Cell chemistry and pack name, e.g. 'BYD Blade Battery (LFP)'. */
  batteryTech?: string | null

  lengthMm?: number | null
  widthMm?: number | null
  heightMm?: number | null
  wheelbaseMm?: number | null
  groundClearanceMm?: number | null
  groundClearanceMaxMm?: number | null
  bootCapacityL?: number | null
  kerbWeightKg?: number | null

  /** Pakistan market facts: sentences a person wrote after checking. */
  availability?: string | null
  distributor?: string | null
  warranty?: string | null

  /** Path under /public. Null until a real file exists. */
  image: string | null

  /** A qualifier the source carried that a number alone would lose. */
  notes: string | null
}

const LAKH = 100_000
const CRORE = 10_000_000

/** Written as published figures so a row reads like the source it came from. */
const lakh = (value: number) => Math.round(value * LAKH)
const crore = (value: number) => Math.round(value * CRORE)

export const cars: Car[] = [
  // ─── EV ───────────────────────────────────────────────────────────
  {
    /*
      Filled out for the 2026 model year. Two supplied figures were NOT written
      into their fields, and both are conflicts rather than gaps:

      `acCharging` stays 7 kW and `dcCharging` stays 65 kW. Those are the price
      list's exact figures — this is one of the first 28 rows, whose "figures are
      exact" per the header. The 2026 research quotes "about 6.6 kW" and "about
      82 kW", both hedged, and an approximate figure does not displace an exact
      one. Both alternatives are named in `notes`.
    */
    id: 'byd-atto-2',
    slug: 'byd-atto-2',
    brand: 'BYD',
    model: 'Atto 2',
    // Mega Motor Company sells one trim of this car, so the row describes one
    // car and can say which.
    variant: 'Premium',
    fullName: 'BYD Atto 2',
    category: 'EV',
    // Unchanged: PKR 7,290,000.
    price: { min: lakh(72.9), max: lakh(72.9), display: 'PKR 72.9 Lakh' },
    batteryCapacity: 45.12,
    batteryUnit: 'kWh',
    range: 380,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // 174 hp is what the stated 130 kW converts to. Some listings say 177 hp;
    // in `notes`, not averaged.
    power: 174,
    powerUnit: 'hp',
    acceleration: 7.9,
    accelerationUnit: 'sec',
    dcCharging: 65,
    dcChargingUnit: 'kW',
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 290,
    topSpeed: 160,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Subcompact crossover SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: 130,
    /*
      NEDC, and the alternatives do not sit together sensibly: other sources
      quote 420 km WLTP and 323 km. A WLTP figure ABOVE an NEDC figure for the
      same car is the wrong way round — WLTP is the stricter cycle — so the 420
      is recorded in `notes` as suspect rather than stored as a maximum.
    */
    rangeStandard: 'NEDC',
    realWorldRange: 300,
    realWorldRangeMax: 350,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 8,
    // The published 10-80% figure is about 38 minutes, which is the window this
    // column means. A separate 30-80% figure of 28-38 minutes is in `notes`.
    dcChargingMinutes: 38,
    batteryTech: 'BYD Blade Battery (LFP)',
    lengthMm: 4310,
    widthMm: 1830,
    heightMm: 1675,
    wheelbaseMm: 2620,
    groundClearanceMm: 150,
    groundClearanceMaxMm: null,
    // Seats up. 1320 L with them down, per some listings — in `notes`.
    bootCapacityL: 400,
    // Quoted as about 1550 kg; other listings say 1430-1540 kg. See `notes`.
    kerbWeightKg: 1550,
    availability: 'On sale; launched January 2026, booking about 1,400,000.',
    distributor: 'Mega Motor Company (BYD Pakistan)',
    warranty: 'Battery 8 years / 160,000 km; vehicle 6 years / 150,000 km.',

    image: '/images/cars/byd-atto-2.jpg',
    notes:
      'BYD Atto 2 Premium. 45.12 kWh Blade LFP, 130 kW / 174 hp (some listings say 177 hp), ' +
      '290 Nm, FWD, 7.9 s 0–100, 160 km/h. 380 km NEDC is stored. RANGE CYCLES DISAGREE AND ' +
      'ONE IS SUSPECT: other sources quote 420 km WLTP and 323 km, and a WLTP figure above an ' +
      'NEDC figure for the same car is the wrong way round, so 420 km is not treated as a ' +
      'maximum. About 300–350 km is the realistic expectation. CHARGING RATES DISAGREE: the ' +
      '7 kW AC and 65 kW DC figures stored above come from the price list; the 2026 research ' +
      'quotes about 6.6 kW AC and about 82 kW DC, both approximate, so the exact figures were ' +
      'kept — confirm with the dealer. A full AC charge takes about 8 hours either way; DC ' +
      '10–80% takes about 38 minutes, and a separate 30–80% figure of 28–38 minutes is also ' +
      'published. CCS2 and Type 2, with V2L. 4310×1830×1675 mm, wheelbase 2620 mm, ground ' +
      'clearance about 150 mm, boot 400 L seats up and 1320 L seats down per some listings, ' +
      'kerb about 1550 kg though other listings say 1430–1540 kg. 5 seats, 12.8-inch rotating ' +
      'screen, 8 speakers, 6 airbags, level 2 driver assistance. PKR 7,290,000 with booking ' +
      '1,400,000. Mega Motor Company. Consumption was not published.',
  },
  {
    /*
      Filled out for the 2026 model year from a researched column list. This row
      previously carried price, battery, range, power and connector only.

      Two changes a reviewer should look at rather than skim:

      `range` moves from 430 to 353, which reads as a downgrade and is not one.
      430 km is the CLTC figure and 353 km is the WLTP figure for the same car,
      and this row now names the cycle in `rangeStandard`, so the stored number
      has to be the one that cycle produced. WLTP is the primary figure and the
      more conservative of the two; 430 CLTC is in `notes`. They are not a span,
      so `rangeMax` stays null — two cycles measuring one car is not a range.

      `model` stays 'Vigo' rather than becoming 'VIGO' as the distributor styles
      it. `model` is a stored column the matcher compares as published (see
      src/lib/cars.ts), so restyling it is a pipeline change dressed as a
      typographic one, and the gain is nil.
    */
    id: 'dongfeng-vigo',
    slug: 'dongfeng-vigo',
    brand: 'Dongfeng',
    model: 'Vigo',
    // Two trims, E1 and E2, which differ on price and equipment rather than on
    // any figure below. A lineup declares no variant — see the batch comment on
    // the 2026 imports at the end of this file.
    variant: null,
    fullName: 'Dongfeng Vigo',
    category: 'EV',
    // E1 6,999,000 / E2 7,499,000. Booking is quoted at 1,200,000.
    price: { min: lakh(69.99), max: lakh(74.99), display: 'PKR 69.99–74.99 Lakh' },
    // Published as 44.94 kWh and rounded to "45 kWh" in marketing. The exact
    // figure is kept.
    batteryCapacity: 44.94,
    batteryUnit: 'kWh',
    range: 353,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 161,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 60,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    // CCS2 handles both AC and DC on this car; no separate Type 2 inlet is
    // stated, so Type 2 is not claimed.
    connector: ['CCS2'],
    engineCapacity: null,
    torque: 230,
    topSpeed: 150,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: 120,
    rangeStandard: 'WLTP',
    realWorldRange: 300,
    realWorldRangeMax: 350,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 6,
    // Published as 0-80% in about 30 minutes, not the 10-80% window this column
    // renders. The figure is in `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    lengthMm: 4306,
    widthMm: 1868,
    heightMm: 1654,
    wheelbaseMm: 2715,
    groundClearanceMm: 175,
    groundClearanceMaxMm: null,
    bootCapacityL: 500,
    kerbWeightKg: null,
    availability: 'On sale; launched January 2026 with deliveries from February 2026.',
    distributor: 'Chawla Green Motors (Dongfeng Pakistan)',
    warranty: 'Battery warranted 8 years / 160,000 km per one source — confirm with the dealer.',

    image: '/images/cars/dongfeng-vigo.jpg',
    notes:
      'Dongfeng Vigo, styled VIGO by the distributor and sold globally as the Nammi 06. Two ' +
      'trims: E1 at PKR 6,999,000 and E2 at PKR 7,499,000, booking 1,200,000. 44.94 kWh LFP ' +
      '(marketed as 45 kWh), 161 hp / 120 kW, 230 Nm, FWD, 150 km/h. RANGE IS QUOTED ON TWO ' +
      'CYCLES: 353 km WLTP, which is what is stored, and 430 km CLTC. They measure the same ' +
      'car, so they are not a span and no maximum is recorded. Roughly 300–350 km is the ' +
      'realistic expectation. AC 6.6 kW taking about 6 hours; DC 60 kW covering 0–80% in ' +
      'about 30 minutes, a different window from the 10–80% this catalogue normally shows. ' +
      'CCS2 for both AC and DC. 4306×1868×1654 mm, wheelbase 2715 mm, ground clearance about ' +
      '175 mm, 500 L boot, 5 seats. 17-inch alloys, 12.8-inch touchscreen, 540-degree camera, ' +
      'level 2 driver assistance, 6 airbags. Battery warranty 8 years / 160,000 km per one ' +
      'source and needs confirming. Sold by Chawla Green Motors. 0–100 km/h, consumption and ' +
      'kerb weight are unpublished.',
  },
  {
    /*
      Filled out for the 2026 model year across three variants, and two supplied
      figures were left out of their fields on purpose.

      `dcCharging` is null. The supplied column says "about 80 kW (est.)" and an
      estimate is not a specification — this file's first rule. The estimate, and
      the estimated 30-40 minute charge window, are both in `notes` labelled as
      estimates.

      `power` and `motorPowerKw` are 184 hp / 137 kW. The supplied data gives two
      self-consistent pairs — 135 kW ≈ 181 hp, which is what this row carried
      before, and 137 kW ≈ 184 hp, which its own per-variant table states twice.
      The per-variant table is the more specific source, so that pair is stored
      whole. Mixing 184 hp with 135 kW would produce a pairing no source
      published.

      The row previously carried the Comfort's 49.9 kWh battery against the
      Luxury's 426 km range. `range` is now the Comfort's 329 km, so battery,
      power, torque, 0–100 and range all describe the car at `price.min`.
    */
    id: 'jaecoo-j6',
    slug: 'jaecoo-j6',
    brand: 'JAECOO',
    model: 'J6',
    // Three variants: Comfort RWD, Luxury RWD and Premium AWD. A lineup
    // declares no variant — null asserts "declares no variant", which is what
    // keeps a variant-sensitive crawled figure from landing on a row that
    // cannot say which trim it describes.
    variant: null,
    fullName: 'JAECOO J6',
    category: 'EV',
    // Comfort 8,799,000 / Luxury 9,899,000 / Premium AWD 10,799,000.
    price: { min: lakh(87.99), max: crore(1.0799), display: 'PKR 87.99 Lakh – 1.08 Cr' },
    // Comfort's pack, matching price.min. Luxury 65.6 kWh, Premium AWD 69.7 kWh.
    batteryCapacity: 49.9,
    batteryUnit: 'kWh',
    range: 329,
    rangeMax: 462,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 184,
    powerUnit: 'hp',
    // Comfort/Luxury RWD. The Premium AWD does 6.5 s.
    acceleration: 10.5,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    // RWD figure. The Premium AWD makes 385 Nm.
    torque: 220,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Boxy off-road SUV (5-door)',
    driveType: 'RWD / AWD',
    motorPowerKw: 137,
    // NEDC. Some listings also give a 364 km WLTP figure for the AWD — in
    // `notes`.
    rangeStandard: 'NEDC',
    realWorldRange: null,
    realWorldRangeMax: null,
    // 15.2 kWh/100 km on the Comfort rising to 19.0 on the Premium AWD, which is
    // a genuine span across the three variants rather than two rival claims.
    consumption: 15.2,
    consumptionMax: 19,
    acChargingHours: 9,
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    lengthMm: 4406,
    widthMm: 1910,
    heightMm: 1715,
    wheelbaseMm: 2715,
    groundClearanceMm: 175,
    groundClearanceMaxMm: null,
    bootCapacityL: 450,
    kerbWeightKg: null,
    availability: 'On sale; launched August 2025.',
    distributor: 'NexGen Auto (Nishat Group) — JAECOO Pakistan',
    warranty: 'Vehicle 6 years / 150,000 km; battery 8 years / 160,000 km.',

    image: '/images/cars/jaecoo-j6.png',
    notes:
      'JAECOO J6 in three variants. Comfort RWD: 49.9 kWh, 137 kW / 184 hp, 220 Nm, 329 km ' +
      'NEDC, 10.5 s 0–100, 15.2 kWh/100 km, PKR 8,799,000. Luxury RWD: 65.6 kWh, same motor, ' +
      '426–462 km, 17.9 kWh/100 km, PKR 9,899,000. Premium AWD: 69.7 kWh, 205 kW / 279 hp, ' +
      '385 Nm, 418 km, 6.5 s, 19.0 kWh/100 km, PKR 10,799,000. Battery, power, torque, 0–100 ' +
      'and range above are the Comfort\'s, matching the lowest price; the maximum range is the ' +
      'Luxury\'s. MOTOR OUTPUT DISAGREES BY SOURCE: 137 kW / 184 hp is stored because the ' +
      'per-variant table states it, while other listings say 135 kW / 181 hp — the two pairs ' +
      'are each internally consistent and neither is mixed with the other. Some listings also ' +
      'quote a 364 km WLTP figure for the AWD. DC CHARGING IS UNPUBLISHED: about 80 kW and a ' +
      '30–40 minute charge are both estimates rather than published figures, so neither is ' +
      'stored. AC 6.6 kW taking about 9 hours. CCS2 and Type 2, with 3.3 kW V2L. ' +
      '4406×1910×1715 mm, wheelbase 2715 mm, ground clearance 175 mm, 450 L boot, 5 seats, ' +
      '180 km/h. NexGen Auto (Nishat Group). Warranty 6 years / 150,000 km on the vehicle and ' +
      '8 years / 160,000 km on the battery. Kerb weight and a real-world range were not ' +
      'published.',
  },
  {
    /*
      Filled out for the 2026 model year. THE HELD VARIANT SPLIT IS STILL HELD:
      the trim stays inside `model` as 'Atto 3 Advanced' and `variant` stays
      null. Nothing here moves it into the variant column.

      `acceleration` is 7.9, not 7.3. Both figures are published; 7.9 is the one
      the supplied column marks as primary and it is the more conservative, so
      7.3 is recorded in `notes` rather than averaged with it.

      The supplied notes string for this car contained a corrupted fragment
      ("~8.5 kg... (see value)") where the 0–100 figure should have been. It is
      not reproduced below — a garbled token in a field a buyer reads is worse
      than a gap.
    */
    id: 'byd-atto-3-advanced',
    slug: 'byd-atto-3-advanced',
    brand: 'BYD',
    model: 'Atto 3 Advanced',
    /*
      Null, and deliberately so.

      The supplied column says "Advanced/Advance", but this row already carries
      the trim inside `model`, so declaring it again would render "BYD Atto 3
      Advanced Advanced" on the card, the h1 and the breadcrumb. Splitting the
      trim out of `model` is the change that was held, and it stays held.
    */
    variant: null,
    fullName: 'BYD Atto 3 Advanced',
    category: 'EV',
    // Unchanged: PKR 8,990,000.
    price: { min: lakh(89.9), max: lakh(89.9), display: 'PKR 89.9 Lakh' },
    batteryCapacity: 49.92,
    batteryUnit: 'kWh',
    range: 410,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 201,
    powerUnit: 'hp',
    acceleration: 7.9,
    accelerationUnit: 'sec',
    /*
      Null. The published DC figure is "30-80% in about 30 minutes" with no kW
      rating attached, and back-calculating a rate from the pack and the time
      would be arithmetic rather than a specification. The window is in `notes`.
    */
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as "about 7 kW".
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 310,
    topSpeed: 160,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: 150,
    // 410 km is the NEDC figure. A 480 km WLTP figure is published elsewhere and
    // is in `notes`; the two are cycles, not a span, so `rangeMax` stays null.
    rangeStandard: 'NEDC',
    realWorldRange: 350,
    realWorldRangeMax: 400,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 9,
    // Published as 30-80% in about 30 minutes, a different window from the
    // 10-80% this column renders. In `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'BYD Blade Battery (LFP)',
    lengthMm: 4455,
    widthMm: 1875,
    heightMm: 1615,
    wheelbaseMm: 2720,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: 555,
    kerbWeightKg: 1750,
    availability: 'On sale; the first BYD model launched in Pakistan.',
    distributor: 'Mega Motor Company (BYD Pakistan)',
    warranty: 'Battery 8 years / 160,000 km — confirm the vehicle term with the dealer.',

    image: '/images/cars/byd-atto-3-advanced.jpg',
    notes:
      'BYD Atto 3 Advanced. 49.92 kWh Blade LFP, 150 kW / 201 hp, 310 Nm, FWD, 160 km/h. ' +
      'RANGE CYCLES DISAGREE: 410 km NEDC is stored and about 480 km WLTP is published ' +
      'elsewhere; they measure the same car on different cycles, so they are not a span and ' +
      'no maximum is recorded. About 350–400 km is the realistic expectation. 0–100 KM/H ' +
      'DISAGREES: 7.9 s is stored as the primary figure and some sources say 7.3 s. AC about ' +
      '7 kW taking around 9 hours. DC charging reaches 30–80% in about 30 minutes, but no kW ' +
      'rating was published, so the DC speed is blank rather than back-calculated, and the ' +
      '30–80% window is not the 10–80% this catalogue normally shows. CCS2 and Type 2. ' +
      '4455×1875×1615 mm, wheelbase 2720 mm, boot 555 L, kerb 1750 kg, 5 seats, 6 airbags, ' +
      'rotating touchscreen quoted between 12.8 and 15.6 inches by different sources. Ground ' +
      'clearance was not published. PKR 8,990,000. Mega Motor Company. The trim is carried in ' +
      'the model name rather than the variant field: the variant split for this row is held.',
  },
  {
    /*
      Filled out for the 2026 model year. Price is unchanged at PKR 8,990,000.
    */
    id: 'omoda-e5',
    slug: 'omoda-e5',
    brand: 'Omoda',
    model: 'E5',
    // NexGen sells one trim of this car, so the row describes one car and can
    // say which.
    variant: 'Lux',
    fullName: 'Omoda E5',
    category: 'EV',
    price: { min: lakh(89.9), max: lakh(89.9), display: 'PKR 89.9 Lakh' },
    batteryCapacity: 61,
    batteryUnit: 'kWh',
    range: 430,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 204,
    powerUnit: 'hp',
    // Not published for this car by any source found.
    acceleration: null,
    accelerationUnit: 'sec',
    /*
      Null. The published DC figure is "30-80% in about 35 minutes" with no kW
      rating, and deriving a rate from the pack and the time would be arithmetic.
      The window is in `notes`.
    */
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as "about 7 kW".
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 340,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Crossover SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: 150,
    // 430 km is the WLTP figure. A 505 km NEDC figure is published for the same
    // car and is in `notes`; two cycles are not a span, so `rangeMax` is null.
    rangeStandard: 'WLTP',
    realWorldRange: 380,
    realWorldRangeMax: 420,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 9,
    // Published as 30-80% in about 35 minutes, a different window from the
    // 10-80% this column renders. In `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    lengthMm: 4424,
    widthMm: 1830,
    heightMm: 1588,
    wheelbaseMm: 2630,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: 380,
    kerbWeightKg: 1710,
    availability: 'On sale; launched August 2025, with a limited-time offer price.',
    distributor: 'NexGen Auto (Omoda Pakistan)',
    /*
      Stated as typical rather than confirmed, because that is how it was
      supplied. Writing "6 years / 150,000 km" flat would present a class-typical
      term as this car's warranty.
    */
    warranty:
      'Typically 6 years / 150,000 km on the vehicle and 8 years / 160,000 km on the battery, but not confirmed for this car — check the dealer\'s terms.',

    image: '/images/cars/omoda-e5.jpg',
    notes:
      'Omoda E5 Lux. 61 kWh LFP, 150 kW / 204 hp, 340 Nm, FWD, 180 km/h. 430 km WLTP is ' +
      'stored; a 505 km NEDC figure is published for the same car, and because they are two ' +
      'cycles rather than a span no maximum is recorded. About 380–420 km is the realistic ' +
      'expectation. AC about 7 kW taking around 9 hours. DC charging reaches 30–80% in about ' +
      '35 minutes, but no kW rating was published, so the DC speed is blank rather than ' +
      'back-calculated, and the 30–80% window is not the 10–80% this catalogue normally ' +
      'shows. CCS2 and Type 2. 4424×1830×1588 mm, wheelbase 2630 mm, boot 380 L, kerb ' +
      '1710 kg, 5 seats, 215/55 R18. PKR 8,990,000, sold at a limited-time offer price. ' +
      'NexGen Auto. 0–100 km/h, ground clearance and consumption were not published, and the ' +
      'warranty terms above are class-typical rather than confirmed for this car.',
  },
  {
    id: 'forthing-friday-bev',
    slug: 'forthing-friday-bev',
    brand: 'Forthing',
    model: 'Friday BEV',
    variant: null,
    fullName: 'Forthing Friday BEV',
    category: 'EV',
    price: { min: lakh(89.99), max: lakh(89.99), display: 'PKR 89.99 Lakh' },
    batteryCapacity: 64.4,
    batteryUnit: 'kWh',
    range: 500,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 201,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: null,
    topSpeed: null,
    seats: null,
    image: null,
    notes: null,
  },
  {
    id: 'mg-zs-ev',
    slug: 'mg-zs-ev',
    brand: 'MG',
    model: 'ZS EV',
    variant: null,
    fullName: 'MG ZS EV',
    category: 'EV',
    /*
      Two cars behind one row, resolved by letting the entry trim set the
      headline and the top trim set the maximums.

      MG Pakistan sells the ZS EV in two trims that differ in the two fields a
      buyer compares hardest: MCE Essence is 51.1 kWh / 174 hp / 360 km at
      PKR 9,690,000, and MCE Long Range is 72.6 kWh / 154 hp / 505 km at
      PKR 14,999,000. (The larger pack having the lower output is unusual and is
      what the sources state; it is recorded, not corrected.)

      This row previously carried 51.1 kWh with 505 km — the Essence's battery
      against the Long Range's range, a pairing that describes neither car. The
      fix is to make every headline figure come from the same trim: battery,
      power and `range` are now all the Essence's, matching `price.min`, while
      `rangeMax` and `price.max` are the Long Range's. So the row reads
      consistently at both ends instead of mixing them in the middle.

      `power` has no maximum column, so the Long Range's 154 hp lives only in
      `notes` — as does the full spec of both trims.

      The right fix is two rows, which is a slug and URL decision rather than a
      data one. Flagged rather than taken here. It also matters to the crawler:
      Open EV Data publishes three ZS EV variants against this undeclared row, so
      Phase 4.1 grades every spec figure `ambiguous` and refuses it. Splitting the
      row is what would unblock that, not adding a source.
    */
    price: { min: lakh(96.9), max: crore(1.4999), display: 'PKR 96.9 Lakh – 1.50 Cr' },
    // Essence figures, so battery, power and range all describe one car.
    // Long Range: 72.6 kWh, 154 hp — see `rangeMax` and `notes`.
    batteryCapacity: 51.1,
    batteryUnit: 'kWh',
    range: 360,
    rangeMax: 505,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 174,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 50,
    dcChargingUnit: 'kW',
    acCharging: 7.4,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: null,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    // 130 kW is the Essence's, paired with the 174 hp above. The Long Range is
    // 115 kW / 154 hp.
    motorPowerKw: 130,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 9,
    /*
      Null, not 60.

      The published figure is about an hour for 0-80%, and this column renders as
      a 10-80% time — the window the rest of the industry quotes. Writing 60 here
      would put a 0-80% duration under a 10-80% label, which is a different
      measurement. The figure is in `notes` with its own window.
    */
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4323,
    widthMm: 1809,
    heightMm: 1649,
    wheelbaseMm: 2585,
    groundClearanceMm: 177,
    groundClearanceMaxMm: null,
    bootCapacityL: 359,
    kerbWeightKg: null,
    availability: 'Sold in Pakistan by MG Pakistan',
    distributor: 'MG Pakistan (mgmotors.com.pk)',
    warranty: 'Confirm terms with the dealer.',

    image: '/images/cars/mg-zs-ev.jpg',
    notes:
      'Sold in Pakistan as two trims. MCE Essence: 51.1 kWh, 174 hp (130 kW), 360 km, ' +
      'PKR 9,690,000. MCE Long Range: 72.6 kWh, 154 hp (115 kW), 505 km, PKR 14,999,000 — the ' +
      'larger pack is listed with the lower output, which is what the sources say. The battery, ' +
      'power and range shown above are the Essence\'s, matching the lower price; the maximum ' +
      'range and price are the Long Range\'s. FWD, single-speed automatic, 5 seats, 359 L boot. DC 50 kW ' +
      '(about 1 hour for 0–80%, a different window from the 10–80% figure this catalogue ' +
      'normally shows), AC 7.4 kW about 9 hours. Top speed 180 km/h. Dimensions and wheelbase ' +
      'are approximate: ~4323×1809×1649 mm, wheelbase ~2585 mm, ground clearance ~177 mm. ' +
      'No test cycle is stated for either range figure.',
  },
  {
    id: 'mg-binguo',
    slug: 'mg-binguo',
    brand: 'MG',
    model: 'Binguo',
    variant: null,
    fullName: 'MG Binguo EV',
    category: 'EV',
    price: { min: lakh(56.99), max: lakh(56.99), display: 'PKR 56.99 Lakh' },
    batteryCapacity: 31.9,
    batteryUnit: 'kWh',
    range: 333,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 67,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 150,
    topSpeed: 120,
    seats: 4,

    modelYear: 2026,
    bodyType: 'Compact hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 50,
    /*
      The one cycle this row can name. 333 km is the CLTC figure; WLTP for the
      same car is about 273 km, which is in `notes`. No factor converts between
      them, so only the cycle that produced the stored number is named here.
    */
    rangeStandard: 'CLTC',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 5.5,
    // Published as ~35 min for 30-80%, not the 10-80% window this column shows.
    dcChargingMinutes: null,
    batteryTech: 'LFP (lithium iron phosphate)',
    lengthMm: 3950,
    widthMm: 1708,
    heightMm: 1580,
    wheelbaseMm: 2560,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    // The standard figure. 790 L with the rear seats folded is in `notes`.
    bootCapacityL: 310,
    kerbWeightKg: 990,
    availability: 'Sold in Pakistan by MG Pakistan',
    distributor: 'MG Pakistan (mgmotors.com.pk)',
    warranty: 'Confirm terms with the dealer.',

    image: null,
    notes:
      '31.9 kWh LFP, 50 kW (67 hp), 150 Nm, FWD, single-speed automatic. 333 km on CLTC; WLTP ' +
      'for the same car is about 273 km, and the two cycles are not interchangeable. Top speed ' +
      '120 km/h; no 0–100 time is published. AC about 5.5 hours for 0–100%; DC fast charging ' +
      'about 35 minutes for 30–80%, which is a different window from the 10–80% figure shown ' +
      'elsewhere in this catalogue. 3950×1708×1580 mm, wheelbase 2560 mm, kerb about 990 kg. ' +
      'Boot 310 L standard, up to 790 L with the rear seats folded (both approximate). Seating ' +
      'is listed as 4 by most sources, though some say 5. PKR 5,699,000 ex-factory, reduced ' +
      'from PKR 5,999,000 in May 2026.',
  },
  {
    id: 'mg-4-urban',
    slug: 'mg-4-urban',
    brand: 'MG',
    model: 'MG4',
    variant: 'Urban',
    fullName: 'MG4 EV Urban',
    category: 'EV',
    price: { min: lakh(69.49), max: lakh(69.49), display: 'PKR 69.49 Lakh' },
    batteryCapacity: 43,
    batteryUnit: 'kWh',
    range: 316,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 148,
    powerUnit: 'hp',
    acceleration: 9,
    accelerationUnit: 'sec',
    /*
      Null rather than a midpoint.

      No DC rate is clearly published for this trim; listings suggest somewhere
      between 50 and 80 kW, which is a guess with a range attached rather than a
      specification. The uncertainty is stated in `notes` instead.
    */
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 250,
    topSpeed: 160,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 110,
    rangeStandard: 'WLTP',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 7.5,
    dcChargingMinutes: null,
    batteryTech: 'LFP (lithium iron phosphate)',
    lengthMm: 4395,
    widthMm: 1842,
    heightMm: 1549,
    wheelbaseMm: 2750,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    // Quoted as a 316-350 L span, so no single figure is stored. See `notes`.
    bootCapacityL: null,
    kerbWeightKg: 1635,
    availability: 'Sold in Pakistan by MG Pakistan',
    distributor: 'MG Pakistan (mgmotors.com.pk)',
    warranty: 'Confirm terms with the dealer.',

    image: null,
    notes:
      '43 kWh LFP, 148 hp (110 kW), 250 Nm, FWD. 316 km on WLTP. 0–100 in about 9 seconds, ' +
      'top speed about 160 km/h (approximate). AC about 7.5 hours for 0–100% at ~7 kW. DC fast ' +
      'charging is supported but no rate is clearly published — listings imply roughly ' +
      '50–80 kW, so none is recorded rather than picking one. 4395×1842×1549 mm, wheelbase ' +
      '2750 mm, kerb about 1635 kg. Boot quoted as 316–350 L depending on source, so no single ' +
      'figure is stored. 7 airbags. PKR 6,949,000 ex-factory via MG Pakistan.',
  },
  {
    /*
      Filled out for the 2026 model year from a researched column list.

      `range` moves from 650 to 550 with 650 now in `rangeMax`, and the reason is
      the mg-zs-ev rule: 550 km belongs to the 58.4 kWh Essence and 650 km to the
      73.5 kWh Prestige/Excellence, and every headline figure in this row is now
      the Essence's, matching `price.min`. The row previously paired the
      Essence's battery and power with the top trim's range, which described
      neither car.

      For the same reason `acceleration` stays null. The published "under 3.5
      seconds" is the top AWD variant's, and putting it beside a 215 hp RWD
      battery and power figure would mix two cars in the middle of the row. It is
      in `notes` with the variant named. Same for the 536 hp AWD output, which
      has no maximum column.

      `bootCapacityL` is null, not 0. The supplied column said "0 L (not
      published)", and 0 L on a sedan's spec sheet reads as a fact about a car
      with no boot rather than as an absent figure.

      `batteryTech` is null. LFP is the plausible chemistry and was supplied as
      an assumption, and this file does not store assumptions in fields a buyer
      reads as facts. The assumption is named in `notes` as an assumption.
    */
    id: 'dongfeng-007',
    slug: 'dongfeng-007',
    brand: 'Dongfeng',
    model: '007',
    // Three trims: Essence, Prestige and Excellence. A lineup declares no
    // variant — see the batch comment on the 2026 imports at the end of this
    // file.
    variant: null,
    fullName: 'Dongfeng 007',
    category: 'EV',
    price: { min: crore(1.19), max: crore(1.39), display: 'PKR 1.19–1.39 Cr' },
    // Essence's pack, matching price.min. Prestige and Excellence take 73.5 kWh.
    batteryCapacity: 58.4,
    batteryUnit: 'kWh',
    range: 550,
    rangeMax: 650,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // Essence, RWD. The top AWD variant makes up to 536 hp from 200+200 kW.
    power: 215,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    // Not published for any trim, so no DC rate is stored — this is a fast
    // charging car with an unknown rate, not a slow one.
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as "about 11 kW".
    acCharging: 11,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    // RWD figure, quoted as a 310-320 Nm span, so the lower end is stored
    // alongside the other RWD headline figures. The AWD variants are higher by
    // an unstated amount.
    torque: 310,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Electric sedan (4-door)',
    driveType: 'RWD / AWD',
    // RWD single motor, matching the 215 hp above. AWD is 200+200 kW.
    motorPowerKw: 160,
    rangeStandard: 'CLTC',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 7,
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4880,
    widthMm: 1895,
    heightMm: 1460,
    wheelbaseMm: 2915,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    // Quoted as 1767 kg by some sources; no manufacturer figure was found.
    kerbWeightKg: 1767,
    availability: 'On sale; introduced in 2025 through Chawla Green Motors.',
    distributor: 'Chawla Green Motors (Dongfeng Pakistan)',
    warranty: null,

    image: null,
    notes:
      'Dongfeng 007 in three trims. Essence: 58.4 kWh, 215 hp from a 160 kW rear motor, RWD, ' +
      '550 km CLTC. Prestige and Excellence: 73.5 kWh, up to 536 hp from 200+200 kW AWD, ' +
      '650 km CLTC. Battery, power, torque, drive layout and range above are the Essence\'s, ' +
      'matching the lower price; the maximum range and price are the top trim\'s. Torque is ' +
      'quoted as a 310–320 Nm span on RWD and is higher on AWD by an unstated amount. ' +
      '0–100 km/h is published as under 3.5 seconds for the top AWD variant only, so it is ' +
      'not recorded above — it would sit beside the Essence\'s battery and power and describe ' +
      'a different car. Top speed 180 km/h. AC about 11 kW taking around 7 hours; CCS2 and ' +
      'Type 2. NO DC RATE WAS PUBLISHED for any trim, and no DC charge window either, so both ' +
      'DC fields are blank — read that as unstated rather than as a car that cannot fast ' +
      'charge. BATTERY CHEMISTRY IS UNCONFIRMED: LFP is plausible and was supplied as an ' +
      'assumption, so no chemistry is stored. 4880×1895×1460 mm, wheelbase 2915 mm, kerb ' +
      'about 1767 kg per some sources. Boot volume was not published, so the field is blank ' +
      'rather than zero. 5 seats. Sold by Chawla Green Motors. Ground clearance and warranty ' +
      'are unconfirmed.',
  },
  {
    /*
      Filled out for the 2026 model year from a researched column list.

      `batteryCapacity` moves from 64 to 75 and `power` from 181 to 201, and both
      are contested. GUGO's own listing for the Premium and Luxury trims it
      imports says 75 kWh and 201 hp; other listings say 64.5 kWh, and 181 hp and
      224 hp both appear. The GUGO figures are stored because they describe the
      cars in this row's price range, and every competing figure is named in
      `notes`. Nothing here is averaged.

      The 64.5 kWh figure is not simply a rival claim about the same car: it is
      the specification of the GAC Aion V Premium that was launched officially at
      PKR 8,899,000, which is a different seller at a different price. That car is
      described in `notes` and deliberately not merged into this row, exactly as
      the AION UT row keeps Lucky Motor Corp's version separate.

      `price` widens from a single 1.20 Cr to 1.199-1.299 Cr, which is GUGO's
      Premium-to-Luxury span, not a change of policy about the car.
    */
    id: 'gugo-aion-v',
    slug: 'gugo-aion-v',
    brand: 'GUGO',
    model: 'AION V',
    // Two trims, Premium and Luxury. A lineup declares no variant — see the
    // batch comment on the 2026 imports at the end of this file.
    variant: null,
    fullName: 'GUGO AION V',
    category: 'EV',
    // Premium 11,990,000 / Luxury 12,990,000.
    price: { min: crore(1.199), max: crore(1.299), display: 'PKR 1.199–1.299 Cr' },
    batteryCapacity: 75,
    batteryUnit: 'kWh',
    // 510 km is the WLTP figure, which `rangeStandard` names. A 500+ km CLTC
    // claim and a 435 km WLTP figure from other sources are both in `notes`;
    // 435 and 510 cannot both be WLTP for one car, so the disagreement is
    // recorded rather than reconciled.
    range: 510,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 201,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 150,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 240,
    topSpeed: 150,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: 150,
    rangeStandard: 'WLTP',
    /*
      372 km, and it needs its label read carefully: this is an EPA figure from
      one source, not something owners reported. It is stored here because EPA is
      the closest thing to a real-world number this car has and burying it in
      `notes` alone would hide the most useful figure on the row — but it is a
      test cycle, so `notes` says whose.
    */
    realWorldRange: 372,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 6,
    // Published as 10-80% in about 24 minutes, which is the window this column
    // means.
    dcChargingMinutes: 24,
    batteryTech: 'LFP (GAC Magazine battery)',
    lengthMm: 4605,
    widthMm: 1876,
    heightMm: 1686,
    wheelbaseMm: 2775,
    groundClearanceMm: 171,
    groundClearanceMaxMm: null,
    bootCapacityL: 427,
    kerbWeightKg: null,
    availability: 'On sale as a GUGO Motors import; the official GAC version is sold separately at a lower price.',
    distributor: 'GUGO Motors (GAC/Lucky Motor Corp separately sell the official version)',
    warranty: null,

    image: '/images/cars/gugo-aion-v.jpg',
    notes:
      'GUGO Aion V, imported in Premium and Luxury trims at PKR 11,990,000 and 12,990,000. ' +
      '75 kWh LFP (GAC Magazine battery), about 201 hp / 150 kW, 240 Nm, FWD, 150 km/h. ' +
      'SPECIFICATIONS DISAGREE BY SOURCE: other listings say 64.5 kWh, and both 181 hp and ' +
      '224 hp appear; the GUGO figures are stored because they describe the cars in this ' +
      'price range, and nothing is averaged. RANGE DISAGREES TOO: 510 km WLTP is stored, with ' +
      'a 500+ km CLTC claim and a 435 km WLTP figure elsewhere — 435 and 510 cannot both be ' +
      'WLTP for one car. The 372 km shown as the real-world figure is an EPA number from one ' +
      'source rather than owner-reported. AC 6.6 kW taking about 6 hours; DC 150 kW covering ' +
      '10–80% in about 24 minutes; CCS2 and Type 2. 4605×1876×1686 mm, wheelbase 2775 mm, ' +
      'ground clearance about 171 mm, 427 L boot, 5 seats. TWO SELLERS, NOT ONE CAR: the GAC ' +
      'Aion V Premium was launched officially at PKR 8,899,000 with 64.5 kWh, 435 km WLTP, ' +
      '7 airbags, a 5-star Euro NCAP rating and 150 kW DC charging. That is a different ' +
      'specification at a materially lower price and is deliberately not merged into this row ' +
      'or its price range. 0–100 km/h, kerb weight and warranty are unconfirmed.',
  },
  {
    /*
      Filled out for the 2026 model year across four variants.

      ── The price range ───────────────────────────────────────────────

      The supplied summary says "1.33-1.70 Cr", but its own variant table lists
      the Ultra at PKR 18,499,000, which is 1.85 Cr. The four listed prices are
      13,299,000 / 14,699,000 / 16,999,000 / 18,499,000, so the range is built
      from those and the 1.70 Cr figure is treated as a stale summary rather than
      a price. Flagged, not silently followed.

      ── What is not stored ────────────────────────────────────────────

      `power`, `motorPowerKw`, `acceleration` and `bootCapacityL` are all left as
      they are or left blank, because the supplied data gives them only as
      lineup-wide spans or as the top variant's figures:

        power 280 hp is kept unchanged from the price list. The 2026 research
        gives only "200-463 hp" across four variants with no per-variant
        breakdown, so there is nothing to replace it with that describes the Econ
        this row's other headline figures come from.

        motorPowerKw is null: "100-315 kW" is the same lineup span.

        acceleration is null: 4.5 s is explicitly the top 4WD variant's, and it
        would sit beside the entry variant's battery and power.

        bootCapacityL is null: the ~1200 L figure is the product of the bed's
        1,525 × 1,450 × 540 mm, so it is arithmetic rather than a published
        volume — and a pickup bed is not a boot a buyer can compare against the
        sedans in this catalogue. The bed dimensions are in `notes`.

      `range` moves from 461 to 424 with 461 now in `rangeMax`: 424 km is the
      73 kWh 4WD figure, which is the Econ at `price.min`, and 461 km is the
      73 kWh 2WD Air.
    */
    id: 'riddara-rd6',
    slug: 'riddara-rd6',
    brand: 'Riddara',
    model: 'RD6',
    // Four variants: Econ 4WD, Air 2WD, Pro 4WD and Ultra 4WD. A lineup declares
    // no variant.
    variant: null,
    fullName: 'Riddara RD6',
    category: 'EV',
    price: { min: crore(1.3299), max: crore(1.8499), display: 'PKR 1.33–1.85 Cr' },
    // Econ / Air / Pro all take 73 kWh; the Ultra takes 86 kWh.
    batteryCapacity: 73,
    batteryUnit: 'kWh',
    range: 424,
    rangeMax: 461,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 280,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    /*
      Null. The published DC figure is "30-80% in about 32 minutes" with no kW
      rating attached. The window is in `notes`.
    */
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as "about 7 kW".
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    // The 4WD figure is quoted as a 595-659 Nm span across those variants, so
    // the lower end is stored beside the other entry-variant figures. The 2WD
    // Air makes about 385 Nm.
    torque: 595,
    // Quoted as a 160-190 km/h span across the variants; the lower end.
    topSpeed: 160,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Pickup truck (4-door)',
    driveType: '2WD / 4WD',
    motorPowerKw: null,
    // WLTP per Capital Smart Motors, the distributor. Other sources call the
    // same figures NEDC — in `notes`.
    rangeStandard: 'WLTP',
    realWorldRange: 350,
    realWorldRangeMax: 400,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 9,
    // Published as 30-80% in about 32 minutes, a different window from the
    // 10-80% this column renders. In `notes`.
    dcChargingMinutes: null,
    batteryTech: 'Ternary lithium-ion (NMC; some sources say LFP for the 73 kWh pack)',
    /*
      Dimensions disagree between sources. Stored: 5260 × 1900 × 1880 mm.
      Capital Smart Motors lists 5410 mm long and 1855 mm tall — 150 mm of length
      is a different truck, not a rounding, so both are in `notes` and neither is
      averaged.
    */
    lengthMm: 5260,
    widthMm: 1900,
    heightMm: 1880,
    wheelbaseMm: 3120,
    groundClearanceMm: 225,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    // Quoted as about 2065 kg.
    kerbWeightKg: 2065,
    availability: "On sale; Pakistan's first electric pickup.",
    distributor: 'Capital Smart Motors (Geely Riddara Pakistan)',
    warranty:
      'Battery 8 years, quoted by some sources as 8 years / 200,000 km; vehicle 5 years / 150,000 km.',

    image: '/images/cars/riddara-rd6.jpg',
    notes:
      'Riddara RD6, an electric pickup built by Geely and sold here by Capital Smart Motors. ' +
      'Four variants: Econ 4WD (73 kWh, 424 km, PKR 13,299,000), Air 2WD (73 kWh, 461 km, ' +
      'about 385 Nm, PKR 14,699,000), Pro 4WD (73 kWh, 424 km, PKR 16,999,000) and Ultra 4WD ' +
      '(86 kWh, 455 km, 595–659 Nm, PKR 18,499,000). Battery, range and torque above are the ' +
      'entry 4WD\'s, matching the lowest price; the maximum range is the Air\'s. THE PRICE ' +
      'RANGE IS BUILT FROM THE FOUR LISTED PRICES: a summary figure of "1.33–1.70 Cr" was also ' +
      'supplied but does not match the Ultra\'s own 18,499,000, so it was not used. ' +
      'PER-VARIANT OUTPUT IS NOT PUBLISHED: the lineup spans 100–315 kW and 200–463 hp with ' +
      'the top 4WD around 422–463 hp, but no figure was given for the entry variant, so the ' +
      '280 hp this row already carried is kept and no kW figure is stored. 0–100 in 4.5 s is ' +
      'the top 4WD\'s only, so it is not recorded above. Top speed spans 160–190 km/h. ' +
      'RANGE CYCLE DISAGREES: Capital Smart Motors calls these WLTP figures and other sources ' +
      'call them NEDC. About 350–400 km is the realistic expectation. AC about 7 kW taking ' +
      'around 9 hours; DC reaches 30–80% in about 32 minutes but no kW rating was published, ' +
      'and that window is not the 10–80% this catalogue normally shows. CCS2 and Type 2. ' +
      'DIMENSIONS DISAGREE: 5260×1900×1880 mm is stored and Capital Smart Motors lists ' +
      '5410 mm long and 1855 mm tall; 150 mm of length is too much to be rounding, so both ' +
      'are recorded. Wheelbase 3120 mm, ground clearance 225 mm, kerb about 2065 kg, 5 seats. ' +
      'The cargo bed measures 1,525×1,450×540 mm; a ~1200 L figure is simply that box ' +
      'multiplied out rather than a published volume, so no boot capacity is stored. Towing ' +
      '3,000 kg, wading depth 815 mm, 7 drive modes. BATTERY CHEMISTRY IS UNCONFIRMED: ' +
      'ternary lithium is stated, while some sources say the 73 kWh pack is LFP. Consumption ' +
      'was not published.',
  },
  {
    id: 'deepal-l07',
    slug: 'deepal-l07',
    brand: 'Deepal',
    model: 'L07',
    variant: null,
    fullName: 'Deepal L07',
    category: 'EV',
    // 13,999,000 exactly, where the row rounded to 14,000,000. Display unchanged.
    price: { min: crore(1.3999), max: crore(1.3999), display: 'PKR 1.40 Cr' },
    batteryCapacity: 66.8,
    batteryUnit: 'kWh',
    range: 540,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // 255 hp from deepal.com.pk, the official Pakistani site. Some listings say
    // 190 hp, which is close to the 188 kW motor figure misread as horsepower.
    power: 255,
    powerUnit: 'hp',
    /*
      Null: the figure is published as a 7.4-7.9 s range and this column is one
      number. Both ends are in `notes` rather than an invented midpoint.
    */
    acceleration: null,
    accelerationUnit: 'sec',
    // No DC rate is published — only that 30-80% takes about 35 minutes.
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as a 7-11 kW range, so no single rate is stored. See `notes`.
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 320,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Fastback sedan (4-door)',
    driveType: 'RWD',
    motorPowerKw: 188,
    /*
      Null, and that is the honest answer for this car.

      540 km is a manufacturer claim with no cycle attached. Naming a cycle here
      would assert a test this figure has not been shown to come from — and since
      NEDC, CLTC, WLTP and EPA can differ by well over a hundred kilometres on one
      car, the missing cycle is the most important thing about the number.
      `notes` says it is claimed, and `realWorldRange` carries what owners see.
    */
    rangeStandard: null,
    realWorldRange: 400,
    realWorldRangeMax: 500,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 8,
    // Published for 30-80%; this column is 10-80%. Different window, so `notes`.
    dcChargingMinutes: null,
    batteryTech: 'CATL ternary lithium-ion (NMC)',
    /*
      Length, width and height are deliberately absent.

      The global L07 is around 4875 mm long, but no Pakistani sheet confirms the
      body dimensions and a global figure is not a local one. The wheelbase and
      kerb weight below are confirmed; these three are not, and a plausible number
      in a spec column is indistinguishable from a measured one.
    */
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    wheelbaseMm: 2900,
    groundClearanceMm: 150,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: 1760,
    availability: 'On sale; delivery around 3 months',
    distributor: 'Master Changan (Deepal Pakistan)',
    warranty: 'Reported as battery 8 years / up to 240,000 km, drive system 8 years / 150,000 km, vehicle 5 years / 120,000 km — single source, not confirmed.',

    image: '/images/cars/deepal-l07.jpg',
    notes:
      'Deepal L07 EV. 66.8 kWh CATL ternary (NMC) pack, about 188 kW / 255 hp — the official ' +
      'deepal.com.pk figure; some listings say 190 hp, which looks like the kW number read as ' +
      'horsepower. 320 Nm, RWD, top speed 180 km/h. 0–100 is published as a 7.4–7.9 s range, so ' +
      'no single time is stored. Range of 540 km is a manufacturer claim with no test cycle ' +
      'stated, which matters because cycles differ by more than a hundred kilometres on one car; ' +
      'real-world reports are 400–500 km. Energy consumption is not published. A full AC charge ' +
      'takes about 8 hours at a rate quoted only as a 7–11 kW range, so no AC rate is stored; ' +
      'DC 30–80% takes about 35 minutes but the rate itself is not published, and that window ' +
      'differs from the 10–80% figure shown elsewhere here. CCS2 for DC, Type 2 for AC. 5 seats, ' +
      '4 doors, 19-inch alloys on 245/45 R19, 6 airbags, TPMS and a 360-degree camera. ' +
      'Wheelbase 2900 mm, ground clearance about 150 mm, kerb 1760 kg. Body length, width, ' +
      'height and boot volume are not confirmed for Pakistan and are left blank rather than ' +
      'taken from the global car (about 4875 mm long). PKR 13,999,000, with some listings at ' +
      '13,750,000. Warranty terms above come from a single source and need confirming. Sold by ' +
      'Master Changan.',
  },
  {
    id: 'xpeng-g6',
    slug: 'xpeng-g6',
    brand: 'XPENG',
    model: 'G6',
    variant: null,
    fullName: 'XPENG G6',
    category: 'EV',
    price: { min: crore(1.45), max: crore(1.85), display: 'PKR 1.45–1.85 Cr' },
    batteryCapacity: 68,
    batteryUnit: 'kWh',
    range: 535,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 248,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: null,
    topSpeed: null,
    seats: null,
    image: '/images/cars/xpeng-g6.jpg',
    notes: null,
  },
  {
    /*
      Filled out for the 2026 model year, and this row needs reading before it is
      trusted, because it now says something different from what the database
      says.

      ── What changed and why ──────────────────────────────────────────

      The row describes TWO variants as a price range, per instruction: Seal
      Dynamic at PKR 14,790,000 and Seal Premium at 16,990,000. Every headline
      figure is now the Dynamic's, matching `price.min` — the mg-zs-ev rule.

      That fixes a real defect. The row previously carried the Dynamic's
      61.44 kWh battery against 650 km of range, and 650 km is the PREMIUM's
      82.56 kWh figure. Battery and range described different cars. `range` is
      now 510 (Dynamic) with 650 in `rangeMax` (Premium).

      A third variant is NOT in the price range: a Performance AWD, 390 kW /
      523 hp, 3.8 s, at PKR 22,200,000. Folding 22.2M into `price.max` would put
      a 390 kW car's price on a row whose power, torque and drive type all
      describe a 150 kW one. It is named in `notes`.

      ── The conflict with the declared identity ───────────────────────

      The database row carries variant and trim '61.4 kWh RWD Comfort', declared
      through the audited path by scripts/declare-variant-identity.ts on
      2026-08-27, together with corrections restoring batteryCapacity 61.44,
      range 650 and dcCharging 110.

      This row now contradicts two of those. It says the row is a two-variant
      lineup rather than one trim, so `variant` stays null — the Phase 4.1
      contract is that null asserts "declares no variant", and a lineup cannot
      honestly name a single trim. And it says `range` is 510, not the 650 the
      audited correction restored, because 650 belongs to the larger pack.

      Seeding this row with --force would clear that audited declaration. That is
      a decision about somebody else's reviewed work, not a data edit, so it is
      NOT taken here. The module and the database diverge on this row until an
      operator resolves it — which is the same state the header of
      scripts/seed-cars.ts already documents for byd-seal.
    */
    id: 'byd-seal',
    slug: 'byd-seal',
    brand: 'BYD',
    model: 'Seal',
    variant: null,
    fullName: 'BYD Seal',
    category: 'EV',
    // Dynamic 14,790,000 to Premium 16,990,000. Performance 22,200,000 excluded
    // — see the comment above.
    price: { min: crore(1.479), max: crore(1.699), display: 'PKR 1.479–1.699 Cr' },
    // Dynamic's pack, matching price.min. Premium takes 82.56 kWh.
    batteryCapacity: 61.44,
    batteryUnit: 'kWh',
    range: 510,
    rangeMax: 650,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // Dynamic. Premium is 230 kW / 313 hp, quoted as 308 hp by some sources.
    power: 201,
    powerUnit: 'hp',
    acceleration: 7.5,
    accelerationUnit: 'sec',
    dcCharging: 110,
    dcChargingUnit: 'kW',
    /*
      7 kW is the Dynamic's, matching every other headline figure here. An 11 kW
      figure is also published and is what the database currently holds, having
      arrived through the crawler and been accepted by an operator on
      2026-08-27. Both are in `notes`.
    */
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    // Dynamic. Premium is 360 Nm, quoted as 380 Nm by some sources.
    torque: 310,
    // Quoted as a 180-220 km/h span across the variants; the lower end is the
    // Dynamic's.
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Electric sedan (4-door)',
    // Both Dynamic and Premium are rear-wheel drive. Only the Performance is
    // AWD, and it is not represented above.
    driveType: 'RWD',
    motorPowerKw: 150,
    // 510 and 650 km are both NEDC. WLTP figures of about 460 and 570 km are
    // published for the same two cars and are in `notes`.
    rangeStandard: 'NEDC',
    realWorldRange: 430,
    realWorldRangeMax: 520,
    // Published as 134-145 Wh/km, which is 13.4-14.5 kWh/100 km.
    consumption: 13.4,
    consumptionMax: 14.5,
    acChargingHours: 10,
    // Published as 30-80% in about 25-30 minutes: both the wrong window for
    // this column and a span. In `notes` with its own wording.
    dcChargingMinutes: null,
    batteryTech: 'BYD Blade Battery (LFP)',
    lengthMm: 4800,
    widthMm: 1875,
    heightMm: 1460,
    wheelbaseMm: 2920,
    groundClearanceMm: 145,
    groundClearanceMaxMm: null,
    // Rear boot. A front boot of about 53 L is also published — in `notes`.
    bootCapacityL: 400,
    // Quoted as a 1922-2055 kg span across the variants; the lighter end is the
    // Dynamic's, matching the other headline figures.
    kerbWeightKg: 1922,
    availability: 'On sale.',
    distributor: 'Mega Motor Company (BYD Pakistan)',
    warranty: 'Battery about 8 years — confirm the exact term with the dealer.',

    image: '/images/cars/byd-seal.jpg',
    notes:
      'BYD Seal, sold in two variants. Dynamic: 61.44 kWh Blade LFP, 150 kW / 201 hp, ' +
      '310 Nm, RWD, 510 km NEDC (about 460 km WLTP), 7.5 s 0–100, about 110 kW DC, ' +
      'PKR 14,790,000. Premium: 82.56 kWh, 230 kW / 313 hp (308 hp in some sources), 360 Nm ' +
      '(380 Nm in some sources), RWD, 650 km NEDC (about 570 km WLTP), 5.9 s, about 150 kW ' +
      'DC, PKR 16,990,000. Battery, power, torque, 0–100, DC and AC rates, top speed and kerb ' +
      'weight above are all the Dynamic\'s, matching the lower price; the maximum range is the ' +
      'Premium\'s. A THIRD VARIANT IS EXCLUDED FROM THE PRICE RANGE: a Performance AWD, ' +
      '390 kW / 523 hp, 3.8 s 0–100, at PKR 22,200,000 — it is the only AWD Seal and its ' +
      'price is deliberately not folded into the range above. RANGE CYCLES: 510 and 650 km ' +
      'are NEDC; the WLTP figures for the same two cars are about 460 and 570 km, and both ' +
      'pairs are kept rather than reconciled. About 430–520 km is the realistic expectation, ' +
      'and consumption is published as 134–145 Wh/km. AC CHARGING DISAGREES: 7 kW is the ' +
      'Dynamic\'s figure and 11 kW is also published. DC reaches 30–80% in about 25–30 ' +
      'minutes, which is a different window from the 10–80% this catalogue normally shows. ' +
      'Top speed spans 180–220 km/h and kerb weight 1922–2055 kg across the variants. ' +
      '4800×1875×1460 mm, wheelbase 2920 mm, ground clearance about 145 mm, 400 L rear boot ' +
      'plus about 53 L under the bonnet, 5 seats. CCS2 and Type 2. Mega Motor Company. ' +
      'Battery warranty is about 8 years and needs confirming.',
  },
  {
    id: 'deepal-s07',
    slug: 'deepal-s07',
    brand: 'Deepal',
    model: 'S07',
    variant: null,
    fullName: 'Deepal S07',
    category: 'EV',
    // 14,999,000 exactly, where the row rounded to 15,000,000. Display unchanged.
    price: { min: crore(1.4999), max: crore(1.4999), display: 'PKR 1.50 Cr' },
    batteryCapacity: 66.8,
    batteryUnit: 'kWh',
    range: 485,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // 190 kW is 258 PS, which is 255 hp — one motor described three ways, not a
    // conflict. The "190 hp" some listings carry is the kW figure misread.
    power: 255,
    powerUnit: 'hp',
    // "Under 7 seconds" is a bound, not a time, and this column would render it
    // as one. In `notes` as published.
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    /*
      Null, and this one is a deliberate departure from the brief.

      The figure offered as primary, 320 Nm, is described in the research as coming
      "from L07-style config" — that is, carried across from the sister car rather
      than published for the S07 — while 365 Nm is attributed to actual sources.
      So this is not a strong figure against a weak one; it is an inference against
      a citation, and storing the inference is the thing this file does not do.
      Both are in `notes`. Say the word and 320 goes in.
    */
    torque: null,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Crossover SUV (5-door)',
    driveType: 'RWD',
    motorPowerKw: 190,
    // 485 km is a claim with no cycle stated — same reasoning as the L07 above.
    rangeStandard: null,
    realWorldRange: 400,
    realWorldRangeMax: 450,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 8,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion (CATL ternary; LFP or NMC not confirmed)',
    lengthMm: 4750,
    widthMm: 1930,
    heightMm: 1625,
    wheelbaseMm: 2900,
    groundClearanceMm: 165,
    groundClearanceMaxMm: null,
    bootCapacityL: 445,
    // ~1760 kg, inferred from sharing the L07's platform rather than published
    // for the S07. Marked approximate in `notes`; kept because the two cars share
    // a floorpan and a battery, which makes it a much shorter reach than torque.
    kerbWeightKg: 1760,
    availability: 'On sale in Pakistan since August 2024',
    distributor: 'Master Changan (Deepal Pakistan)',
    warranty: 'Reported as around 8 years on the battery and 5 on the vehicle; exact mileage limits not confirmed.',

    image: '/images/cars/deepal-s07.jpg',
    notes:
      'Deepal S07 EV. 66.8 kWh pack, 190 kW / 255 hp — the same motor quoted as 258 PS in some ' +
      'places, and as "190 hp" in others where the kW figure has been read as horsepower. RWD, ' +
      'top speed about 180 km/h. Torque is left blank: 320 Nm is carried over from the L07\'s ' +
      'configuration rather than published for this car, while 365 Nm is cited by sources, so ' +
      'neither is a confirmed S07 figure. 0–100 is given only as "under 7 seconds", a bound ' +
      'rather than a time. Claimed range 485 km with no test cycle stated; real-world reports ' +
      '400–450 km. Energy consumption is not published. A full AC charge takes about 8 hours at ' +
      'a rate quoted as a 7–11 kW range, so no AC rate is stored; DC 30–80% in about 35 minutes ' +
      'with no rate published, on a different window from the 10–80% figure shown elsewhere ' +
      'here. CCS2 for DC, Type 2 for AC. 5 seats, 20-inch alloys, 445 L boot, 4750×1930×1625 mm, ' +
      'wheelbase 2900 mm, ground clearance 165 mm, kerb about 1760 kg — that last figure comes ' +
      'from sharing the L07 platform, not from an S07 sheet. 6 airbags, ABS, AEB, ESC, blind-spot ' +
      'detection, 360-degree camera, vehicle-to-load output and adjustable regenerative braking. ' +
      'PKR 14,999,000. Battery chemistry and warranty mileage limits not confirmed. Sold by ' +
      'Master Changan.',
  },
  {
    id: 'byd-sealion-7-advanced',
    slug: 'byd-sealion-7-advanced',
    brand: 'BYD',
    model: 'Sealion 7 Advanced',
    variant: null,
    fullName: 'BYD Sealion 7 Advanced',
    category: 'EV',
    price: { min: crore(1.55), max: crore(1.55), display: 'PKR 1.55 Cr' },
    batteryCapacity: 82.56,
    batteryUnit: 'kWh',
    range: 450,
    rangeMax: 567,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 308,
    powerUnit: 'hp',
    acceleration: 6.7,
    accelerationUnit: 'sec',
    dcCharging: 150,
    dcChargingUnit: 'kW',
    acCharging: 11,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 380,
    topSpeed: 215,
    seats: 5,

    // ── The researched spec sheet, as fields rather than prose ──────
    modelYear: 2026,
    bodyType: 'Crossover SUV (5-door)',
    driveType: 'RWD',
    motorPowerKw: 230,
    /*
      CLTC, stated rather than assumed.

      This is the one row in the catalogue that can name its cycle: Pakistani
      listings quote 567 km, which is the CLTC figure, and WLTP for the
      comparable trim is about 482 km. Both are recorded — the cycle here, the
      WLTP comparison in `notes` — because the two are not interchangeable and
      no factor converts between them. The other 35 rows keep rangeStandard
      null, which is honest: nobody has established their cycle.
    */
    rangeStandard: 'CLTC',
    realWorldRange: 450,
    realWorldRangeMax: 500,
    consumption: 19,
    consumptionMax: 21,
    acChargingHours: 8.6,
    dcChargingMinutes: 32,
    batteryTech: 'BYD Blade Battery (LFP)',
    lengthMm: 4830,
    widthMm: 1925,
    heightMm: 1620,
    wheelbaseMm: 2930,
    // Sources differ, so the published span is kept rather than a midpoint.
    groundClearanceMm: 145,
    groundClearanceMaxMm: 170,
    bootCapacityL: 500,
    kerbWeightKg: 2225,
    availability: 'Available 2026, delivery approximately 1 month',
    distributor: 'Mega Motor Company (BYD Pakistan, HUBCO partnership)',
    warranty:
      'BYD official network warranty — typically 8 years battery, 6–7 years vehicle. Confirm exact terms with the dealer.',

    image: '/images/cars/byd-sealion-7-advanced.jpg',
    /*
      The full researched spec sheet, because most of it has nowhere else to go.

      The interface carries fourteen of the thirty-five researched fields. There
      is no column for a test cycle, a dimension, a wheelbase, a kerb weight, a
      boot volume, a charging duration, a battery chemistry, a drive type, a body
      type, a model year, a motor rating in kW, an availability date, a
      distributor or a warranty — so those are recorded here rather than dropped,
      and rather than a migration added on one car's account.

      Both range cycles are stated and neither is chosen. Pakistani listings
      quote 567 km, which is the CLTC figure; WLTP for the comparable trim is
      about 482 km. The authored `range`/`rangeMax` pair keeps the 450–567 span
      it already had. Estimates are marked as estimates: real-world range,
      consumption and ground clearance are ranges in the sources, not published
      single figures, and ground clearance in particular varies 145–170 mm
      between them.
    */
    /*
      What is left once the figures have columns of their own.

      Everything above renders as a spec row. `notes` now carries only the three
      things a table cannot: the WLTP comparison, which is a second cycle for the
      same car rather than a field; the DC ceiling on a trim we do not sell,
      which belongs beside our 150 kW so a reader does not think we understated
      it; and the exact ex-factory rupee figure, because `price.display` rounds
      to 1.55 Cr.
    */
    notes:
      'Range 567 km on CLTC; WLTP for the comparable Premium trim is about 482 km, and no ' +
      'factor converts between the two cycles. DC charging is 150 kW on this trim — top AWD ' +
      'European models reach 230 kW, which this one does not. Ex-factory price is ' +
      'PKR 15,490,000 exactly; the headline figure is rounded to 1.55 Cr.',
  },
  {
    id: 'kia-ev5',
    slug: 'kia-ev5',
    brand: 'KIA',
    model: 'EV5',
    variant: null,
    fullName: 'KIA EV5',
    category: 'EV',
    price: { min: crore(1.85), max: crore(2.35), display: 'PKR 1.85–2.35 Cr' },
    /*
      Two trims, headline set by the entry one — the same rule `mg-zs-ev` uses.

      Air is 64.2 kWh / 160 kW / 215 hp / FWD / 490 km at PKR 18,500,000; Earth is
      88.1 kWh / 230 kW / 308 hp / AWD / 620 km at PKR 23,500,000. Battery, power
      and `range` are all the Air's, so they agree with `price.min`, and `rangeMax`
      with `price.max` carries the Earth. Battery and power have no maximum column,
      so the Earth's figures live in `notes`.
    */
    batteryCapacity: 64.2,
    batteryUnit: 'kWh',
    range: 490,
    rangeMax: 620,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 215,
    powerUnit: 'hp',
    // 8.5 s is the Air's published figure. This row previously held 8.4 s from an
    // earlier authoring pass; the source for that is unknown, so the cited one wins.
    acceleration: 8.5,
    accelerationUnit: 'sec',
    dcCharging: 102,
    dcChargingUnit: 'kW',
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    /*
      Null on purpose, and the one figure this row refuses to carry.

      Air is reported near 310 Nm and Earth near 480 Nm, both marked "confirm
      exact" by the research this row came from. An unconfirmed figure in a
      numeric column reads as published fact once it reaches the page, so it stays
      out until an official Kia spec sheet settles it.
    */
    torque: null,
    topSpeed: 185,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Crossover SUV (5-door)',
    driveType: 'FWD (Air) / AWD (Earth)',
    // 160 kW is the Air's, paired with the 215 hp above. Earth is 230 kW / 308 hp.
    motorPowerKw: 160,
    /*
      NEDC, which matters more than usual here.

      Pakistani listings quote the EV5 on NEDC, the most optimistic of the major
      cycles — a WLTP or EPA figure for the same car would be materially lower.
      Naming the cycle is what stops 490 km being read as a WLTP-equivalent number.
    */
    rangeStandard: 'NEDC',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 10,
    /*
      Not published per trim. The EV5 is generally quoted at 10-80% in about
      27-30 minutes, but that is the model in the abstract rather than either
      Pakistani trim, and this column is a single number against a specific car.
      The span is in `notes` where it can be read as the approximation it is.
    */
    dcChargingMinutes: null,
    batteryTech: 'Lithium iron phosphate (LFP), blade-style cell-to-body',
    lengthMm: 4615,
    widthMm: 1875,
    heightMm: 1715,
    wheelbaseMm: 2750,
    groundClearanceMm: 166,
    groundClearanceMaxMm: 175,
    bootCapacityL: 513,
    kerbWeightKg: 1870,
    availability: 'On sale in Pakistan; reported as CKD local assembly',
    distributor: 'Kia Lucky Motors',
    warranty: 'Not publicly confirmed. Kia typically warrants the battery for 8 years — treat as unverified until the dealer confirms.',

    image: '/images/cars/kia-ev5.png',
    notes:
      'Kia EV5, sold in Pakistan as two trims. Air: 64.2 kWh LFP, 160 kW / 215 hp, FWD, ' +
      '490 km NEDC, 0–100 in 8.5 s, PKR 18,500,000. Earth: 88.1 kWh LFP, 230 kW / 308 hp, AWD, ' +
      '620 km NEDC, 0–100 in 6.1 s, PKR 23,500,000. The battery, power and drive type shown ' +
      'above are the Air\'s, matching the lower price; the maximum range and price are the ' +
      'Earth\'s. Ranges are NEDC, which reads high against WLTP or EPA. Top speed 185 km/h, ' +
      '5 seats, 513 L boot, kerb ~1870 kg, 4615×1875×1715 mm, wheelbase 2750 mm, ground ' +
      'clearance 166–175 mm. AC 7 kW on the base trim and up to 11 kW higher up, giving about ' +
      '10 hours for the Air and about 8 for the Earth; DC about 102 kW on the Air and up to ' +
      '120–141 kW on the Earth. CCS2 for DC, Type 2 for AC. Not confirmed and therefore left ' +
      'blank above: torque (reported near 310 Nm for Air and 480 Nm for Earth, both marked ' +
      '"confirm exact"), DC 10–80% time (the model is generally quoted at about 27–30 minutes, ' +
      'not per trim), real-world range, energy consumption, and warranty terms. Sold by Kia ' +
      'Lucky Motors.',
  },
  {
    id: 'deepal-e07',
    slug: 'deepal-e07',
    brand: 'Deepal',
    model: 'E07',
    variant: null,
    fullName: 'Deepal E07',
    category: 'EV',
    /*
      Two variants, and the row was describing them as one car's span.

      It read `range: 590, rangeMax: 640` with a note calling that "a 590–640 km
      span". It is not a span: 640 km is the Plus RWD's NEDC figure and 590 km is
      the Performance AWD's. Treating them as one car's range implies the E07
      might do either, when in fact which one you get is decided at purchase.

      The fix is the rule the rest of this file uses — headline figures all come
      from one variant. Here that is Plus RWD, because PKR 19,000,000 is its
      price: 640 km, 252 kW / 342 PS, 365 Nm, 0–100 in 6.7 s. `rangeMax` is null
      rather than 590, since the second variant's range is *lower*, and a maximum
      that undercuts the headline would be nonsense. The AWD is in `notes`.
    */
    price: { min: crore(1.9), max: crore(1.9), display: 'PKR 1.90 Cr' },
    batteryCapacity: 89.98,
    batteryUnit: 'kWh',
    range: 640,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 342,
    powerUnit: 'hp',
    acceleration: 6.7,
    accelerationUnit: 'sec',
    dcCharging: 240,
    dcChargingUnit: 'kW',
    acCharging: 11,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 365,
    topSpeed: 210,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Large crossover SUV (4-door, 5-seat)',
    driveType: 'RWD (Plus) / AWD (Performance)',
    motorPowerKw: 252,
    /*
      NEDC, which is the cycle the Pakistani listing uses and the reason 640 km
      reads high. A WLTP figure for the same car would be materially lower, so the
      cycle has to travel with the number.
    */
    rangeStandard: 'NEDC',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 8,
    // 30-80% in about 15 minutes. This column is 10-80%, so `notes` carries it.
    dcChargingMinutes: null,
    batteryTech: 'Ternary lithium-ion (NMC)',
    lengthMm: 5045,
    widthMm: 1996,
    heightMm: 1680,
    wheelbaseMm: 3120,
    /*
      Three blanks with nothing behind them. Ground clearance is complicated here
      anyway — the car has air suspension with CDC damping, so a single static
      figure would be the wrong shape of answer even if one were published. Boot
      volume and kerb weight are simply not stated.
    */
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale in Pakistan (2026)',
    distributor: 'Master Changan (Deepal Pakistan)',
    warranty: 'Not confirmed. An 8-year battery term is typical for the segment but is not published for this car.',

    image: '/images/cars/deepal-e07.jpg',
    notes:
      'Deepal E07, 89.98 kWh ternary lithium (NMC), sold in Pakistan as two variants. Plus RWD: ' +
      '252 kW / 342 PS (about 337 hp), 365 Nm, RWD, 0–100 in 6.7 s, 640 km NEDC — these are the ' +
      'figures shown above, because PKR 19,000,000 is the Plus RWD\'s price. Performance AWD: ' +
      '440 kW / 598 PS (about 590 hp), 645 Nm, AWD, 0–100 in 3.96 s, 590 km NEDC, at a price ' +
      'that may differ and is not confirmed. Note that the AWD\'s range is lower, not higher, so ' +
      'the two figures are not a span — this row previously showed them as "590–640 km", which ' +
      'described neither car. Ranges are NEDC, the cycle the Pakistani listing uses, and read ' +
      'high against WLTP. Top speed 210 km/h. DC 240 kW, 30–80% in about 15 minutes, a different ' +
      'window from the 10–80% figure shown elsewhere here; AC about 11 kW for a full charge in ' +
      'about 8 hours. CCS2 for DC, Type 2 for AC. Air suspension with CDC damping, zero-gravity ' +
      'front seats, an electric glass trunk and 8 airbags. 5045×1996×1680 mm, wheelbase 3120 mm. ' +
      'Real-world range, ground clearance, boot volume, kerb weight and warranty terms are not ' +
      'published — with air suspension, a single ground-clearance figure would not describe the ' +
      'car anyway. Sold by Master Changan.',
  },
  {
    /*
      Identity here is brought into line with the database, not newly decided.

      scripts/declare-variant-identity.ts moved this row to model "EV9" with the
      trim in `variant` back in Phase 4.1, so a source naming a different EV9 trim
      registers as a mismatch instead of a match. The module was never updated to
      match, which left a live trap: any `seed-cars.ts --force` would have written
      "EV9 GT-Line" / null straight back over the declaration and silently undone
      it. Writing the declared values here closes that.

      `fullName` is "KIA EV9", not "KIA EV9 GT-Line", and that is deliberate:
      `carDisplayName` in src/lib/cars.ts composes fullName + variant, so the
      public name still renders "KIA EV9 GT-Line". Spelling the trim in both
      fields would produce "KIA EV9 GT-Line GT-Line" in the SEO title, the OG
      strings, schema.org name and every aria-label.
    */
    id: 'kia-ev9-gt-line',
    slug: 'kia-ev9-gt-line',
    brand: 'KIA',
    model: 'EV9',
    variant: 'GT-Line',
    fullName: 'KIA EV9',
    category: 'EV',
    price: { min: crore(4.32), max: crore(4.32), display: 'PKR 4.32 Cr' },
    batteryCapacity: 99.8,
    batteryUnit: 'kWh',
    /*
      505 km replaces the 561 km this row carried, because 505 is Kia's own WLTP
      figure and 561 appears only in third-party listings with no cycle named.
      A number whose cycle is unknown cannot be compared against one whose cycle
      is stated, so the stated one is kept and the other is recorded in `notes`
      rather than dropped.
    */
    range: 505,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 398,
    powerUnit: 'hp',
    acceleration: 5.3,
    accelerationUnit: 'sec',
    dcCharging: 210,
    dcChargingUnit: 'kW',
    acCharging: 11,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 700,
    topSpeed: 200,
    // Configurable 6 or 7; 7 is the figure a spec sheet leads with. See `notes`.
    seats: 7,

    modelYear: 2026,
    bodyType: 'Large SUV (5-door, 6/7-seat)',
    driveType: 'AWD (dual-motor)',
    motorPowerKw: 282.6,
    rangeStandard: 'WLTP',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: 20.2,
    consumptionMax: null,
    acChargingHours: 9.75,
    // 24 min for 10-80%, which is exactly the window this column documents.
    dcChargingMinutes: 24,
    batteryTech: 'Lithium-ion (high-energy-density NMC type)',
    lengthMm: 5015,
    widthMm: 1980,
    heightMm: 1780,
    wheelbaseMm: 3100,
    groundClearanceMm: 177,
    groundClearanceMaxMm: null,
    /*
      52 L is not a typo and not the car's luggage capacity in any normal sense.
      It is the space left behind the third row with all seats up, which is the
      only boot figure published for this car. `notes` says what it measures, and
      that there is no front boot to add to it.
    */
    bootCapacityL: 52,
    kerbWeightKg: 2670,
    availability: 'On sale in Pakistan since February 2025',
    distributor: 'Kia Lucky Motors',
    warranty: 'Not publicly confirmed — confirm terms with the dealer.',

    image: '/images/cars/kia-ev9-gt-line.jpg',
    notes:
      'Kia EV9 GT-Line. 99.8 kWh lithium-ion, 282.6 kW / 398 hp, 700 Nm, dual-motor AWD, ' +
      '0–100 in 5.3 s, top speed 200 km/h. 505 km on WLTP, which is Kia\'s own figure; some ' +
      'listings quote 561 km without naming a cycle, so the WLTP number is the one shown. ' +
      '20.2 kWh/100 km. AC 11 kW for about 9 h 45 min on a 220V/48A supply; DC 210 kW, ' +
      '10–80% in about 24 minutes, with some sources citing 350 kW on an 800V charger. CCS2 ' +
      'for DC and Type 2 for AC, on an architecture that takes both 400V and 800V. Seating is ' +
      'configurable as 6 or 7. 5015×1980×1780 mm, wheelbase 3100 mm, ground clearance ~177 mm, ' +
      'kerb ~2670 kg. The 52 L boot figure is the space behind the third row with every seat ' +
      'up, not the seats-folded volume, and there is no front boot. Real-world range and ' +
      'warranty terms are not published. On sale since February 2025 via Kia Lucky Motors.',
  },

  /*
    ── ALEKTRA: three locally assembled microcars ───────────────────────

    A different kind of row from everything above, and worth saying why several
    prominent fields are null rather than filled.

    These are quadricycle-class microcars sold with a *choice* of battery pack —
    7.2, 10.8 or 12.96 kWh — at a price that moves with the pack. `Car` has one
    `batteryCapacity` column and no `batteryCapacityMax`, so there is no honest
    single value: writing 7.2 would contradict the 180 km range, and writing
    12.96 would contradict the entry price. The three options are named in
    `notes`, and the range span carries the consequence.

    Motor output is the other gap, and it is a genuine source conflict rather
    than a missing figure. Listings variously say ~13 kW, 7 hp and 2.68 hp for
    the same car — and 13 kW is about 17 hp, so no two of those agree. The kW
    figure is the one that recurs, so it goes in `motorPowerKw`; `power` stays
    null because picking one hp number would be choosing a side in a
    contradiction. Both figures are recorded in `notes`.

    Charging is DC-incapable by design at this class, not unknown: `dcCharging`
    is null and `notes` says so explicitly, the same distinction the full hybrids
    carry. The 220V domestic supply has no published kW rating, so `acCharging`
    is null too — 1.8-2.2 kW is arithmetic from a wall socket, not a
    specification.

    `image` is null on all three, per the field's own rule: "Null until a real
    file exists." A path to a file that is not there renders a broken image,
    whereas null renders the brand-wordmark placeholder. The intended paths are
    /images/cars/alektra-mini-x2.jpg and siblings; set them when the files land.
  */
  {
    id: 'alektra-mini-x2',
    slug: 'alektra-mini-x2',
    brand: 'Alektra',
    model: 'MINI X2',
    variant: '2-door',
    fullName: 'Alektra MINI X2',
    category: 'EV',
    price: { min: lakh(10.95), max: lakh(11.95), display: 'PKR 10.95–11.95 Lakh' },
    batteryCapacity: null,
    batteryUnit: 'kWh',
    range: 80,
    rangeMax: 180,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: null,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['Type 2'],
    engineCapacity: null,
    torque: 120,
    topSpeed: 50,
    seats: 4,

    modelYear: 2026,
    bodyType: '2-door micro hatchback (quadricycle class)',
    driveType: null,
    motorPowerKw: 13,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion',
    lengthMm: 2450,
    widthMm: 1250,
    heightMm: 1650,
    wheelbaseMm: null,
    groundClearanceMm: 120,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'Sold in Pakistan; showroom at Liberty Parking Plaza, Lahore',
    distributor: 'ALEKTRA (Pakistan) — local assembly',
    warranty: 'Not publicly defined — confirm terms with the dealer.',

    image: null,
    notes:
      'Alektra microcar (quadricycle class), locally assembled. Motor output is reported ' +
      'inconsistently: ~13 kW in most listings, but 7 hp and 2.68 hp also appear for the same ' +
      'car, and 13 kW is about 17 hp — so no hp figure is quoted here. Torque ~120 Nm. Lithium ' +
      'pack offered as 7.2, 10.8 or 12.96 kWh; range tracks the pack, roughly 80–100 km on ' +
      '7.2 kWh, 130–140 km on 10.8 kWh and 170–180 km on 12.96 kWh, so no single battery ' +
      'figure is listed. Top speed 45–50 km/h. Charges from a 220V domestic outlet in about ' +
      '5–7 hours; no DC fast charging is supported at this class, and the 220V supply has no ' +
      'published kW rating. Charging is described as Type 2 AC, though a domestic socket is ' +
      'not itself a Type 2 connection. Ground clearance ~120 mm (approximate). No published ' +
      'boot volume (minimal) and no official kerb weight (understood to be under 700 kg). ' +
      'Single-speed automatic, R/N/D. Prices are approximate and move with the battery pack.',
  },
  {
    id: 'alektra-mini-x4',
    slug: 'alektra-mini-x4',
    brand: 'Alektra',
    model: 'MINI X4',
    variant: '4-door',
    fullName: 'Alektra MINI X4',
    category: 'EV',
    price: { min: lakh(12.45), max: lakh(13.95), display: 'PKR 12.45–13.95 Lakh' },
    batteryCapacity: null,
    batteryUnit: 'kWh',
    range: 80,
    rangeMax: 180,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: null,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['Type 2'],
    engineCapacity: null,
    torque: 120,
    topSpeed: 50,
    seats: 4,

    modelYear: 2026,
    bodyType: '4-door micro hatchback (quadricycle class)',
    driveType: null,
    motorPowerKw: 13,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion',
    lengthMm: 2450,
    widthMm: 1250,
    heightMm: 1650,
    wheelbaseMm: null,
    groundClearanceMm: 120,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'Sold in Pakistan; showroom at Liberty Parking Plaza, Lahore',
    distributor: 'ALEKTRA (Pakistan) — local assembly',
    warranty: 'Not publicly defined — confirm terms with the dealer.',

    image: null,
    notes:
      'Four-door version of the Alektra microcar, otherwise mechanically as the MINI X2. ' +
      'Motor output is reported inconsistently: ~13 kW in most listings, with 7 hp and 2.68 hp ' +
      'also appearing, and 13 kW is about 17 hp — so no hp figure is quoted here. Torque ' +
      '~120 Nm. Lithium pack offered as 7.2, 10.8 or 12.96 kWh; range tracks the pack, roughly ' +
      '80–180 km across the three, so no single battery figure is listed. Top speed ' +
      '45–50 km/h. Charges from a 220V domestic outlet in about 5–7 hours; no DC fast charging ' +
      'at this class. Charging is described as Type 2 AC, though a domestic socket is not ' +
      'itself a Type 2 connection. Ground clearance ~120 mm (approximate). No published boot ' +
      'volume and no official kerb weight (understood to be under 700 kg). Single-speed ' +
      'automatic, R/N/D. Price sources disagree: one listing opens at PKR 12.45 Lakh while ' +
      'others quote 12.95–13.95 Lakh by battery pack; the wider span is used here.',
  },
  {
    id: 'alektra-solar-mini-x4',
    slug: 'alektra-solar-mini-x4',
    brand: 'Alektra',
    model: 'Solar MINI X4',
    variant: '4-door, solar roof',
    fullName: 'Alektra Solar MINI X4',
    category: 'EV',
    /*
      "(indicative)" is load-bearing, not decoration.

      No price for this variant is published anywhere I could point to; it is
      known only to sit above the MINI X4. The catalogue's convention is to carry
      that caveat inside `price.display` so it travels to every surface that
      prints the figure — the card shows an "indicative price" chip off the back
      of this string. See the provenance note at the top of this file.
    */
    price: { min: lakh(13), max: lakh(13), display: 'PKR 13 Lakh (indicative)' },
    batteryCapacity: null,
    batteryUnit: 'kWh',
    range: 80,
    rangeMax: 180,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: null,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['Type 2'],
    engineCapacity: null,
    torque: 120,
    topSpeed: 50,
    seats: 4,

    modelYear: 2026,
    bodyType: '4-door micro hatchback with solar roof (quadricycle class)',
    driveType: null,
    motorPowerKw: 13,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion',
    lengthMm: 2450,
    widthMm: 1250,
    heightMm: 1650,
    wheelbaseMm: null,
    groundClearanceMm: 120,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'Sold in Pakistan; showroom at Liberty Parking Plaza, Lahore',
    distributor: 'ALEKTRA (Pakistan) — local assembly',
    warranty: 'Not publicly defined — confirm terms with the dealer.',

    image: null,
    notes:
      'The MINI X4 with a solar roof, which the maker credits with an estimated 50–60 km of ' +
      'additional range on top of the pack. That extension is not added to the range figures ' +
      'here: it is a claim about sunlight rather than a test result, and folding it in would ' +
      'produce a number no source published. PRICE IS UNCONFIRMED — no published figure was ' +
      'found; it is known only to sit above the base MINI X4, so roughly PKR 13 Lakh is ' +
      'carried as indicative and should be checked with the dealer before publication. ' +
      'Otherwise as the MINI X4: ~13 kW motor (listings also say 7 hp and 2.68 hp, which do ' +
      'not agree with each other or with 13 kW ≈ 17 hp), ~120 Nm, lithium pack of 7.2, 10.8 ' +
      'or 12.96 kWh, 80–180 km, top speed 45–50 km/h, 220V domestic charge 5–7 hours, no DC ' +
      'fast charging. Ground clearance ~120 mm (approximate). No published boot volume or ' +
      'official kerb weight. Single-speed automatic, R/N/D.',
  },

  // ─── PHEV / REEV ──────────────────────────────────────────────────
  {
    id: 'chery-tiggo-7-phev',
    slug: 'chery-tiggo-7-phev',
    brand: 'Chery',
    model: 'Tiggo 7 PHEV',
    variant: null,
    fullName: 'Chery Tiggo 7 PHEV',
    category: 'PHEV',
    /*
      PKR 9,499,000, down from the 9,999,000 this row carried.

      The two are the ex-factory price and a promotional one, and the row was
      holding the promo. The lower figure is the one Chery's own intro pricing
      states, so it takes the field and the promo is recorded in `notes` — a
      promotional price is a moment, not a specification.
    */
    price: { min: lakh(94.99), max: lakh(94.99), display: 'PKR 94.99 Lakh' },
    batteryCapacity: 18.3,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 90,
    electricRangeMax: null,
    power: 342,
    powerUnit: 'hp',
    acceleration: 8.4,
    accelerationUnit: 'sec',
    dcCharging: 40,
    dcChargingUnit: 'kW',
    /*
      7 kW, replacing 6.6 kW.

      Two chargers ship with the car: a 3 kW portable unit and a 7 kW wallbox.
      The wallbox is the faster of the two supplied and is what an owner charges
      on, so it is the headline. Where 6.6 came from is not recorded; both
      supplied rates are named in `notes` so neither is lost.
    */
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: 1499,
    torque: 525,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'SUV (5-door, 5-seat)',
    driveType: 'FWD',
    motorPowerKw: 255,
    rangeStandard: 'WLTP',
    realWorldRange: 70,
    realWorldRangeMax: 90,
    /*
      `consumption` is kWh/100 km. This car's published economy is 13-18 km/L, a
      fuel figure for the engine side of a plug-in hybrid, which the column cannot
      express. It is in `notes`, as is the ~1,200 km combined range — `range` stays
      null because for a PHEV this catalogue uses `electricRange` and a
      tank-plus-battery total is not a driving range on electricity.
    */
    consumption: null,
    consumptionMax: null,
    /*
      Null: the full-charge figure is quoted as a 5-6 hour span and this column is
      one number. The much-quoted "~2 h" is a 20-80% partial on the 7 kW wallbox,
      not a full charge, so it does not belong here either. Both are in `notes`.
    */
    acChargingHours: null,
    // Published for 30-80%; this column is 10-80%. Different window, so `notes`.
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion (LFP not confirmed)',
    lengthMm: 4553,
    widthMm: 1862,
    heightMm: 1696,
    wheelbaseMm: 2670,
    groundClearanceMm: 175,
    groundClearanceMaxMm: null,
    bootCapacityL: 565,
    kerbWeightKg: 1785,
    availability: 'On sale; deliveries from around April–June 2026',
    distributor: 'Master Chery (Chery Pakistan)',
    warranty: 'Battery 8 years / 160,000 km; vehicle 6 years / 150,000 km',

    image: '/images/cars/chery-tiggo-7-phev.jpg',
    notes:
      'Chery Tiggo 7 Premium PHEV FWD. 1.5L TGDi 1499 cc with a hybrid DHT, 255 kW / 342 hp ' +
      'system output (some sources 341 hp), 525 Nm, FWD, 0–100 in 8.4 s, top speed 180 km/h. ' +
      '18.3 kWh battery, about 90 km electric-only on WLTP (Chery claims 90+), combined range ' +
      'about 1,200 km from the 60 L tank, and roughly 13–18 km/L on the combined cycle — a fuel ' +
      'figure, which the kWh/100 km column cannot hold. Real-world electric range is nearer ' +
      '70–90 km. Two chargers are supplied: a 3 kW portable and a 7 kW wallbox, the latter ' +
      'shown above; a full AC charge takes about 5–6 hours and 20–80% about 2 hours on the ' +
      'wallbox, so no single full-charge figure is stored. DC 40 kW, 30–80% in about 19 minutes ' +
      '— a different window from the 10–80% figure this catalogue shows, so it is not stored ' +
      'either. CCS2 for DC and Type 2 for AC. 5 seats, 8 airbags, 565 L boot, kerb 1785 kg, ' +
      '4553×1862×1696 mm, wheelbase 2670 mm, ground clearance 175 mm. PKR 9,499,000 ' +
      'ex-factory; some later listings show a 9,999,000 promotional price. Battery warranted ' +
      '8 years / 160,000 km and the vehicle 6 years / 150,000 km. Sold by Master Chery. The ' +
      'pack is lithium-ion; whether it is LFP is not confirmed.',
  },
  {
    id: 'deepal-s05-reev',
    slug: 'deepal-s05-reev',
    brand: 'Deepal',
    model: 'S05 REEV',
    variant: null,
    fullName: 'Deepal S05 REEV',
    category: 'REEV',
    price: { min: lakh(99.99), max: lakh(99.99), display: 'PKR 99.99 Lakh' },
    batteryCapacity: 27.3,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    /*
      145 km, down from the 170 km this row carried, and now with WLTP named.

      Both figures circulate for this car and 170 is the more flattering, which is
      usually the sign of a looser cycle — the Tiggo 9 turned out exactly that way,
      NEDC 170 against WLTP 145 on a different car. Here 145 is the figure that
      arrives with a cycle attached, and a number whose test is known beats one
      whose test is not. The displaced 170 is recorded in `notes`, not deleted,
      because it is probably true of some cycle; we just cannot say which.
    */
    electricRange: 145,
    electricRangeMax: null,
    power: 215,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 54.5,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    // CCS2 added: the car takes 54.5 kW DC, which Type 2 alone cannot deliver.
    connector: ['CCS2', 'Type 2'],
    // 1497 cc kept for the 1.5-litre range-extender. The research gives its output
    // (94 hp) but no displacement, and 1497 is the figure this row already held.
    engineCapacity: 1497,
    torque: 320,
    topSpeed: 170,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Mid-size SUV (5-door, 5-seat)',
    driveType: 'RWD',
    motorPowerKw: 160,
    rangeStandard: 'WLTP',
    realWorldRange: 110,
    realWorldRangeMax: 130,
    /*
      `consumption` is kWh/100 km. This car's 20-24 km/L is a fuel figure for the
      generator side, which the column cannot express, so it sits in `notes` along
      with the 1,012 km combined WLTP total. `range` stays null: for a REEV this
      catalogue puts the electric figure in `electricRange`, and a
      battery-plus-tank total is not a range on electricity.
    */
    consumption: null,
    consumptionMax: null,
    acChargingHours: 8.5,
    // Published as 30-80% in 20-25 min: wrong window for this column and a span
    // besides. Both problems, so it stays in `notes`.
    dcChargingMinutes: null,
    batteryTech: 'Lithium iron phosphate (LFP)',
    /*
      No external dimension is confirmed for this car. The wheelbase is (2880 mm),
      which is why it appears alone below — a wheelbase without a length looks like
      an oversight, so `notes` says the others are missing rather than unconsidered.
    */
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    wheelbaseMm: 2880,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale; booking around PKR 2,000,000',
    distributor: 'Master Changan (Deepal Pakistan)',
    warranty: 'Not confirmed. An 8-year battery term is typical for the segment but is not published for this car.',

    image: '/images/cars/deepal-s05-reev.jpg',
    notes:
      'Deepal S05 REEV Premium, a range-extended EV: the wheels are driven only by the electric ' +
      'motor and the 1.5-litre petrol engine acts as a generator. 27.3 kWh LFP battery, RWD, ' +
      'combined 215 hp and 320 Nm, with the generator itself rated 94 hp. Electric-only range ' +
      '145 km on WLTP and up to 1,012 km combined on WLTP from the 45 L tank; real-world ' +
      'electric range is nearer 110–130 km. This row previously showed 170 km electric-only ' +
      'with no cycle named — the more flattering figure, which usually indicates a looser test ' +
      '— so the WLTP number is shown instead and the 170 km is kept here for reference. Fuel ' +
      'economy 20–24 km/L, which the kWh/100 km column cannot express. AC 6.6 kW for a full ' +
      'charge in 8.5 hours, DC 54.5 kW with 30–80% in about 20–25 minutes — both a span and a ' +
      'different window from the 10–80% figure shown elsewhere here, so it is not stored. ' +
      'Vehicle-to-load output up to 6.6 kW. CCS2 for DC, Type 2 for AC. Top speed 170 km/h; no ' +
      '0–100 time is published. 5 seats, 6 airbags, full ADAS, a 15.4-inch display with ' +
      'head-up display, 14-speaker audio, panoramic roof and wireless CarPlay and Android Auto. ' +
      'Wheelbase 2880 mm; external length, width, height, ground clearance, boot volume and ' +
      'kerb weight are all unconfirmed and left blank rather than estimated from the class. ' +
      'PKR 9,999,000 with booking around PKR 2,000,000. Warranty not confirmed. Sold by Master ' +
      'Changan.',
  },
  {
    id: 'forthing-friday-reev',
    slug: 'forthing-friday-reev',
    brand: 'Forthing',
    model: 'Friday REEV',
    variant: null,
    fullName: 'Forthing Friday REEV',
    category: 'REEV',
    price: { min: lakh(99.99), max: lakh(99.99), display: 'PKR 99.99 Lakh' },
    batteryCapacity: 31.94,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 220,
    electricRangeMax: null,
    power: 161,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 120,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1498,
    torque: null,
    topSpeed: null,
    seats: null,
    image: null,
    notes: null,
  },
  {
    /*
      Filled out for the 2026 model year. Three notes on what is NOT here.

      `dcCharging` stays 40 kW. The supplied column says the DC rate is not
      confirmed, and "the current research could not confirm it" is not evidence
      against a figure the price list stated. Deleting it would lose information
      rather than correct any. Flagged in `notes` as needing confirmation.

      `lengthMm` is null. Both supplied candidates are hedged — "about 4500 mm"
      and "about 4512 mm typical" — and neither is a published Pakistan figure.
      Width, height and wheelbase were given firmly and are stored.

      `consumption` is null. The supplied figure is 16.5-16.6 km/L, a fuel
      economy for the petrol engine; this column is kWh/100 km. Converting
      between them is not possible and storing one under the other's label would
      be wrong, so the km/L figure is in `notes`.
    */
    id: 'jaecoo-j7-phev',
    slug: 'jaecoo-j7-phev',
    brand: 'JAECOO',
    model: 'J7 PHEV',
    // Two variants, Comfort and Premium, which differ on equipment and price
    // rather than on any figure below.
    variant: null,
    fullName: 'JAECOO J7 PHEV',
    category: 'PHEV',
    // Comfort 10,499,000 / Premium 10,999,000, both post-December 2025. The
    // introductory 9,999,000 is in `notes`.
    price: { min: crore(1.0499), max: crore(1.0999), display: 'PKR 1.05–1.10 Cr' },
    batteryCapacity: 18.3,
    batteryUnit: 'kWh',
    // Null for a PHEV, as everywhere else in this file. The combined figure of
    // about 1,200 km is in `notes`.
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 90,
    electricRangeMax: null,
    // Combined system output of the 1.5-litre turbo and the DHT.
    power: 342,
    powerUnit: 'hp',
    acceleration: 8.5,
    accelerationUnit: 'sec',
    dcCharging: 40,
    dcChargingUnit: 'kW',
    acCharging: 3.3,
    acChargingUnit: 'kW',
    // Type 2 for AC. No DC connector standard was stated, so none is claimed.
    connector: ['Type 2'],
    // 1498 cc, kept from the price list. The 2026 research says 1499 cc; a
    // one-cc difference is a rounding of the same engine and is not stored twice.
    engineCapacity: 1498,
    torque: 525,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Mid-size SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: null,
    rangeStandard: 'WLTP',
    // The EV-only expectation, not a combined figure. Said explicitly in `notes`.
    realWorldRange: 70,
    realWorldRangeMax: 90,
    consumption: null,
    consumptionMax: null,
    // Published as a 5.5-7 hour span on a roughly 3 kW portable charger, and
    // this column holds one number. The span is in `notes`.
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion',
    lengthMm: null,
    widthMm: 1862,
    heightMm: 1696,
    wheelbaseMm: 2672,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale; deliveries from December 2025, booking about 2,000,000.',
    distributor: 'NexGen Auto (Nishat Group) — JAECOO Pakistan',
    warranty: 'Vehicle 6 years / 150,000 km; battery 8 years / 160,000 km.',

    image: '/images/cars/jaecoo-j7-phev.jpg',
    notes:
      'JAECOO J7 PHEV in two variants, Comfort at PKR 10,499,000 and Premium at 10,999,000; ' +
      'the introductory price was 9,999,000 and booking is about 2,000,000. A 1.5-litre turbo ' +
      'petrol engine of 1498 cc (quoted as 1499 cc by some sources) with a dedicated hybrid ' +
      'transmission, combined 342 hp and 525 Nm, FWD, 8.5 s 0–100, 180 km/h. 18.3 kWh ' +
      'lithium-ion pack, 90 km of electric-only range on WLTP, and a combined range of about ' +
      '1,200 km on a 60-litre tank. The 70–90 km real-world figure shown above is the ' +
      'ELECTRIC-ONLY expectation, not the combined range. FUEL ECONOMY: about 16.5–16.6 km/L ' +
      'combined, which cannot be stored in the kWh/100 km consumption field. Charges at ' +
      '3.3 kW, and a roughly 3 kW portable charger is quoted at 5.5–7 hours — a span, so no ' +
      'single AC time is stored. DC RATE NEEDS CONFIRMING: the 40 kW above comes from the ' +
      'price list and the 2026 research could not confirm any DC figure; no DC connector ' +
      'standard was stated either. 5 seats, 8 airbags on the Premium, level 2 driver ' +
      'assistance, 19-inch wheels. Width 1862 mm, height 1696 mm, wheelbase 2672 mm; LENGTH ' +
      'IS UNRESOLVED — quoted only as about 4500 mm and about 4512 mm, neither a published ' +
      'Pakistan figure, so it is left blank. Ground clearance is described as high but never ' +
      'stated; boot volume and kerb weight were not published. NexGen Auto (Nishat Group).',
  },
  {
    /*
      Filled out for the 2026 model year. Price is unchanged at PKR 10,649,000.

      Two supplied figures were not written into their fields.

      `acCharging` stays 7.4 kW, the price list's exact figure. The 2026 research
      quotes "about 6.6 kW", hedged, and an approximate figure does not displace
      an exact one. Both are in `notes`.

      `dcCharging` stays 40 kW for the same reason it does on jaecoo-j7-phev: the
      research could not confirm a DC rate, which is not evidence against the
      figure the price list stated.
    */
    id: 'omoda-7',
    slug: 'omoda-7',
    brand: 'Omoda',
    model: '7',
    // NexGen sells one trim, the SHS-P, so the row describes one car and can say
    // which.
    variant: 'SHS-P',
    fullName: 'Omoda 7',
    category: 'PHEV',
    price: { min: crore(1.0649), max: crore(1.0649), display: 'PKR 1.0649 Cr' },
    batteryCapacity: 18.4,
    batteryUnit: 'kWh',
    // Null for a PHEV. The combined figure of about 1,200-1,250 km is in `notes`.
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 90,
    electricRangeMax: null,
    power: 341,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 40,
    dcChargingUnit: 'kW',
    acCharging: 7.4,
    acChargingUnit: 'kW',
    // Type 2 for AC. No DC connector standard was stated, so none is claimed.
    connector: ['Type 2'],
    engineCapacity: 1498,
    torque: 525,
    /*
      Null. "About 180 km/h" was offered as a class expectation rather than a
      published figure for this car, and this column is read as a specification.
      It is in `notes` as the unconfirmed thing it is.
    */
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Mid-size SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: null,
    rangeStandard: 'WLTP',
    // The EV-only expectation, not a combined figure. Said explicitly in `notes`.
    realWorldRange: 70,
    realWorldRangeMax: 90,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion',
    lengthMm: 4660,
    widthMm: 1875,
    heightMm: 1670,
    wheelbaseMm: 2720,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability:
      'Launched 31 August 2026, booking about 2,000,000. A price lock was quoted to 31 August 2026, which has now passed — confirm the current price.',
    distributor: 'NexGen Auto (Omoda Pakistan)',
    warranty:
      'Typically 6 years / 150,000 km on the vehicle and 8 years / 160,000 km on the battery, but not confirmed for this car — check the dealer\'s terms.',

    image: '/images/cars/omoda-7.jpg',
    notes:
      'Omoda 7 SHS-P. A 1.5-litre turbo petrol engine of 1498 cc with a dedicated hybrid ' +
      'transmission, combined 341 hp and 525 Nm, FWD. 18.4 kWh lithium-ion pack. Electric ' +
      'range is published as "90+ km" on WLTP, so 90 is a floor rather than a point figure, ' +
      'and the combined range is quoted at about 1,200–1,250 km. The 70–90 km real-world ' +
      'figure shown above is the ELECTRIC-ONLY expectation, not the combined range. AC ' +
      'CHARGING DISAGREES: 7.4 kW above is the price list\'s figure and the 2026 research says ' +
      'about 6.6 kW; the exact figure was kept. DC RATE NEEDS CONFIRMING: the 40 kW above ' +
      'comes from the price list and the research could not confirm any DC figure, nor a DC ' +
      'connector standard, nor an AC charge time. TOP SPEED IS NOT PUBLISHED: about 180 km/h ' +
      'is a class expectation rather than a figure for this car, so the field is blank. ' +
      '8 airbags, 15.6-inch screen, 20-inch wheels, panoramic roof, 5 seats. ' +
      '4660×1875×1670 mm, wheelbase 2720 mm. PKR 10,649,000 with booking about 2,000,000; the ' +
      'quoted price lock ran to 31 August 2026 and has passed. NexGen Auto. 0–100 km/h, ' +
      'ground clearance, boot volume, kerb weight and consumption were not published, and the ' +
      'warranty terms above are class-typical rather than confirmed.',
  },
  {
    id: 'chery-tiggo-8-phev',
    slug: 'chery-tiggo-8-phev',
    brand: 'Chery',
    model: 'Tiggo 8 PHEV',
    variant: null,
    fullName: 'Chery Tiggo 8 PHEV',
    category: 'PHEV',
    // PKR 11,299,000, replacing 11,500,000. Three figures circulate — an intro
    // 10,999,000, this one, and an 11,499,000 promo. All three are in `notes`.
    price: { min: crore(1.1299), max: crore(1.1299), display: 'PKR 1.13 Cr' },
    /*
      18.3 kWh, replacing the 19.27 kWh this row held.

      Both are reported for this car. 18.3 is the figure Chery states and the same
      pack the Tiggo 7 PHEV carries, which is the more likely reading of a shared
      platform; 19.27 appears in secondary reports. The displaced figure is kept
      in `notes` rather than deleted, because it is not obviously wrong — just
      less well sourced.
    */
    batteryCapacity: 18.3,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    /*
      77 km WLTP, replacing 90 km.

      90 km is the Tiggo 7's WLTP figure and this is the heavier seven-seat AWD
      car, so the two should not agree. 77 km is the figure published for this
      model on WLTP, and the cycle is now named alongside it.
    */
    electricRange: 77,
    electricRangeMax: null,
    /*
      496 hp, and the disagreement here is wide enough to name.

      Three combined outputs circulate for this car: 496 hp, 543 hp, and 320 hp.
      496 is the one the Pakistani launch material uses and it is what this row
      already carried, so it stays; the other two are in `notes`. Torque splits the
      same way, 735 Nm against 830 Nm.
    */
    power: 496,
    powerUnit: 'hp',
    /*
      Null. A "~7 s" from "some reports" with an instruction to confirm is not a
      published acceleration time, and this column would present it as one.
      Recorded in `notes` as the unconfirmed report it is.
    */
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: 40,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: 1499,
    torque: 735,
    topSpeed: 180,
    seats: 7,

    modelYear: 2026,
    bodyType: 'SUV (5-door, 7-seat)',
    driveType: 'AWD (4WD)',
    // Combined output is quoted as a 320-380 kW span, which one column cannot
    // hold. The hp figure above carries the headline; the span is in `notes`.
    motorPowerKw: null,
    rangeStandard: 'WLTP',
    realWorldRange: 65,
    realWorldRangeMax: 80,
    consumption: null,
    consumptionMax: null,
    // 10-100% in about 180 minutes, which is a full charge — exactly this column.
    acChargingHours: 3,
    // Published for 30-80%; this column is 10-80%. See `notes`.
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion (LFP not confirmed)',
    lengthMm: 4725,
    widthMm: 1860,
    heightMm: 1705,
    wheelbaseMm: 2710,
    /*
      Three blanks with no source behind them, and they stay blank.

      Ground clearance, boot volume and kerb weight are all unconfirmed for this
      car. Plausible values exist — around 170-180 mm, a small third-row boot,
      something near two tonnes — but every one of those is inference from the
      class rather than a figure anybody published, and this column would render
      them as fact. `notes` says they are missing.
    */
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'Launched January 2026; deliveries from around April 2026',
    distributor: 'Master Chery (Chery Pakistan)',
    warranty: 'Battery 8 years / 160,000 km and vehicle 6 years / 150,000 km reported as the typical Chery terms — not confirmed for this model.',

    image: '/images/cars/chery-tiggo-8-phev.jpg',
    notes:
      'Chery Tiggo 8 Premium PHEV 4WD, a seven-seater. 1.5L turbo 1499 cc with dual motors, ' +
      'AWD, top speed 180 km/h. Combined output is reported inconsistently: 496 hp / 735 Nm is ' +
      'shown above as the launch figure, but 543 hp / 830 Nm and a much lower 320 hp also ' +
      'appear, and combined motor power is quoted as a 320–380 kW span that one column cannot ' +
      'hold. 0–100 is put at about 7 s by some reports but is not confirmed, so it is not ' +
      'stored. 18.3 kWh battery — some reports say 19.27 kWh, which this row previously carried ' +
      '— giving 77 km electric-only on WLTP and a combined 1,020–1,200 km from the 60 L tank; ' +
      'real-world electric range is nearer 65–80 km. Energy consumption is not published. AC ' +
      '6.6 kW, 10–100% in about 3 hours; DC 40 kW, 30–80% in about 20 minutes, which is a ' +
      'different window from the 10–80% figure shown elsewhere here. CCS2 for DC, Type 2 for ' +
      'AC, with vehicle-to-load output. 10 airbags, a 15.6-inch 2.5K screen, 12-speaker Sony ' +
      'audio and a panoramic roof. 4725×1860×1705 mm, wheelbase 2710 mm. Ground clearance, ' +
      'boot volume and kerb weight are all unconfirmed and left blank rather than estimated. ' +
      'PKR 11,299,000, with an introductory 10,999,000 and a promotional 11,499,000 also ' +
      'quoted. Sold by Master Chery; warranty terms reported but unconfirmed.',
  },
  {
    id: 'chery-tiggo-9-phev',
    slug: 'chery-tiggo-9-phev',
    brand: 'Chery',
    model: 'Tiggo 9 PHEV',
    variant: null,
    fullName: 'Chery Tiggo 9 PHEV',
    category: 'PHEV',
    // 14,299,000 exactly, where the row rounded to 14,300,000. The display string
    // is unchanged, so nothing moves on the page. Intro price 13,694,000 in `notes`.
    price: { min: crore(1.4299), max: crore(1.4299), display: 'PKR 1.43 Cr' },
    batteryCapacity: 34.46,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    /*
      145 km, and this is a cycle correction rather than a new number.

      The 170 km this row carried is the NEDC figure; 145 km is WLTP for the same
      car. NEDC reads high, so the two are not rival claims about one measurement
      — they are two measurements, and only one of them can sit next to a
      `rangeStandard` of WLTP. The NEDC pair (170 km electric, 1,400 km combined)
      is kept in `notes` with its cycle named, which is the whole point.
    */
    electricRange: 145,
    electricRangeMax: null,
    power: 610,
    powerUnit: 'hp',
    // 5.4 s is a specific global test figure, unlike the Tiggo 8's vague "~7 s",
    // so it is stored. Not independently confirmed for Pakistan — see `notes`.
    acceleration: 5.4,
    accelerationUnit: 'sec',
    /*
      71 kW kept, against a reported 40-60 kW.

      This row's existing 71 kW is a specific figure; what the new research offers
      is a span with a "confirm" attached and a separate "~50 kW" report. Replacing
      something precise with the middle of an unconfirmed range would be a
      downgrade dressed as an update. Same reasoning holds for AC, where 6.6 kW
      stays against a reported "11 kW (approx; confirm rate)". Both reported
      figures are in `notes`, and both fields are flagged for confirmation.
    */
    dcCharging: 71,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: 1499,
    torque: 920,
    topSpeed: 180,
    seats: 7,

    modelYear: 2026,
    bodyType: 'SUV (5-door, 7-seat flagship)',
    driveType: 'AWD',
    motorPowerKw: 455,
    rangeStandard: 'WLTP',
    realWorldRange: 100,
    realWorldRangeMax: 120,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 5,
    // 10-80% in about 24 minutes — the window this column documents, so it fits.
    dcChargingMinutes: 24,
    batteryTech: 'Lithium-ion (LFP or NMC not confirmed)',
    lengthMm: 4810,
    widthMm: 1925,
    heightMm: 1741,
    wheelbaseMm: 2800,
    groundClearanceMm: 183,
    groundClearanceMaxMm: null,
    // Not published for the seven-seat flagship. See `notes`.
    bootCapacityL: null,
    kerbWeightKg: 2308,
    availability: 'Launched around February 2026; open for booking',
    distributor: 'Master Chery (Chery Pakistan)',
    warranty: 'Battery around 8 years / 160,000 km and vehicle around 6 years / 150,000 km — reported, not confirmed.',

    image: '/images/cars/chery-tiggo-9-phev.jpg',
    notes:
      'Chery Tiggo 9 Premium PHEV AWD, the seven-seat flagship. 1.5L turbo 1499 cc with three ' +
      'motors, 455 kW / 610 hp combined, 920 Nm, AWD, top speed 180 km/h, 0–100 in about 5.4 s ' +
      'on a global test figure not independently confirmed for Pakistan. 34.46 kWh battery ' +
      'giving 145 km electric-only on WLTP and about 1,190 km combined from the 70 L tank. ' +
      'Separate NEDC figures of 170 km electric and 1,400 km combined also circulate — NEDC ' +
      'reads high against WLTP and the two are not interchangeable, so the WLTP pair is shown ' +
      'and this row previously held the NEDC 170 km. Real-world electric range is nearer ' +
      '100–120 km. Energy consumption is not published. AC and DC rates need confirming: 6.6 kW ' +
      'AC and 71 kW DC are shown as the previously authored figures, while newer research ' +
      'reports about 11 kW AC and 40–60 kW DC (some say ~50 kW). A full AC charge takes about ' +
      '5 hours and DC 10–80% about 24 minutes. CCS2 for DC, Type 2 for AC. 10 airbags, ADAS, a ' +
      '15.6-inch screen, 14-speaker Sony audio, 20-inch alloys and a panoramic roof. ' +
      '4810×1925×1741 mm, wheelbase 2800 mm, ground clearance 183 mm, kerb 2308 kg; boot volume ' +
      'is not published. PKR 14,299,000, introductory price 13,694,000. Sold by Master Chery. ' +
      'Cell chemistry is lithium-ion; whether LFP or NMC is not stated.',
  },
  {
    id: 'haval-h6-phev',
    slug: 'haval-h6-phev',
    brand: 'Haval',
    model: 'H6 PHEV',
    variant: null,
    fullName: 'Haval H6 PHEV',
    category: 'PHEV',
    price: { min: crore(1.2895), max: crore(1.2895), display: 'PKR 1.2895 Cr' },
    /*
      The most important null in this file, and it must stay null.

      Pakistan's H6 GT PHEV runs a 35.43 kWh pack at 430 hp / 642 Nm — and it is a
      different car from this one. That figure is the obvious thing to reach for
      when filling this blank, and reaching for it would put a sportier model's
      battery on a standard H6 PHEV's page. No capacity is published for the
      standard car, so none is stored, and `notes` names the GT explicitly so the
      next person to look does not make the substitution either.

      Everything downstream of the battery — electric-only range, charge rates,
      charge times, connector — is unpublished for the same reason and stays blank.
      A plug-in hybrid with no electric range on its page looks incomplete because
      it is, and that is more honest than a borrowed number.
    */
    batteryCapacity: null,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 360,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    // A portable AC charger is reported as available, but at no stated rate.
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    // 1499 cc kept; some listings say 1498, a rounding difference on one engine.
    engineCapacity: 1499,
    torque: 760,
    /*
      Null, unlike the HEV sibling. There the research named 180 km/h as the trim's
      figure with 180-220 as the line-wide span; here only the 40 km/h span itself
      is given, and its lower bound is not a published top speed for this car.
    */
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Mid-size SUV (5-door, 5-seat)',
    driveType: 'AWD',
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4703,
    widthMm: 1886,
    heightMm: 1730,
    wheelbaseMm: 2738,
    groundClearanceMm: 175,
    groundClearanceMaxMm: null,
    bootCapacityL: 600,
    kerbWeightKg: 1980,
    availability: 'On sale in Pakistan as the top-of-line H6 variant',
    distributor: 'Sazgar Engineering / GWM Pakistan',
    warranty: 'Not confirmed — confirm terms with the dealer.',

    image: '/images/cars/haval-h6-phev.jpg',
    notes:
      'Haval H6 PHEV, the plug-in trim and top of the H6 line. 1.5-litre 1499 cc turbo ' +
      'plug-in hybrid, AWD per PakWheels, combined about 360 hp and 760 Nm. 5 seats, boot ' +
      '~600 L, kerb ~1980 kg, 4703×1886×1730 mm, wheelbase 2738 mm, ground clearance ~175 mm. ' +
      'Left blank above because they are not published for the standard H6 PHEV: battery ' +
      'capacity, electric-only range, AC and DC charge rates, charge times, connector ' +
      'standard, battery chemistry, 0–100 time and top speed. A portable AC charger is ' +
      'reported as supplied but at no stated rate. Top speed is quoted only as a 180–220 km/h ' +
      'span across the H6 line, which is not a figure for this car. Fuel economy is reported ' +
      'as 9–56 km/L, a span so wide it cannot be a single measurement and is not usable. ' +
      'IMPORTANT: the sportier H6 GT PHEV sold in Pakistan is a different model with a ' +
      '35.43 kWh pack and 430 hp / 642 Nm — those figures must not be applied to this row. ' +
      'Some listings give the engine as 1498 cc. PKR 12,895,000 via Sazgar Engineering / GWM ' +
      'Pakistan. Warranty not confirmed.',
  },
  {
    /*
      The 2026 Super Hybrid, and the row was carrying two generations at once.

      It already held the new 24.7 kWh pack but a 63 km electric range, and the
      arithmetic shows those cannot be the same car: 63 km from 24.7 kWh implies
      39.2 kWh/100 km, which no plug-in hybrid achieves, while the old 16.6 kWh
      pack over 63 km gives 26.3 and the new pack over 98 km gives 25.2 — the same
      efficiency, one generation apart. So 63 km was the previous generation's
      figure left behind when the battery was updated, and it is corrected here
      rather than kept as a matched pair with a battery it contradicts.

      Price moved with it, 9,899,000 to 10,199,000, for the same reason: a row
      describing the new car should not quote the old car's money. Both changes
      overwrite authored values and are called out in the report for review.
    */
    id: 'mg-hs-phev',
    slug: 'mg-hs-phev',
    brand: 'MG',
    model: 'HS PHEV',
    variant: null,
    fullName: 'MG HS PHEV',
    category: 'PHEV',
    price: { min: lakh(101.99), max: lakh(101.99), display: 'PKR 1.02 Cr' },
    batteryCapacity: 24.7,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 98,
    electricRangeMax: null,
    power: 295,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 3.7,
    acChargingUnit: 'kW',
    /*
      Type 2 on the strength of the AC rate above, not on a spec sheet.

      A car that charges at 3.7 kW AC has an AC socket, and every plug-in in this
      catalogue uses Type 2 for it in this market. Whether the Super Hybrid also
      takes DC — and therefore CCS2 — is not stated anywhere I could point to, so
      only the connector the charging figure proves is listed. `notes` says the DC
      side is unconfirmed rather than absent.
    */
    connector: ['Type 2'],
    engineCapacity: 1496,
    torque: null,
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    /*
      Body figures shared with the `mg-hs-hev` sibling, which is the same gen-2 HS
      shell. Boot volume is deliberately not shared: a 24.7 kWh pack has to go
      somewhere, and the Hybrid+'s 448 L almost certainly does not survive it
      unchanged. Better blank than borrowed.
    */
    bodyType: 'SUV (5-door, 5-seat)',
    driveType: 'FWD',
    lengthMm: 4655,
    widthMm: 1890,
    heightMm: 1660,
    availability: 'Sold in Pakistan by MG Pakistan',
    distributor: 'MG Pakistan (mgmotors.com.pk)',
    warranty: 'Confirm terms with the dealer.',

    image: '/images/cars/mg-hs-phev.jpg',
    notes:
      '2026 second-generation MG HS Super Hybrid, the plug-in trim. 24.7 kWh battery, 98 km ' +
      'electric range on EPA, combined 295 hp. AC charging 3.7 kW. PKR 10,199,000 ex-factory ' +
      'via MG Pakistan, shown above as PKR 1.02 Cr. This row previously paired the new 24.7 kWh ' +
      'pack with a 63 km electric range and the PKR 9,899,000 price; 63 km belongs to the ' +
      'previous generation\'s 16.6 kWh pack on efficiency grounds, so both were corrected to ' +
      'the current car. Type 2 is listed for AC charging on the strength of the 3.7 kW rate; ' +
      'whether this trim also accepts DC, and so CCS2, is not published and is still to be ' +
      'confirmed. 5 seats, FWD. Body dimensions ~4655×1890×1660 mm, shared with the Hybrid+ ' +
      'and approximate; boot volume is not carried over from that car because the battery ' +
      'takes space from it. Sold alongside the self-charging MG HS Hybrid+, a separate entry.',
  },
  {
    id: 'gwm-tank-500-phev',
    slug: 'gwm-tank-500-phev',
    brand: 'GWM',
    model: 'Tank 500 PHEV',
    variant: null,
    fullName: 'GWM Tank 500 PHEV',
    category: 'PHEV',
    price: { min: crore(2.25), max: crore(2.25), display: 'PKR 2.25 Cr' },
    batteryCapacity: 37.11,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 80,
    electricRangeMax: 90,
    power: 402,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1998,
    torque: null,
    topSpeed: null,
    seats: null,
    image: '/images/cars/gwm-tank-500-phev.jpg',
    notes: 'Electric range quoted as an 80–90 km span.',
  },
  // ─── Hybrid ───────────────────────────────────────────────────────
  //
  // Full hybrids: no plug, no charging port, and no electric-only range worth
  // quoting. They are here because they are the electrified cars most people in
  // Pakistan actually buy, and a catalogue that omitted them would send anyone
  // shopping for a Corolla Cross or a Jolion somewhere else.
  {
    /*
      The second of two 2026 MG HS trims, and a separate row on purpose.

      MG Pakistan sells the gen-2 HS as Hybrid+ (this row: self-charging, no
      plug) and as Super Hybrid (`mg-hs-phev`: plug-in, 24.7 kWh). They are
      different powertrains, so folding them together would put an electric-only
      range against a car that has no plug. `connector` is null and stays null:
      that is what makes the card read "no charging port" rather than leaving a
      reader to wonder whether the data is simply missing.

      Note that this row's model string carries the powertrain, matching its
      `mg-hs-phev` sibling. Both would model better as `model: 'HS'` with
      `variant: 'Hybrid+'` / `'Super Hybrid'`, which is also what Phase 4.1 needs
      to tell the two apart. That is a slug-adjacent change and is not made here.
    */
    id: 'mg-hs-hev',
    slug: 'mg-hs-hev',
    brand: 'MG',
    model: 'HS Hybrid+',
    variant: null,
    fullName: 'MG HS Hybrid+',
    category: 'Hybrid',
    price: { min: lakh(94.99), max: lakh(94.99), display: 'PKR 94.99 Lakh' },
    batteryCapacity: 1.83,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    /*
      Null because it does not apply, not because it is unknown.

      A full hybrid has no meaningful electric-only range to quote and no way to
      charge the pack from outside the car. `notes` says so in words, so the blank
      is not read as a gap waiting to be filled.
    */
    electricRange: null,
    electricRangeMax: null,
    power: 221,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    /*
      1496 cc is the figure the sibling `mg-hs-phev` row already carries for MG's
      1.5-litre turbo, so the two HS rows agree rather than one saying "1.5L" and
      the other a number. The source used for this trim says only "1.5L turbo" —
      worth confirming against MG Pakistan's own spec sheet.
    */
    engineCapacity: 1496,
    torque: 340,
    /*
      Null for the gen-2 car. The old generation was quoted at about 190 km/h and
      carrying that number forward across a generation change would be a guess
      dressed as continuity.
    */
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'SUV (5-door, 5-seat)',
    driveType: 'FWD',
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4655,
    widthMm: 1890,
    heightMm: 1660,
    wheelbaseMm: null,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: 448,
    kerbWeightKg: null,
    availability: 'Sold in Pakistan by MG Pakistan',
    distributor: 'MG Pakistan (mgmotors.com.pk)',
    warranty: 'Confirm terms with the dealer.',

    image: null,
    notes:
      '2026 second-generation MG HS Hybrid+, a self-charging full hybrid. 1.5L turbo hybrid ' +
      'with a dedicated hybrid transmission (EDU), combined 221 hp and 340 Nm, FWD. The ' +
      '1.83 kWh battery charges itself from the engine and braking — there is no plug and no ' +
      'charging port, so electric-only range does not apply. No 0–100 time or top speed is ' +
      'published for this generation; the previous generation was quoted at about 190 km/h, ' +
      'which is not carried over here. 5 seats, boot about 448 L. Dimensions are approximate ' +
      'and unconfirmed: ~4655×1890×1660 mm. Engine displacement shown as 1496 cc to match the ' +
      'MG HS Super Hybrid row; the source for this trim says only "1.5L turbo". ' +
      'PKR 9,499,000 ex-factory via MG Pakistan. Sold alongside the plug-in MG HS Super ' +
      'Hybrid, which is a separate entry.',
  },
  {
    id: 'toyota-corolla-cross-hev',
    slug: 'toyota-corolla-cross-hev',
    brand: 'Toyota',
    model: 'Corolla Cross Hybrid',
    variant: null,
    fullName: 'Toyota Corolla Cross Hybrid',
    category: 'Hybrid',
    /*
      Two trims, and the indicative single price is replaced by the real span:
      HEV at PKR 9,849,000 and HEV X at PKR 10,299,000. The row previously carried
      PKR 9,550,000 marked "(indicative)", which is now superseded by figures for
      both named trims, so the marker goes too.
    */
    price: { min: lakh(98.49), max: crore(1.0299), display: 'PKR 98.49 Lakh – 1.03 Cr' },
    // Toyota does not publish a usable kWh for this pack, so it stays null
    // rather than carrying a figure taken from a teardown.
    batteryCapacity: null,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    /*
      122 hp is kept, against a reported 97-138 hp span.

      Combined system output is the figure Toyota quotes for a hybrid — the engine
      and motor peaks do not add up to it and neither alone is the number a buyer
      compares. PakWheels lists the output as a 97-138 hp range, which reads more
      like an aggregation across listings than a single car's rating, and there is
      no maximum column to hold both ends. 122 hp is the figure other markets
      state for this exact powertrain, so it stays, with the span in `notes`.
    */
    power: 122,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1798,
    /*
      Null because the sources contradict each other, not because none exists.

      PakWheels reports combined torque as 142-172 Nm; other market listings for
      the same car say 305 Nm. Those are not two ends of one span, they are two
      different claims, and picking either would be taking a side. Both are quoted
      in `notes` instead.
    */
    torque: null,
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    /*
      `consumption` is kWh/100 km, which a car with no plug cannot be measured in.
      Its fuel economy — about 12-18 km/L locally, 19-22 km/L in some markets —
      has no column here and lives in `notes`.
    */
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4460,
    widthMm: 1825,
    heightMm: 1620,
    wheelbaseMm: 2640,
    groundClearanceMm: 161,
    groundClearanceMaxMm: null,
    /*
      Boot (436-487 L) and kerb weight (1325-1385 kg) are both quoted as spans
      with no way to tell which end belongs to which trim, and neither column has
      a maximum. Storing the lower end would understate the car and the upper
      would overstate it, so both spans are in `notes` whole.
    */
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale; Toyota\'s only hybrid in Pakistan',
    distributor: 'Toyota Indus Motor Company',
    warranty: 'Toyota Indus standard cover, typically 3–5 years — exact terms not confirmed.',

    image: '/images/cars/toyota-corolla-cross-hev.jpg',
    notes:
      'Toyota Corolla Cross 1.8 HEV, a self-charging hybrid and Toyota\'s only hybrid in ' +
      'Pakistan. 1798 cc 2ZR-FE Atkinson-cycle engine with an e-motor, E-CVT, FWD. Combined ' +
      'output is reported inconsistently: PakWheels gives 97–138 hp and 142–172 Nm, while other ' +
      'markets state 122 hp and 305 Nm for the same powertrain. 122 hp is shown above as the ' +
      'combined system figure; torque is left blank because 142–172 and 305 Nm are competing ' +
      'claims rather than one span. Fuel economy about 12–18 km/L locally, 19–22 km/L quoted ' +
      'elsewhere, from a 36 L tank — there is no kWh/100 km column that applies to a car with ' +
      'no plug. Being a full hybrid it charges its own battery from the engine and braking and ' +
      'has no charging port, so no plug, AC, DC or electric-only range figure applies, and the ' +
      'pack\'s kWh and chemistry (NiMH or lithium-ion) are not published for Pakistan. 5 seats, ' +
      '7 airbags, top speed 180 km/h, 4460×1825×1620 mm, wheelbase 2640 mm, ground clearance ' +
      '~161 mm. Boot 436–487 L and kerb weight 1325–1385 kg are both quoted as spans that ' +
      'cannot be attributed to a trim, so neither is stored as a single figure. Two trims: HEV ' +
      'at PKR 9,849,000 and HEV X at PKR 10,299,000. Assembled in Pakistan by Indus Motor ' +
      'Company; exact warranty terms not confirmed.',
  },
  {
    id: 'haval-jolion-hev',
    slug: 'haval-jolion-hev',
    brand: 'Haval',
    model: 'Jolion Hybrid',
    variant: null,
    fullName: 'Haval Jolion Hybrid',
    category: 'Hybrid',
    price: { min: lakh(89.99), max: lakh(89.99), display: 'PKR 89.99 Lakh (indicative)' },
    batteryCapacity: 1.7,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 187,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1497,
    torque: null,
    topSpeed: null,
    seats: 5,
    image: '/images/cars/haval-jolion-hev.jpg',
    notes: 'A full hybrid, not a plug-in: it charges its own battery from the engine and braking, and has no charging port — so no plug, AC or DC figure applies. Assembled in Pakistan by Sazgar Engineering.',
  },
  {
    id: 'haval-h6-hev',
    slug: 'haval-h6-hev',
    brand: 'Haval',
    model: 'H6 Hybrid',
    variant: null,
    fullName: 'Haval H6 Hybrid',
    category: 'Hybrid',
    /*
      Price left at the authored PKR 10,500,000, as instructed, and it now sits
      about a million below both figures the latest research found — PKR 11,523,015
      from PakWheels and PKR 11,749,000 from Rachna, which disagree with each other
      too. Kept rather than replaced because the instruction was to prefer the
      existing authored value; both new figures are in `notes` and this is flagged
      for a decision. The "(indicative)" marker stays, since that is exactly what
      the number now is.
    */
    price: { min: crore(1.05), max: crore(1.05), display: 'PKR 1.05 Cr (indicative)' },
    /*
      1.76 kWh kept over the "~1.8 kWh" the new research offers: it is the more
      precise of the two and they do not conflict, 1.8 being a rounding of it.
      Replacing a specific figure with a rounder one loses information.
    */
    batteryCapacity: 1.76,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 240,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    // 1497 cc kept; the new research says 1498. A one-cc difference between
    // listings of the same engine is a rounding artefact, not a second engine.
    engineCapacity: 1497,
    torque: 530,
    // 180 km/h. PakWheels shows 180-220 across the H6 line rather than for this
    // trim, so the lower, trim-specific figure is used. Span in `notes`.
    topSpeed: 180,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Mid-size SUV (5-door, 5-seat)',
    driveType: 'FWD (DHT dedicated hybrid transmission)',
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    // kWh/100 km does not describe a car with no plug. Fuel economy is in `notes`.
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: null,
    lengthMm: 4703,
    widthMm: 1886,
    heightMm: 1730,
    wheelbaseMm: 2738,
    groundClearanceMm: 170,
    groundClearanceMaxMm: 175,
    bootCapacityL: 600,
    kerbWeightKg: 1770,
    availability: 'On sale in Pakistan; CKD local assembly',
    distributor: 'Sazgar Engineering / GWM Pakistan',
    warranty: 'Not confirmed. Reported as 6 years or 150,000 km — treat as unverified until the dealer confirms.',

    image: '/images/cars/haval-h6-hev.jpg',
    notes:
      'Haval H6 HEV, a self-charging full hybrid. 1.5-litre 1497 cc turbo hybrid with a ' +
      'dedicated hybrid transmission, FWD, combined 240 hp and 530 Nm, about 15–18 km/L from a ' +
      '61 L tank — there is no kWh/100 km column that applies to a car with no plug. Not a ' +
      'plug-in: it charges its own battery from the engine and braking and has no charging ' +
      'port, so no plug, AC, DC or electric-only range figure applies. The 1.76 kWh pack is ' +
      'also quoted as approximately 1.8 kWh; its chemistry is not published. 5 seats, 6 ' +
      'airbags, boot ~600 L, kerb ~1770 kg, 4703×1886×1730 mm, wheelbase 2738 mm, ground ' +
      'clearance 170–175 mm. Top speed 180 km/h, from a 180–220 km/h span PakWheels shows ' +
      'across the H6 line; no 0–100 time is published. Price above is the earlier authored ' +
      'PKR 10,500,000 and is indicative: current sources quote PKR 11,523,015 (PakWheels) and ' +
      'PKR 11,749,000 (Rachna), which disagree with each other and both sit above it — needs ' +
      'confirming. Some listings give the engine as 1498 cc. Sold by Sazgar Engineering / GWM ' +
      'Pakistan alongside the H6 PHEV, which does plug in — check which one a quoted price ' +
      'refers to. Warranty reported as 6 years / 150,000 km but not confirmed.',
  },
  {
    id: 'gwm-tank-300-hev',
    slug: 'gwm-tank-300-hev',
    brand: 'GWM',
    model: 'Tank 300 HEV',
    variant: null,
    fullName: 'GWM Tank 300 HEV',
    category: 'Hybrid',
    price: { min: crore(1.29), max: crore(1.29), display: 'PKR 1.29 Cr (indicative)' },
    batteryCapacity: 1.76,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 342,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1998,
    torque: null,
    topSpeed: null,
    seats: 5,
    image: '/images/cars/gwm-tank-300-hev.jpg',
    notes:
      'A full hybrid, not a plug-in: it charges its own battery from the engine and braking, and has no charging port — so no plug, AC or DC figure applies. The larger Tank 500 in this catalogue is a plug-in; the 300 sold here is not.',
  },
  {
    id: 'chery-tiggo-cross-hev',
    slug: 'chery-tiggo-cross-hev',
    brand: 'Chery',
    model: 'Tiggo Cross HEV',
    variant: null,
    fullName: 'Chery Tiggo Cross HEV',
    category: 'Hybrid',
    /*
      Price deliberately NOT touched, and the whole row carries a caveat.

      Everything technical below is the global specification — the Philippines and
      Indonesia sheets — because no Pakistan-market spec sheet or price was found.
      The PKR 8,200,000 here is the earlier authored indicative figure and is left
      exactly as it was: there is nothing to replace it with, and inventing one
      would be worse than an old estimate that says it is an estimate.

      The "(indicative)" marker therefore stays, and `availability` and `notes`
      both state plainly that the Pakistan launch itself is unconfirmed. This is
      the one row in the group whose market presence is in question, not just its
      numbers.
    */
    price: { min: lakh(82), max: lakh(82), display: 'PKR 82 Lakh (indicative)' },
    batteryCapacity: 1.83,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 204,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: null,
    acChargingUnit: 'kW',
    connector: null,
    engineCapacity: 1498,
    torque: 310,
    // Not published. Cars of this class sit around 170-185 km/h, which is class
    // inference rather than a figure for this car, so the field stays empty.
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Subcompact crossover SUV (5-door, 5-seat)',
    driveType: 'FWD',
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'Lithium iron phosphate (LFP)',
    // 4330 mm is the figure most sources give; some say 4320. Both in `notes`.
    lengthMm: 4330,
    widthMm: 1831,
    heightMm: 1652,
    // Quoted as a 2610-2620 mm span, and one column cannot hold both ends.
    wheelbaseMm: null,
    groundClearanceMm: 190,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability:
      'NOT CONFIRMED for Pakistan. No official Pakistani launch, price or spec sheet was found; the figures shown are the global specification.',
    distributor: 'Master Chery (Chery Pakistan) — confirm the Tiggo Cross is in the local range',
    warranty: 'Battery 8 years / 160,000 km is the global term — not confirmed for Pakistan.',

    image: null,
    notes:
      'WARNING: this is the GLOBAL specification (Philippines and Indonesia). No official ' +
      'Pakistan-market price, launch or spec sheet was found, so the PKR figure shown is the ' +
      'earlier indicative estimate, unchanged, and Pakistan availability is unconfirmed. ' +
      'Chery Tiggo Cross HEV, marketed as Chery Super Hybrid: 1.5L DOHC Atkinson-cycle turbo ' +
      '1498 cc with a single e-motor and a DHT, combined about 202–204 hp and 310 Nm, FWD, ' +
      '5 seats, combined range up to about 1,200 km on a full tank. The 1.83 kWh LFP pack is ' +
      'self-charging — no plug, no charging port, and no electric-only range, so no AC, DC or ' +
      'charge-time figure applies. Neither top speed nor 0–100 is published; cars of this class ' +
      'sit around 170–185 km/h, which is not a figure for this car. Fuel economy is reported as ' +
      'good but no km/L figure applicable to Pakistan was found. About 4330×1831×1652 mm, with ' +
      'some sources giving 4320 mm long; wheelbase quoted as a 2610–2620 mm span so no single ' +
      'value is stored; ground clearance about 190 mm. 17-inch wheels on 225/45 R17, dual ' +
      '10.25-inch screens. Boot volume (around 430 L) and kerb weight (around 1500 kg) are ' +
      'class-typical estimates, not published figures, so both are left blank. Battery ' +
      'warranted 8 years / 160,000 km globally; the Pakistan term is unconfirmed. Master Chery ' +
      'dealership network.',
  },

  // ─── The list's gaps: EV and PHEV ─────────────────────────────────
  {
    id: 'byd-sealion-6',
    slug: 'byd-sealion-6',
    brand: 'BYD',
    model: 'Sealion 6',
    variant: null,
    fullName: 'BYD Sealion 6',
    category: 'PHEV',
    price: { min: crore(1.09), max: crore(1.09), display: 'PKR 1.09 Cr (indicative)' },
    batteryCapacity: 18.3,
    batteryUnit: 'kWh',
    range: null,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: 92,
    electricRangeMax: null,
    power: 215,
    powerUnit: 'hp',
    acceleration: 8.5,
    accelerationUnit: 'sec',
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 3.3,
    acChargingUnit: 'kW',
    connector: ['Type 2'],
    engineCapacity: 1497,
    torque: null,
    topSpeed: null,
    seats: 5,
    image: '/images/cars/byd-sealion-6.jpg',
    notes:
      'BYD’s DM-i plug-in, sold elsewhere as the Song Plus DM-i. The Sealion 7 in this catalogue is a full EV — different car, one digit apart.',
  },
  {
    /*
      Filled out for the 2026 model year, and this row changes more than the
      others. Four things a reviewer should check rather than skim.

      1. THE CONNECTOR FLIPS. This row said GB/T, with a note warning a buyer to
         check a public charger takes it. The 2026 CKD car is stated as CCS2 and
         Type 2. That is a safety-relevant fact about whether a car can charge at
         all, so `notes` now carries both and tells the buyer to look at the
         actual inlet. Plausibly both are true of different build years; nothing
         here proves which car is in a showroom today.

      2. `price` moves from PKR 8,250,000 marked "(indicative)" to 8,390,000, and
         drops the "(indicative)" wording, because an ex-factory figure was
         supplied where before there was only a class estimate.

      3. `batteryCapacity` moves from 52.56 to 49.34 kWh. Both are real Seres 3
         packs; 49.34 is the figure supplied for the 2026 car and 52.56 is in
         `notes`.

      4. `rangeStandard` is null, not 'NEDC'. The supplied column names NEDC as
         primary but the only figure it labels NEDC is the 403 km it treats as
         secondary. Calling the stored 331 km an NEDC figure would assert a cycle
         no source attached to it.

      `brand`, `model` and `fullName` are unchanged. The supplied naming is
      "Seres (DFSK) 3" / "Seres 3 EV"; these are stored columns the matcher
      compares as published (see src/lib/cars.ts), and renaming a brand also
      splits its filter facet. The naming is in `notes` instead.
    */
    id: 'dfsk-seres-3',
    slug: 'dfsk-seres-3',
    brand: 'DFSK',
    model: 'Seres 3',
    /*
      Null. The supplied column says "EV (CKD)", which describes the drivetrain
      and the assembly route rather than naming a trim — `category` already says
      EV. Declaring it would render "DFSK Seres 3 EV (CKD)" as the car's public
      name and would make the matcher refuse any source that names a real trim.
    */
    variant: null,
    fullName: 'DFSK Seres 3',
    category: 'EV',
    price: { min: lakh(83.9), max: lakh(83.9), display: 'PKR 83.9 Lakh' },
    batteryCapacity: 49.34,
    batteryUnit: 'kWh',
    /*
      331 km, the figure the 2026 research gives as primary. This row previously
      carried 329 km, and other sources say 403 km and 400 km. All three are in
      `notes`; the 331 and the 403 are far enough apart that one of them is
      describing a different pack or a different cycle.
    */
    range: 331,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 161,
    powerUnit: 'hp',
    acceleration: 8.9,
    accelerationUnit: 'sec',
    /*
      22 kW, which is what the 2026 research states, and it does not sit well
      with the rest of the evidence: this row previously carried 40 kW, and the
      same research quotes 20-80% in about 30 minutes, which on a 49.34 kWh pack
      needs roughly twice 22 kW. The supplied figure is stored per the honesty
      rule and every competing number is in `notes`.
    */
    dcCharging: 22,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 300,
    topSpeed: 155,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Compact SUV (5-door)',
    driveType: 'FWD',
    /*
      Null. The motor was supplied as 160.9 hp, which is an hp figure, not a kW
      one. Converting it to about 120 kW would be arithmetic rather than a
      published specification.
    */
    motorPowerKw: null,
    rangeStandard: null,
    realWorldRange: 280,
    realWorldRangeMax: 320,
    consumption: 18,
    consumptionMax: null,
    acChargingHours: 6,
    // Published as 20-80% in about 30 minutes, not the 10-80% this column
    // renders. In `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'Lithium-ion (LFP not confirmed)',
    lengthMm: 4385,
    widthMm: 1850,
    heightMm: 1650,
    wheelbaseMm: 2655,
    groundClearanceMm: 180,
    groundClearanceMaxMm: null,
    bootCapacityL: 526,
    // Quoted as about 1760 kg.
    kerbWeightKg: 1760,
    availability:
      'On sale; assembled locally as a CKD kit by Regal Automobiles — among the first EV SUVs built in Pakistan.',
    distributor: 'Regal Automobiles (Seres / DFSK Pakistan)',
    warranty: null,

    image: '/images/cars/dfsk-seres-3.jpg',
    notes:
      'Seres 3 EV, assembled locally as a CKD kit by Regal Automobiles and among the first ' +
      'EVs built in Pakistan. Also branded simply Seres 3; this catalogue keeps the DFSK ' +
      'brand name it was listed under. 49.34 kWh lithium-ion, 161 hp, 300 Nm, FWD, 8.9 s ' +
      '0–100, 155 km/h, about 18 kWh/100 km. CHECK THE CHARGING INLET BEFORE YOU BUY: this ' +
      'car was previously listed as charging on GB/T rather than CCS2, and the 2026 ' +
      'specification says CCS2 and Type 2. Both may be true of different build years, so look ' +
      'at the inlet on the actual car and confirm a public charger takes it. RANGE DISAGREES ' +
      'BY SOURCE: 331 km is stored as the primary 2026 figure, this row previously carried ' +
      '329 km, and other sources say 403 km NEDC and 400 km — the gap between 331 and 403 is ' +
      'too wide to be rounding. No source attaches a test cycle to the 331 km, so no cycle is ' +
      'recorded. About 280–320 km is the realistic expectation. DC RATE DISAGREES AND IS ' +
      'INTERNALLY INCONSISTENT: 22 kW is stored as supplied, this row previously carried ' +
      '40 kW, and the same research quotes 20–80% in about 30 minutes, which would need ' +
      'roughly twice 22 kW on this pack — confirm with the dealer. The 20–80% window is not ' +
      'the 10–80% this catalogue normally shows. AC 6.6 kW taking about 6 hours. BATTERY ' +
      'DISAGREES: 49.34 kWh is stored for the 2026 car and this row previously carried ' +
      '52.56 kWh; the chemistry is lithium-ion with some sources saying LFP, so it is not ' +
      'asserted. 4385×1850×1650 mm, wheelbase 2655 mm, ground clearance 180 mm, 526 L boot, ' +
      'kerb about 1760 kg, 5 seats, 10.25-inch screen, panoramic sunroof, 6 airbags. ' +
      'PKR 8,390,000 ex-factory, replacing the class-estimated 8,250,000 this row used to ' +
      'carry. ' +
      'WARRANTY IS NOT CONFIRMED: an 8-year battery term is class-typical but was not stated ' +
      'for this car, so the field is blank. Motor output in kW was not published.',
  },
  {
    id: 'hyundai-ioniq-5',
    slug: 'hyundai-ioniq-5',
    brand: 'Hyundai',
    model: 'Ioniq 5',
    variant: null,
    fullName: 'Hyundai Ioniq 5',
    category: 'EV',
    price: { min: crore(1.7), max: crore(1.7), display: 'PKR 1.7 Cr (indicative)' },
    batteryCapacity: 72.6,
    batteryUnit: 'kWh',
    range: 481,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 217,
    powerUnit: 'hp',
    acceleration: 7.4,
    accelerationUnit: 'sec',
    dcCharging: 232,
    dcChargingUnit: 'kW',
    acCharging: 11,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: null,
    topSpeed: null,
    seats: 5,
    image: '/images/cars/hyundai-ioniq-5.jpg',
    notes:
      'The fastest-charging car in this catalogue by a wide margin — its 800-volt system takes 232 kW, which no public charger in Pakistan can currently supply.',
  },

  /* ─── 2026 model-year imports: GUGO, Dongfeng and JMEV ──────────────

     Six rows for the 2026 model year, supplied as a researched column list
     rather than a price list. Prices are ex-factory PKR and are stated without
     "(indicative)" because each one was quoted for the car, not inferred from a
     class — but several are quoted differently by different sources, and where
     they are the row's `notes` names every figure it found instead of picking a
     favourite silently.

     Three sibling rows already existed and were updated in place rather than
     duplicated here: dongfeng-vigo, dongfeng-007 and gugo-aion-v.

     `variant` is null on every row that describes a lineup rather than one trim.
     That is the Phase 4.1 contract, not laziness: null asserts "this row
     declares no variant", so a variant-sensitive crawled figure is refused
     against it. Writing 'U4 / UT5' into the column would assert a single trim by
     that literal name, and `sameVariant` does no fuzzy comparison — a source
     naming "U4" would then be blocked as a contradiction. The only row here that
     genuinely describes one trim is the GIGI, and it declares it.

     `image` is null on all six, per the field's rule: "Null until a real file
     exists." The intended paths are /images/cars/<slug>.jpg; set them when
     licensed files land. Nothing here generates one.

     Where a headline figure differs by trim, every headline figure comes from
     the same trim as `price.min` — the mg-zs-ev rule — and the other trim's
     figures live in `notes`. A row must describe one car, not the best number
     from each.

     `dcChargingMinutes` renders a 10-80% window. Four of these six publish a
     0-80%, 30-80% or unstated-to-80% time instead, so the column is null on
     those and the published window is spelled out in `notes`. Same distinction
     mg-zs-ev and mg-binguo already carry.
  */
  {
    id: 'gugo-gigi',
    slug: 'gugo-gigi',
    brand: 'GUGO',
    model: 'GIGI',
    /*
      The one variant declaration in this batch, and the only honest one.

      "220" is the single trim GUGO sells this car as — the badge is the claimed
      range — so the row describes one car and can say which. The lineup rows
      below cannot, and say null.
    */
    variant: '220',
    fullName: 'GUGO GIGI',
    category: 'EV',
    // Quoted at PKR 3,750,000. Older listings say 4,650,000 and 3.9M; the
    // current figure is stored and the others are named in `notes` rather than
    // widening the range, because they are the same trim at different dates.
    price: { min: lakh(37.5), max: lakh(37.5), display: 'PKR 37.5 Lakh' },
    // 16.8 kWh is the primary figure. An older 8 kWh listing exists and is in
    // `notes`; it is not a second trim, it is a superseded spec.
    batteryCapacity: 16.8,
    batteryUnit: 'kWh',
    range: 220,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 40,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    // Stated as none, not unknown: this car has no DC inlet. `notes` says so.
    dcCharging: null,
    dcChargingUnit: 'kW',
    /*
      Null because a domestic 220V socket has no published kW rating. Deriving
      one from the 3-5 hour charge time would be arithmetic, not a
      specification — the same call the three Alektra rows make.
    */
    acCharging: null,
    acChargingUnit: 'kW',
    connector: ['Type 2'],
    engineCapacity: null,
    torque: 100,
    topSpeed: 100,
    /*
      Null on a two-seat-or-four-seat disagreement. Some sources describe a
      2-door 2-seat micro car, others a 4-seat, and neither is the manufacturer
      speaking. A seat count is the first thing a buyer of a car this size
      checks, so a guess here is worse than a blank.
    */
    seats: null,

    modelYear: 2026,
    bodyType: 'Micro hatchback (2-door, keyless entry)',
    driveType: 'RWD',
    motorPowerKw: 30,
    // The 220 km is a claim with no cycle named, so no cycle is recorded.
    rangeStandard: null,
    realWorldRange: 180,
    realWorldRangeMax: 200,
    consumption: null,
    consumptionMax: null,
    // Published as a 3-5 hour span on a domestic supply, and this column holds
    // one number. Averaging to 4 would invent a figure; the span is in `notes`.
    acChargingHours: null,
    dcChargingMinutes: null,
    batteryTech: 'LFP (lithium iron phosphate)',
    lengthMm: 3030,
    widthMm: 1640,
    heightMm: 1495,
    wheelbaseMm: null,
    groundClearanceMm: 135,
    groundClearanceMaxMm: null,
    /*
      843 L is what the listings say, and it is recorded rather than corrected —
      but it is implausible for a 3030 mm two-door and is almost certainly a
      seats-folded or litres-of-something-else figure. Flagged in `notes` so a
      buyer does not read it as a boot they can put luggage in.
    */
    bootCapacityL: 843,
    kerbWeightKg: 815,
    availability: 'On sale; delivery quoted at about one month.',
    distributor: 'GUGO Motors',
    warranty: null,

    image: null,
    notes:
      'GUGO GIGI 220, a micro EV. 16.8 kWh LFP pack, 30 kW / about 40 hp, 100 Nm (from an ' +
      'older listing), RWD, 100 km/h. An older source says 8 kWh; 16.8 kWh is the primary ' +
      'figure and the 8 kWh listing is treated as superseded, not as a second trim. Claimed ' +
      'range 220 km with no test cycle named — some sources say 200 km — and about 180–200 km ' +
      'is the realistic expectation. Charges from a domestic 220V supply in 3–5 hours; the ' +
      'socket has no published kW rating so none is stored. No DC fast charging at all, which ' +
      'is a design limit rather than an unknown. Type 2 AC only. 3030×1640×1495 mm, ground ' +
      'clearance about 135 mm, kerb about 815 kg. DOORS AND SEATING ARE UNRESOLVED: some ' +
      'sources say 2-door 2-seat, others 4-seat, so the seat count is left blank — confirm ' +
      'with the dealer. BOOT: 843 L is what listings state and is stored as published, but it ' +
      'is not credible for a car this size and should be read as unverified. PRICE VARIES BY ' +
      'SOURCE: PKR 3,750,000 is stored; older listings quote 4,650,000 and 3.9M. Imported by ' +
      'GUGO Motors. Wheelbase, 0–100 km/h, consumption and warranty are all unconfirmed.',
  },
  {
    id: 'gugo-aion-ut',
    slug: 'gugo-aion-ut',
    brand: 'GUGO',
    model: 'AION UT',
    // Two trims, U4 and UT5. See the batch comment above for why a lineup
    // declares no variant.
    variant: null,
    fullName: 'GUGO AION UT',
    category: 'EV',
    /*
      GUGO's own two trims: U4 at 6,990,000 and UT5 at 8,499,000.

      A third price exists for the same car and is NOT folded into this range:
      Lucky Motor Corp launched the GAC AION UT Elite officially at 6,399,000
      with a smaller 44.12 kWh pack. That is a different seller selling a
      different specification, so putting 6,399,000 in `price.min` here would
      make the row's cheapest price belong to a car whose battery, range and
      power none of the fields above describe. It is named in `notes` instead.
    */
    price: { min: lakh(69.9), max: lakh(84.99), display: 'PKR 69.9–84.99 Lakh' },
    // Every headline figure below is the U4's, matching price.min. UT5: 60 kWh,
    // 201 hp, 210 Nm, 500 km, 80 kW DC — in `notes`.
    batteryCapacity: 49,
    batteryUnit: 'kWh',
    range: 425,
    rangeMax: 500,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 134,
    powerUnit: 'hp',
    /*
      Null, not 11.4.

      The 11.4 s figure is published for the Lucky Motor Corp AION UT Elite —
      44.12 kWh, 100 kW — which is neither of the two trims this row describes.
      Attributing it to the 49 kWh U4 is exactly the wrong-variant substitution
      that damaged the byd-seal row, so it stays in `notes` with its source
      named.
    */
    acceleration: null,
    accelerationUnit: 'sec',
    // U4's rate. UT5 takes 80 kW.
    dcCharging: 70,
    dcChargingUnit: 'kW',
    // Quoted as "about 7 kW", so approximate rather than a rated figure.
    acCharging: 7,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 145,
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Electric hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 100,
    rangeStandard: 'WLTP',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    // Published as a 6-7 hour span; this column holds one number, so the span
    // is in `notes` rather than averaged.
    acChargingHours: null,
    // The published DC window is 10-80% in about 40 minutes, which is the
    // window this column means, so it is recorded here.
    dcChargingMinutes: 40,
    batteryTech: 'LFP (GAC Magazine battery)',
    lengthMm: 4270,
    widthMm: 1850,
    heightMm: 1575,
    wheelbaseMm: 2750,
    groundClearanceMm: 150,
    groundClearanceMaxMm: null,
    bootCapacityL: 440,
    // Quoted as a 1540-1600 kg span across the two trims, and this column holds
    // one number. The lighter end is the U4's, matching every other headline
    // figure in this row; the span is in `notes`.
    kerbWeightKg: 1540,
    availability:
      'On sale as a GUGO Motors import; also launched officially by Lucky Motor Corp as a different specification.',
    distributor: 'GUGO Motors (Lucky Motor Corp separately imports the official GAC version)',
    warranty: null,

    image: null,
    notes:
      'GUGO AION UT, sold by GUGO Motors in two trims. U4: 49 kWh, about 134 hp (100 kW), ' +
      '145 Nm, 425 km WLTP, 70 kW DC, PKR 6,990,000. UT5: 60 kWh, about 201 hp, 210 Nm, ' +
      '500 km WLTP, 80 kW DC, PKR 8,499,000. Battery, power, torque, range and DC rate above ' +
      'are the U4\'s, matching the lower price; the maximum range and price are the UT5\'s. ' +
      'FWD, single-speed, 5 seats. LFP (GAC Magazine battery). AC about 7 kW taking 6–7 hours; ' +
      'DC 10–80% in about 40 minutes; CCS2 and Type 2. 4270×1850×1575 mm, wheelbase 2750 mm, ' +
      'ground clearance about 150 mm, 440 L boot, kerb 1540–1600 kg across the trims. ' +
      'TWO SELLERS, NOT ONE CAR: Lucky Motor Corp has launched the same model officially as ' +
      'the GAC AION UT Elite — 44.12 kWh LFP, 335 km WLTP, 100 kW / 145 Nm, DC 10–80% in ' +
      'about 40 minutes, 0–100 in 11.4 s, PKR 6,399,000. That is a different specification at ' +
      'a lower price and is deliberately not merged into this row or into its price range. ' +
      'The 11.4 s 0–100 belongs to that LMC car, so this row records no 0–100 figure. ' +
      'Top speed and warranty are unconfirmed.',
  },
  {
    id: 'gugo-box',
    slug: 'gugo-box',
    brand: 'GUGO',
    model: 'Box',
    // Three trims, E1 / E2 / E3.
    variant: null,
    fullName: 'GUGO Box EV',
    category: 'EV',
    // E1 6,300,000 / E2 7,300,000 / E3 7,700,000 ex-factory. Promotional prices
    // differ from these, which is why the wording says ex-factory.
    price: { min: lakh(63), max: lakh(77), display: 'PKR 63–77 Lakh (ex-factory)' },
    // E1's pack, matching price.min. E2 and E3 both take 42.3 kWh.
    batteryCapacity: 31.4,
    batteryUnit: 'kWh',
    range: 330,
    rangeMax: 430,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // Shared across all three trims.
    power: 95,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    /*
      Null. The car is stated to take DC fast charging — 80% in about 30
      minutes — but no kW rating was published for it, and back-calculating one
      from the pack and the time would be arithmetic rather than a
      specification. `notes` records that DC works and how long it takes.
    */
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 160,
    topSpeed: 140,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 70,
    rangeStandard: 'CLTC',
    realWorldRange: null,
    realWorldRangeMax: null,
    consumption: null,
    consumptionMax: null,
    // Published as a 5-6 hour span; not averaged. See `notes`.
    acChargingHours: null,
    // Published as "80% in about 30 minutes" with no lower bound stated. This
    // column renders a 10-80% window, so the figure would sit under the wrong
    // label. It is in `notes` with its own wording.
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    lengthMm: 4030,
    widthMm: 1810,
    heightMm: 1570,
    wheelbaseMm: 2660,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale; launched February 2025.',
    distributor: 'GUGO Motors',
    warranty:
      '2 years / 100,000 km on the vehicle and 4 years / 150,000 km on the battery, per one source — confirm with the dealer.',

    image: null,
    notes:
      'GUGO Box EV in three trims. E1: 31.4 kWh LFP, 330 km CLTC, PKR 6,300,000. E2: 42.3 kWh ' +
      'LFP, 430 km CLTC, PKR 7,300,000. E3: 42.3 kWh LFP, 430 km CLTC, PKR 7,700,000. Battery ' +
      'and range above are the E1\'s, matching the lower price; the maximum range and price ' +
      'are the E3\'s. All three share the 70 kW / about 95 hp motor, 160 Nm, FWD and a ' +
      '140 km/h top speed. 5 seats, 16–17 inch wheels. AC 6.6 kW taking 5–6 hours. DC fast ' +
      'charging reaches 80% in about 30 minutes, but no kW rating was published, so the DC ' +
      'speed is blank rather than back-calculated; the 30-minute figure also has no stated ' +
      'lower bound, so it is not recorded in the 10–80% column. CCS2 and Type 2. ' +
      '4030×1810×1570 mm, wheelbase 2660 mm. Prices are ex-factory and promotional prices ' +
      'differ. Imported by GUGO Motors. Warranty is quoted by one source as 2 years / ' +
      '100,000 km on the vehicle plus 4 years / 150,000 km on the battery and needs ' +
      'confirming. Ground clearance, boot volume, kerb weight and 0–100 km/h are all ' +
      'unpublished.',
  },
  {
    id: 'dongfeng-box',
    slug: 'dongfeng-box',
    brand: 'Dongfeng',
    model: 'Box',
    // Three trims: Smart 330, Lux 430, Flagship 430.
    variant: null,
    fullName: 'Dongfeng Box',
    category: 'EV',
    // Smart 330 5,500,000 / Lux 430 6,400,000 / Flagship 430 6,800,000.
    price: { min: lakh(55), max: lakh(68), display: 'PKR 55–68 Lakh' },
    // Smart 330's pack, matching price.min. Lux and Flagship take 42.3 kWh.
    batteryCapacity: 32.56,
    batteryUnit: 'kWh',
    range: 330,
    rangeMax: 430,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    /*
      95 hp is the figure that agrees with the stated 70 kW motor. Some Pakistan
      listings say 71 hp and one says 70 hp, which look like a kW figure printed
      under an hp heading. The consistent number is stored and the disagreement
      is in `notes` — it is not resolved, only recorded.
    */
    power: 95,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    // Fast charging is stated but no kW rating was published for it.
    dcCharging: null,
    dcChargingUnit: 'kW',
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    // Quoted as "about 160 Nm" rather than as a rated figure.
    torque: 160,
    topSpeed: null,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 70,
    /*
      Null. The 330 and 430 km figures are the CLTC numbers this car carries
      globally, but no Pakistan source states the cycle, and this column exists
      to say which cycle produced the stored number. "CLTC, probably" is not a
      test result. Named in `notes` instead.
    */
    rangeStandard: null,
    realWorldRange: 250,
    realWorldRangeMax: 300,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 6,
    // Published as 30-80% in about 30 minutes, a different window from the
    // 10-80% this column renders. In `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    // Quoted as approximately 4020 mm. The wheelbase is 2660 mm on the global
    // car and unstated for Pakistan, so it is left blank — see `notes`.
    lengthMm: 4020,
    widthMm: 1800,
    heightMm: 1570,
    wheelbaseMm: null,
    groundClearanceMm: null,
    groundClearanceMaxMm: null,
    bootCapacityL: null,
    kerbWeightKg: null,
    availability: 'On sale; the Smart 330 launched April 2026.',
    distributor: 'Chawla Green Motors (Dongfeng Pakistan)',
    warranty: null,

    image: null,
    notes:
      'Dongfeng Box in three trims. Smart 330: 32.56 kWh, 330 km, PKR 5,500,000. Lux 430: ' +
      '42.3 kWh, 430 km, PKR 6,400,000. Flagship 430: 42.3 kWh, 430 km, PKR 6,800,000. ' +
      'Battery and range above are the Smart 330\'s, matching the lower price; the maximum ' +
      'range and price are the Flagship\'s. 70 kW motor, about 160 Nm, FWD, LFP pack, 5 ' +
      'seats. Roughly 250–300 km is the realistic expectation. HORSEPOWER DISAGREES BY ' +
      'SOURCE: about 95 hp is stored because it is what 70 kW converts to, but several ' +
      'Pakistan listings say 71 hp and one says 70 hp, which read like the kW figure under an ' +
      'hp heading — confirm with the dealer. AC 6.6 kW taking about 6 hours; DC fast charging ' +
      '30–80% in about 30 minutes, which is a different window from the 10–80% this catalogue ' +
      'normally shows, and no kW rating was published. CCS2 and Type 2. About ' +
      '4020×1800×1570 mm. No Pakistan source states the test cycle behind 330/430 km, so no ' +
      'cycle is recorded even though these are the global CLTC figures. The global car\'s ' +
      'wheelbase is 2660 mm but it is unstated locally, so the field is blank. Sold by Chawla ' +
      'Green Motors. Top speed, ground clearance, boot volume, kerb weight, 0–100 km/h and ' +
      'warranty are all unconfirmed.',
  },
  {
    id: 'jmev-ev3',
    slug: 'jmev-ev3',
    brand: 'JMEV',
    model: 'EV3',
    // Two trims, Comfort and Premium, which differ on price and equipment
    // rather than on any figure below.
    variant: null,
    fullName: 'JMEV EV3',
    category: 'EV',
    /*
      Comfort 4,899,000 and Premium 4,999,999.

      lakh(49.99999) is deliberate and is not a typo: the Premium is priced at
      4,999,999 rupees, one short of 50 lakh, and the helper takes the published
      figure. Rounding the argument to 50 would silently move the price, which
      rule 2 of this file forbids. `display` carries the rupee figures as
      published for the same reason — "48.99-50.00 Lakh" would print a price
      nobody quoted.
    */
    price: { min: lakh(48.99), max: lakh(49.99999), display: 'PKR 4,899,000 – 4,999,999' },
    batteryCapacity: 30.24,
    batteryUnit: 'kWh',
    range: 271,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    power: 67,
    powerUnit: 'hp',
    acceleration: null,
    accelerationUnit: 'sec',
    // DC charging is supported but no kW rating was published for it. `notes`
    // says it works rather than leaving a buyer to read the blank as "no DC".
    dcCharging: null,
    dcChargingUnit: 'kW',
    // Quoted as "about 6.6 kW".
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 125,
    // Quoted as about 102 km/h.
    topSpeed: 102,
    // 5, which is what most sources say. A minority say 4; recorded in `notes`.
    seats: 5,

    modelYear: 2026,
    bodyType: 'Subcompact hatchback (5-door)',
    driveType: 'FWD',
    motorPowerKw: 50,
    // The stored 271 km is the WLTP figure. A 330 km figure from one listing is
    // in `notes`; the cycle behind it is not stated.
    rangeStandard: 'WLTP',
    realWorldRange: 200,
    realWorldRangeMax: 250,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 7,
    dcChargingMinutes: null,
    batteryTech: 'LFP',
    lengthMm: 3720,
    widthMm: 1640,
    heightMm: 1535,
    wheelbaseMm: 2390,
    groundClearanceMm: 177,
    groundClearanceMaxMm: null,
    bootCapacityL: 177,
    kerbWeightKg: 1060,
    availability: 'On sale; launched March 2026 with deliveries quoted from about July 2026.',
    distributor: 'Capital Smart Motors (JMEV Pakistan)',
    warranty: null,

    image: null,
    notes:
      'JMEV EV3 in two trims, Comfort at PKR 4,899,000 and Premium at PKR 4,999,999, with ' +
      'booking around 490,000. 30.24 kWh LFP, 67 hp (about 50 kW), 125 Nm, FWD, top speed ' +
      'about 102 km/h. 271 km WLTP is stored; one listing quotes 330 km without naming a ' +
      'cycle. About 200–250 km is the realistic expectation. AC charging takes about 7 hours ' +
      'at roughly 6.6 kW. DC fast charging IS supported but no kW rating and no charge window ' +
      'were published, so both DC fields are blank — read that as unstated, not as absent. ' +
      'CCS2 and Type 2. 3720×1640×1535 mm, wheelbase 2390 mm, ground clearance about 177 mm, ' +
      '177 L boot, kerb about 1060 kg. Seating is recorded as 5 because most sources say so; ' +
      'a minority say 4. Sold by Capital Smart Motors. 0–100 km/h, consumption and warranty ' +
      'are unconfirmed.',
  },
  {
    id: 'jmev-elight',
    slug: 'jmev-elight',
    brand: 'JMEV',
    model: 'Elight',
    // Two trims, Comfort and Premium.
    variant: null,
    fullName: 'JMEV Elight',
    category: 'EV',
    // Comfort 8,499,000 / Premium 9,999,000.
    price: { min: lakh(84.99), max: lakh(99.99), display: 'PKR 84.99–99.99 Lakh' },
    /*
      56.3 kWh is the primary figure because it is what Capital Smart Motors —
      the distributor actually selling the car — publishes. Other sources say
      62.5 kWh. The two are not trims: they are two sources describing the same
      pack, so only the distributor's figure is stored and the other is named in
      `notes`.
    */
    batteryCapacity: 56.3,
    batteryUnit: 'kWh',
    range: 500,
    rangeMax: null,
    rangeUnit: 'km',
    electricRange: null,
    electricRangeMax: null,
    // 165 kW. Some sources say 110 kW, which would be about 148 hp; recorded in
    // `notes`, not averaged with this.
    power: 221,
    powerUnit: 'hp',
    acceleration: 8.5,
    accelerationUnit: 'sec',
    dcCharging: 80,
    dcChargingUnit: 'kW',
    // Quoted as a 6.6-7 kW span and this column holds one number, so the lower,
    // more commonly stated figure is used and the span is in `notes`.
    acCharging: 6.6,
    acChargingUnit: 'kW',
    connector: ['CCS2', 'Type 2'],
    engineCapacity: null,
    torque: 225,
    topSpeed: 140,
    seats: 5,

    modelYear: 2026,
    bodyType: 'Electric sedan (4-door)',
    driveType: 'FWD',
    motorPowerKw: 165,
    // WLTP is what Capital Smart Motors states. Other sources call the same
    // 500 km an NEDC figure, which would make it optimistic; see `notes`.
    rangeStandard: 'WLTP',
    realWorldRange: 400,
    realWorldRangeMax: 450,
    consumption: null,
    consumptionMax: null,
    acChargingHours: 10,
    // Published as 30-80% in about 30 minutes, not the 10-80% this column
    // renders. In `notes` with its own window.
    dcChargingMinutes: null,
    batteryTech: 'LFP (lithium-ion)',
    /*
      Dimensions disagree between sources. Stored: 4675×1835×1480 mm. Capital
      Smart Motors lists 4780×1840×1450 mm — 105 mm longer and 30 mm lower,
      which is a different body, not a rounding. Both are in `notes` and neither
      is averaged.
    */
    lengthMm: 4675,
    widthMm: 1835,
    heightMm: 1480,
    wheelbaseMm: 2750,
    groundClearanceMm: 145,
    groundClearanceMaxMm: 150,
    bootCapacityL: 430,
    kerbWeightKg: 1520,
    availability: 'On sale; delivery quoted at about 90 days.',
    distributor: 'Capital Smart Motors (JMEV Pakistan)',
    warranty:
      'Battery warranted 8 years — 120,000 km per Capital Smart Motors, 150,000 km per another source. Confirm the term with the dealer.',

    image: null,
    notes:
      'JMEV Elight in two trims, Comfort at PKR 8,499,000 and Premium at PKR 9,999,000. ' +
      '165 kW / 221 hp, 225 Nm, FWD, 0–100 in 8.5 s, top speed 140 km/h, 500 km range, drag ' +
      'coefficient 0.26, L2.5 driver assistance. About 400–450 km is the realistic ' +
      'expectation. BATTERY DISAGREES BY SOURCE: 56.3 kWh is stored because Capital Smart ' +
      'Motors, the distributor, publishes it; other sources say 62.5 kWh. Power also ' +
      'disagrees — some sources say 110 kW rather than 165 kW. RANGE CYCLE DISAGREES: Capital ' +
      'Smart Motors calls the 500 km a WLTP figure and other sources call it NEDC, which ' +
      'would make it materially more optimistic. DIMENSIONS DISAGREE: 4675×1835×1480 mm is ' +
      'stored, while Capital Smart Motors lists 4780×1840×1450 mm; the 105 mm difference in ' +
      'length is too large to be rounding, so both are recorded and neither is averaged. ' +
      'Wheelbase 2750 mm, ground clearance 145–150 mm, 430 L boot, kerb about 1520 kg, 5 ' +
      'seats. AC 6.6–7 kW taking about 10 hours; DC 80 kW covering 30–80% in about 30 ' +
      'minutes, a different window from the 10–80% this catalogue normally shows. CCS2 and ' +
      'Type 2. Battery warranty is 8 years, quoted as 120,000 km by Capital Smart Motors and ' +
      '150,000 km elsewhere. Consumption is unpublished.',
  },
]

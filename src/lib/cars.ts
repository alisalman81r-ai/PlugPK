// src/lib/cars.ts

import { cars, type Car, type CarCategory, type ConnectorStandard } from '@/data/cars'

/**
 * Everything that reads the car database.
 *
 * Pure helpers over a list of cars, plus readers that default to the seed.
 *
 * The rows now live in the database (see lib/db/car-queries.ts) and this module
 * no longer owns them. Every helper that judges a set — brands, categories,
 * connectors, insights, similar cars — takes the list to judge, so it describes
 * whatever the caller loaded rather than the seed. They default to the module so
 * scripts/verify-cars.ts and any other consumer keep working against a fixed,
 * reviewable set.
 *
 * Was: the only module that touches src/data/cars.ts, so moving the rows into the
 * database later is a change here and nowhere else. Pure functions over arrays
 * — no caching, no indexes: a few dozen cars filter in well under a frame, and
 * an index is one more thing to invalidate when a row is added.
 */

export type { Car, CarCategory, ConnectorStandard }

export const CATEGORY_ORDER: CarCategory[] = ['EV', 'PHEV', 'REEV', 'Hybrid']

export function getAllCars(): Car[] {
  return [...cars]
}

export function getCarBySlug(slug: string): Car | undefined {
  return cars.find((car) => car.slug === slug)
}

export function getCarsByIds(ids: string[]): Car[] {
  // Mapped over ids rather than filtered over cars, so the result follows the
  // order the user picked them in — which is the order the comparison shows.
  return ids
    .map((id) => cars.find((car) => car.id === id))
    .filter((car): car is Car => Boolean(car))
}

/** Brands present in the data, alphabetical. Never a hardcoded list. */
export function getBrands(list: Car[] = cars): string[] {
  return Array.from(new Set(list.map((car) => car.brand))).sort((a, b) => a.localeCompare(b))
}

/** Only the categories that actually have cars — no empty "Hybrid" chip. */
export function getCategories(list: Car[] = cars): CarCategory[] {
  const present = new Set(list.map((car) => car.category))
  return CATEGORY_ORDER.filter((category) => present.has(category))
}

export function getConnectors(list: Car[] = cars): ConnectorStandard[] {
  const present = new Set<ConnectorStandard>()
  for (const car of list) for (const connector of car.connector ?? []) present.add(connector)
  return Array.from(present).sort((a, b) => a.localeCompare(b))
}

/** The full price span in the data, for the range slider's bounds. */
export function getPriceBounds(): { min: number; max: number } {
  const values = cars.flatMap((car) => [car.price.min, car.price.max])
  return { min: Math.min(...values), max: Math.max(...values) }
}

// ─── Pakistani money ────────────────────────────────────────

/**
 * Rupees as Lakh and Crore.
 *
 * Not Intl.NumberFormat: 'en-PK' groups in the Western thousands pattern, so
 * 15,000,000 comes out "15,000,000" rather than the "1.5 Cr" a buyer here
 * reads. Trailing zeros are trimmed so 1.50 Cr prints as "1.5 Cr" but 1.0649
 * keeps its precision — the figure was published to four places and rounding it
 * would quietly change the price.
 */
export function formatPkr(rupees: number): string {
  const trim = (value: number, places: number) =>
    Number(value.toFixed(places)).toString().replace(/\.0+$/, '')

  if (rupees >= 10_000_000) return `PKR ${trim(rupees / 10_000_000, 4)} Cr`
  if (rupees >= 100_000) return `PKR ${trim(rupees / 100_000, 2)} Lakh`
  return `PKR ${rupees.toLocaleString('en-PK')}`
}

/**
 * What a card shows.
 *
 * Prefers the published wording over anything derived, so "PKR 1.33–1.70 Cr"
 * appears exactly as quoted rather than being reassembled from two integers.
 */
export function formatCarPrice(car: Car): string {
  return car.price.display
}

// ─── Names, and where the variant goes ──────────────────────

/**
 * How a declared trim joins a car's name — decided here, once.
 *
 * `Car.variant` became public in Phase 4.1's plumbing, and five surfaces have to
 * render it: the catalogue card, the detail page's h1 and breadcrumb, the
 * comparison, and the SEO and structured-data strings. Five copies of
 * `variant ? '<model> <variant>' : model` repeated is five places for the two to
 * drift apart, and the drift is invisible until somebody notices the card and the
 * h1 disagree about what a car is called.
 *
 * Both helpers are pure string joins over data that is already there. Neither
 * invents, infers, or parses a variant out of a model name — a row with
 * `variant: null` gets its existing name back byte for byte, which is what keeps
 * all 35 undeclared rows rendering exactly as they did before.
 *
 * `fullName` and `model` are left alone deliberately. They are stored columns,
 * authored and crawled against, and the matcher compares `model` as published;
 * folding a trim into either would change what the pipeline thinks a car is
 * called. The variant is a display concern on top of them.
 */

/**
 * Brand, model and trim — the car's whole public identity.
 *
 * For alt text, aria-labels, `<option>` labels, table captions, SEO titles and
 * schema.org `name`: anywhere a car has to be identifiable on its own, with no
 * surrounding context to supply the brand.
 *
 * Built from `fullName` rather than `brand + model`, so it keeps whatever the
 * authored full name says — "JAECOO J7 PHEV" is not "JAECOO" + "J7 PHEV" in
 * every row, and reassembling it here would quietly rename cars.
 */
export function carDisplayName(car: Car): string {
  return car.variant ? `${car.fullName} ${car.variant}` : car.fullName
}

/**
 * Model and trim, without the brand.
 *
 * For the surfaces that already show the brand separately — the card's eyebrow,
 * the detail page's brand line, the comparison's column head, the breadcrumb's
 * brand crumb. Prepending the brand again in those places would print it twice.
 */
export function carModelName(car: Car): string {
  return car.variant ? `${car.model} ${car.variant}` : car.model
}

// ─── Search ─────────────────────────────────────────────────

/**
 * Brand, model, full name and category.
 *
 * Every whitespace-separated term must match, so "byd seal" narrows to the Seal
 * instead of returning every BYD plus every car with "seal" in it. Searching
 * "BYD" returns all four BYDs; "PHEV" returns the plug-in hybrids, since the
 * category is part of the haystack.
 */
export function searchCars(list: Car[], query: string): Car[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return [...list]

  return list.filter((car) => {
    /*
      The variant joins the haystack, so a declared trim is searchable: with the
      Seal declaring "61.4 kWh RWD Comfort", "seal comfort" finds it. Undeclared
      rows contribute an empty string and match exactly as they did before.

      Still a substring test over normalised text, and still every term must
      match — no fuzzy matching, no scoring, nothing that could make a search
      term look like evidence of identity. This is a text filter over a list a
      person is already looking at; it has nothing to do with the matcher.
    */
    const haystack = [car.brand, car.model, car.variant ?? '', car.fullName, car.category]
      .join(' ')
      .toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

// ─── Filters ────────────────────────────────────────────────

export interface CarFilterState {
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  /** Rupees. A car matches when its span overlaps this one. */
  priceMax: number | null
  /** Minimums — "at least this much". */
  minBattery: number | null
  minRange: number | null
  minPower: number | null
}

export const EMPTY_FILTERS: CarFilterState = {
  brands: [],
  categories: [],
  connectors: [],
  priceMax: null,
  minBattery: null,
  minRange: null,
  minPower: null,
}

export function hasActiveFilters(filters: CarFilterState): boolean {
  return (
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.connectors.length > 0 ||
    filters.priceMax !== null ||
    filters.minBattery !== null ||
    filters.minRange !== null ||
    filters.minPower !== null
  )
}

/**
 * The distance a car can go on electricity, whichever field holds it.
 *
 * An EV keeps it in `range` and a PHEV in `electricRange`, so a single "range"
 * filter has to read both or it would silently exclude every plug-in hybrid the
 * moment somebody dragged the slider.
 */
export function electricDistance(car: Car): number | null {
  return car.range ?? car.electricRange
}

/**
 * All filters, ANDed.
 *
 * Empty groups mean "no constraint" rather than "match nothing", which is what
 * makes the sidebar start unfiltered. A minimum against a null spec excludes
 * the car — asking for 60 kWh cannot be satisfied by a battery nobody
 * published, and quietly including it would put an unknown in a list the user
 * asked to be certain about.
 */
export function filterCars(list: Car[], filters: CarFilterState): Car[] {
  return list.filter((car) => {
    if (filters.brands.length > 0 && !filters.brands.includes(car.brand)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(car.category)) return false

    if (filters.connectors.length > 0) {
      const own = car.connector ?? []
      if (!filters.connectors.some((connector) => own.includes(connector))) return false
    }

    // Overlap, not "starts below": a 1.33–1.70 Cr car belongs in a search
    // capped at 1.5 Cr, because you can buy one for less than the cap.
    if (filters.priceMax !== null && car.price.min > filters.priceMax) return false

    if (filters.minBattery !== null) {
      if (car.batteryCapacity === null || car.batteryCapacity < filters.minBattery) return false
    }

    if (filters.minRange !== null) {
      const distance = electricDistance(car)
      if (distance === null || distance < filters.minRange) return false
    }

    if (filters.minPower !== null) {
      if (car.power === null || car.power < filters.minPower) return false
    }

    return true
  })
}

// ─── Sorting ────────────────────────────────────────────────

export type CarSort =
  'price-asc' | 'price-desc' | 'range-desc' | 'battery-desc' | 'power-desc' | 'newest'

export const SORT_LABELS: Record<CarSort, string> = {
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'range-desc': 'Range: highest',
  'battery-desc': 'Battery: largest',
  'power-desc': 'Power: highest',
  newest: 'Newest',
}

/**
 * Nulls sort last in every direction.
 *
 * A car with no published power is not the least powerful car — it is unknown,
 * and putting it at the top of "power: highest" would read as a claim. Sorting
 * it to the bottom regardless of direction keeps the ranked end of the list
 * meaningful.
 */
function compareDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return b - a
}

export function sortCars(list: Car[], sort: CarSort): Car[] {
  const out = [...list]

  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => a.price.min - b.price.min)
    case 'price-desc':
      return out.sort((a, b) => b.price.max - a.price.max)
    case 'range-desc':
      return out.sort((a, b) => compareDesc(electricDistance(a), electricDistance(b)))
    case 'battery-desc':
      return out.sort((a, b) => compareDesc(a.batteryCapacity, b.batteryCapacity))
    case 'power-desc':
      return out.sort((a, b) => compareDesc(a.power, b.power))
    case 'newest':
      /**
       * The data carries no launch or listing date, so "newest" cannot be
       * answered from it. Rather than invent an order and present it as
       * recency, this keeps the authored order of the module — which is how the
       * list was supplied. Give a car a `listedAt` and this becomes a real
       * sort; until then it is honest about being the default order.
       */
      return out
    default:
      return out
  }
}

// ─── Which specs a category should show ─────────────────────

/**
 * The headline figures per powertrain.
 *
 * An EV's story is battery → range → how fast it charges. A PHEV's is battery →
 * electric range → the engine that takes over. Showing a PHEV an empty "range"
 * row, or an EV an empty "engine" row, is how a spec sheet starts looking
 * unfinished — so each category names its own fields and the card renders only
 * those.
 */
export function headlineSpecs(car: Car): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = []

  const push = (label: string, value: string | null) => {
    if (value) out.push({ label, value })
  }

  const span = (low: number | null, high: number | null, unit: string) => {
    if (low === null) return null
    return high ? `${low}–${high} ${unit}` : `${low} ${unit}`
  }

  push('Battery', car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null)

  if (car.category === 'EV') {
    push('Range', span(car.range, car.rangeMax, car.rangeUnit))
    push('DC charging', car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null)
    push('AC charging', car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null)
  } else {
    push('Electric range', span(car.electricRange, car.electricRangeMax, car.rangeUnit))
    push('Engine', car.engineCapacity ? `${car.engineCapacity} cc` : null)
    push('Power', car.power ? `${car.power} ${car.powerUnit}` : null)
  }

  return out
}

/**
 * Exactly three rows for a card, in a fixed order, figure and unit kept apart.
 *
 * ── Why fixed slots, and not "whatever was published" ─────────────────
 *
 * headlineSpecs() answers "which figures does this car have", which is the
 * right question for a detail page and the wrong one for a grid. It returns two
 * rows for a car with two figures and four for a car with four, and — because
 * it skips the gaps — it returns them in whatever order the gaps left.
 *
 * That produced a real fault. The Toyota Corolla Cross Hybrid publishes no
 * battery capacity and, being a full hybrid, no electric-only range, so
 * headlineSpecs returned [Engine, Power] and the card read ENGINE / POWER /
 * BATTERY while the Chery Tiggo Cross HEV beside it read BATTERY / ENGINE /
 * POWER. Two cards of the same category, same three labels, different rows —
 * which defeats the only reason to put figures in a grid at all. Somebody
 * comparing five hybrids should be able to read straight down the second row.
 *
 * So the slots are declared per category and the data fills them. Row two of a
 * hybrid card is the engine on every hybrid card, whether or not that car
 * published one. Where it did not, the row says so with an em dash: a stated
 * absence, which is rule 1 of src/data/cars.ts — never a zero, never a
 * plausible number.
 *
 * ── Why each category has the slots it has ────────────────────────────
 *
 * An EV's is how much battery, how far it goes, how hard it pulls. A plug-in's
 * is how much battery, how far on electricity alone, and what takes over when
 * that runs out.
 *
 * The EV's third slot was DC charging speed first, which is the more
 * interesting figure and the wrong one to put here. Counted against the data:
 * 7 of the 20 EVs publish a DC figure and all 20 publish power, so two cards in
 * three would have carried a dash in that row — a third of the grid's third row
 * saying nothing. Power is not a consolation either: it is one of the six sorts
 * and one of the filter facets, so it is already a figure this product treats as
 * first-class. Charging speed is on the detail page, in full, alongside the AC
 * figure and the connector standard.
 *
 * A full hybrid gets its own list rather than sharing the plug-in's, and that
 * is the one non-obvious entry. Every full hybrid in the data has a null
 * electricRange, and not because nobody published it — a full hybrid has no
 * electric-only range to publish. A permanently dashed row on all five cars
 * would spend a third of the card saying nothing, so the slot goes to power,
 * which they all have. A dash should mean "this car did not say", not "this
 * field does not apply to anything here".
 *
 * ── Figure and unit ───────────────────────────────────────────────────
 *
 * Separated so the card can set "45.12" at reading size and "kWh" small beside
 * it. A number with its unit at equal weight reads as a sentence; with the unit
 * subordinate it reads as a quantity, which is what somebody comparing four
 * batteries is doing.
 *
 * The unit keeps its published casing — kWh, kW, km, hp, cc — because these are
 * SI symbols. "KWH" would sit more neatly in a row of uppercase labels and
 * would also be wrong, and the labels are uppercased in CSS for exactly that
 * reason: so the values do not have to be.
 *
 * Labels are short on purpose. "DC charging" fits the 256px card at xl; "DC
 * charging speed" wraps, and a wrapped label breaks the row rhythm this whole
 * function exists to hold.
 */
export interface CardSpec {
  label: string
  figure: string | null
  unit: string | null
}

/** The three rows a card of each category shows, in the order it shows them. */
type CardSlot = 'battery' | 'range' | 'electricRange' | 'dcCharging' | 'engine' | 'power'

const CARD_SLOTS: Record<CarCategory, [CardSlot, CardSlot, CardSlot]> = {
  EV: ['battery', 'range', 'power'],
  PHEV: ['battery', 'electricRange', 'engine'],
  REEV: ['battery', 'electricRange', 'engine'],
  Hybrid: ['battery', 'engine', 'power'],
}

const SLOT_LABEL: Record<CardSlot, string> = {
  battery: 'Battery',
  range: 'Range',
  electricRange: 'Electric range',
  dcCharging: 'DC charging',
  engine: 'Engine',
  power: 'Power',
}

export function cardSpecs(car: Car): CardSpec[] {
  /** A span keeps both ends as one figure — see splitFigure. */
  const span = (low: number | null, high: number | null, unit: string) =>
    low === null ? null : high ? `${low}–${high} ${unit}` : `${low} ${unit}`

  const value = (slot: CardSlot): string | null => {
    switch (slot) {
      case 'battery':
        return car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null
      case 'range':
        return span(car.range, car.rangeMax, car.rangeUnit)
      case 'electricRange':
        return span(car.electricRange, car.electricRangeMax, car.rangeUnit)
      case 'dcCharging':
        return car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null
      case 'engine':
        return car.engineCapacity ? `${car.engineCapacity} cc` : null
      case 'power':
        return car.power ? `${car.power} ${car.powerUnit}` : null
    }
  }

  return CARD_SLOTS[car.category].map((slot) => {
    const published = value(slot)
    return {
      label: SLOT_LABEL[slot],
      ...(published ? splitFigure(published) : { figure: null, unit: null }),
    }
  })
}

/**
 * Splits "61.44 kWh" into its figure and its unit.
 *
 * Ranges survive as one figure ("410–450" + "km"), because the span is the
 * quantity — breaking it apart would print two numbers with no relationship
 * between them. Anything that does not begin with a digit comes back whole as
 * the figure with no unit: a slightly large string is a better failure than a
 * mangled one.
 */
function splitFigure(value: string): { figure: string; unit: string | null } {
  const match = /^([\d.,]+(?:\s*[–-]\s*[\d.,]+)?)\s*(.*)$/.exec(value.trim())
  if (!match?.[1]) return { figure: value, unit: null }
  return {
    figure: match[1].replace(/\s/g, ''),
    unit: match[2]?.trim() || null,
  }
}

/** Every published figure, for the detail page and the comparison. */
export function fullSpecs(car: Car): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = []
  const push = (label: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && value !== '') {
      out.push({ label, value: String(value) })
    }
  }

  const span = (low: number | null, high: number | null, unit: string) =>
    low === null ? null : high ? `${low}–${high} ${unit}` : `${low} ${unit}`

  push('Category', car.category)
  push('Price', car.price.display)
  push('Battery capacity', car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null)
  push('Driving range', span(car.range, car.rangeMax, car.rangeUnit))
  push('Electric range', span(car.electricRange, car.electricRangeMax, car.rangeUnit))
  push('Power', car.power ? `${car.power} ${car.powerUnit}` : null)
  push('Torque', car.torque ? `${car.torque} Nm` : null)
  push('0–100 km/h', car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null)
  push('Top speed', car.topSpeed ? `${car.topSpeed} km/h` : null)
  push('DC charging', car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null)
  push('AC charging', car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null)
  push('Charging connector', car.connector?.length ? car.connector.join(', ') : null)
  push('Engine capacity', car.engineCapacity ? `${car.engineCapacity} cc` : null)
  push('Seats', car.seats)

  return out
}

// ─── SEO ────────────────────────────────────────────────────

/**
 * Titles and descriptions built from the row.
 *
 * Written here rather than on the page so all of them stay in one shape, and so
 * a car with no battery figure does not end up with a description containing
 * "null kWh".
 */
export function carSeo(car: Car): {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  canonical: string
} {
  const kind =
    car.category === 'EV'
      ? 'EV'
      : car.category === 'REEV'
        ? 'range-extender'
        : car.category.toLowerCase()

  const facts = [
    car.batteryCapacity ? `${car.batteryCapacity} kWh battery` : null,
    car.range ? `${car.range} km range` : null,
    car.electricRange ? `${car.electricRange} km electric range` : null,
    car.power ? `${car.power} hp` : null,
  ].filter(Boolean)

  /*
    The declared trim is part of the name in every string below.

    It has to be. The figures quoted in the description — battery, range, power —
    are variant-level for an EV, so a title naming only "BYD Seal" while the body
    quotes the Comfort trim's 61.44 kWh is a page claiming those numbers for
    every Seal. That is the same conflation Phase 4.1 was created to stop, and a
    search result is where it would do the most damage: it is the version of the
    page most people see, and the one they never scroll.

    An undeclared row returns its `fullName` unchanged, so 35 of 36 titles,
    descriptions and OG strings are byte-identical to before.
  */
  const name = carDisplayName(car)

  const description = `${name} price in Pakistan: ${car.price.display}. ${
    facts.length > 0 ? `${facts.join(', ')}. ` : ''
  }Full ${kind} specifications, charging and range on Plug.pk.`

  return {
    title: `${name} Price in Pakistan | ${
      car.category === 'EV' ? 'EV Specifications & Range' : 'Specifications & Electric Range'
    }`,
    description,
    ogTitle: `${name} — ${car.price.display}`,
    ogDescription: description,
    canonical: `/cars/${car.slug}`,
  }
}

// ─── Grouped specifications ─────────────────────────────────

export interface SpecGroup {
  title: string
  rows: Array<{ label: string; value: string }>
}

/**
 * The specifications, in blocks a reader can navigate.
 *
 * fullSpecs() returns one flat list, which is fine for a card but poor for a
 * detail page: fourteen unlabelled rows means scanning all of them to find the
 * charging figure. Grouping puts related numbers together, and — because an
 * empty group is dropped — a PHEV shows an Engine block where an EV shows none,
 * without either page carrying a heading over nothing.
 */
export function specGroups(car: Car): SpecGroup[] {
  const span = (low: number | null, high: number | null, unit: string) =>
    low === null ? null : high ? `${low}–${high} ${unit}` : `${low} ${unit}`

  /** Pairs before filtering, so a null value can be dropped by value not label. */
  type Draft = { title: string; rows: Array<[string, string | null]> }

  const drafts: Draft[] = [
    {
      title: 'Battery & range',
      rows: [
        [
          'Battery capacity',
          car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null,
        ],
        ['Driving range', span(car.range, car.rangeMax, car.rangeUnit)],
        ['Electric range', span(car.electricRange, car.electricRangeMax, car.rangeUnit)],
      ],
    },
    {
      title: 'Charging',
      rows: [
        ['DC fast charging', car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null],
        ['AC charging', car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null],
        ['Connector', car.connector?.length ? car.connector.join(', ') : null],
      ],
    },
    {
      title: 'Performance',
      rows: [
        ['Power', car.power ? `${car.power} ${car.powerUnit}` : null],
        ['Torque', car.torque ? `${car.torque} Nm` : null],
        ['0–100 km/h', car.acceleration ? `${car.acceleration} ${car.accelerationUnit}` : null],
        ['Top speed', car.topSpeed ? `${car.topSpeed} km/h` : null],
      ],
    },
    {
      title: car.category === 'REEV' ? 'Range extender' : 'Engine',
      rows: [['Displacement', car.engineCapacity ? `${car.engineCapacity} cc` : null]],
    },
    {
      title: 'Practical',
      rows: [['Seats', car.seats ? String(car.seats) : null]],
    },
  ]

  return drafts
    .map((draft) => ({
      title: draft.title,
      rows: draft.rows
        .filter((row): row is [string, string] => row[1] !== null)
        .map(([label, value]) => ({ label, value })),
    }))
    .filter((group) => group.rows.length > 0)
}

/**
 * Cars a reader might look at instead of this one.
 *
 * Same powertrain first, then nearest on price, because those are the two axes
 * somebody actually shops along — a PHEV buyer is not cross-shopping a 4-crore
 * EV. Falls back to nearest price across all categories when a category has too
 * few members to fill the row, so the rail is never half empty.
 */
export function getSimilarCars(car: Car, pool: Car[] = cars, limit = 3): Car[] {
  const distance = (other: Car) => Math.abs(other.price.min - car.price.min)
  const others = pool.filter((entry) => entry.id !== car.id)

  const sameCategory = others
    .filter((entry) => entry.category === car.category)
    .sort((a, b) => distance(a) - distance(b))

  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)

  const rest = others
    .filter((entry) => entry.category !== car.category)
    .sort((a, b) => distance(a) - distance(b))

  return [...sameCategory, ...rest].slice(0, limit)
}

// ─── Insights ───────────────────────────────────────────────

export interface Insight {
  label: string
  value: string
  car: Car
}

/**
 * Superlatives, computed rather than curated.
 *
 * Every one is the actual extreme of the dataset, so nothing here can drift out
 * of date when a car is added or a price changes. A category is skipped
 * entirely when no car carries that figure — with only eight of the cars
 * publishing an acceleration time, a "quickest" claim drawn from those eight
 * would read as a claim about all of them.
 *
 * Deliberately not "best EV" or "best value": both need a budget and a use case
 * this data has no knowledge of. Longest, cheapest, largest and most powerful
 * are facts.
 */
export function getInsights(list: Car[] = cars): Insight[] {
  const out: Insight[] = []

  const extreme = (
    label: string,
    pick: (car: Car) => number | null,
    direction: 'max' | 'min',
    format: (car: Car) => string,
  ) => {
    const scored = list
      .map((car) => ({ car, value: pick(car) }))
      .filter((entry): entry is { car: Car; value: number } => entry.value !== null)

    if (scored.length === 0) return

    const winner = scored.reduce((best, entry) =>
      direction === 'max'
        ? entry.value > best.value
          ? entry
          : best
        : entry.value < best.value
          ? entry
          : best,
    )

    out.push({ label, value: format(winner.car), car: winner.car })
  }

  extreme(
    'Longest range',
    (car) => electricDistance(car),
    'max',
    (car) => `${electricDistance(car)} km`,
  )
  extreme(
    'Most affordable',
    (car) => car.price.min,
    'min',
    (car) => car.price.display,
  )
  extreme(
    'Largest battery',
    (car) => car.batteryCapacity,
    'max',
    (car) => `${car.batteryCapacity} kWh`,
  )
  extreme(
    'Most powerful',
    (car) => car.power,
    'max',
    (car) => `${car.power} hp`,
  )
  extreme(
    'Fastest charging',
    (car) => car.dcCharging,
    'max',
    (car) => `${car.dcCharging} kW DC`,
  )

  return out
}

// ─── URL state ──────────────────────────────────────────────

/**
 * Filters, search and sort as query parameters.
 *
 * Without this a filtered view cannot be sent to anybody, bookmarked, or
 * returned to with the back button — the three things a person does after
 * finding a car they like. Kept short and readable (`?q=byd&type=EV&max=15000000`)
 * because these end up in messages people paste to each other.
 *
 * Only non-default values are written, so an untouched page keeps a clean /cars
 * URL rather than a string of empties.
 */
export function filtersToParams(
  query: string,
  filters: CarFilterState,
  sort: CarSort,
): URLSearchParams {
  const params = new URLSearchParams()

  if (query.trim()) params.set('q', query.trim())
  if (filters.categories.length > 0) params.set('type', filters.categories.join(','))
  if (filters.brands.length > 0) params.set('brand', filters.brands.join(','))
  if (filters.connectors.length > 0) params.set('plug', filters.connectors.join(','))
  if (filters.minBattery !== null) params.set('battery', String(filters.minBattery))
  if (filters.minRange !== null) params.set('range', String(filters.minRange))
  if (filters.minPower !== null) params.set('power', String(filters.minPower))
  if (sort !== 'price-asc') params.set('sort', sort)

  return params
}

/**
 * The reverse, tolerant of anything.
 *
 * A URL is user input — hand-edited, truncated by a chat app, or left over from
 * an older version of the page. Unknown brands, bad numbers and a sort key that
 * no longer exists are dropped rather than throwing, so a mangled link still
 * lands on a working page.
 */
export function paramsToFilters(params: URLSearchParams): {
  query: string
  filters: CarFilterState
  sort: CarSort
} {
  const list = (key: string) =>
    (params.get(key) ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)

  const number = (key: string) => {
    const raw = params.get(key)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  }

  const validBrands = new Set(getBrands())
  const validCategories = new Set(getCategories())
  const validConnectors = new Set(getConnectors())
  const sortKey = params.get('sort')

  return {
    query: params.get('q') ?? '',
    filters: {
      brands: list('brand').filter((brand) => validBrands.has(brand)),
      categories: list('type').filter((entry): entry is CarCategory =>
        validCategories.has(entry as CarCategory),
      ),
      connectors: list('plug').filter((entry): entry is ConnectorStandard =>
        validConnectors.has(entry as ConnectorStandard),
      ),
      /*
        `max` is not read back.

        The price control was removed from the filter panel, so nothing on the
        page can set or clear priceMax. Honouring the parameter anyway meant a
        /cars?max=… link quietly cut the grid — 28 cars down to 11 in testing —
        with no visible control saying why and no way to undo it short of
        editing the address bar. An invisible filter is worse than no filter.

        priceMax stays on CarFilterState and in filterCars, so restoring a price
        control is a matter of adding the UI back and restoring this line.
      */
      priceMax: null,
      minBattery: number('battery'),
      minRange: number('range'),
      minPower: number('power'),
    },
    sort: sortKey && sortKey in SORT_LABELS ? (sortKey as CarSort) : 'price-asc',
  }
}

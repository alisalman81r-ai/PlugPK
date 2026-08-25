// crawler/normalise.ts

import type { ScrapedCar } from './types'

/**
 * Turning a scraped page into a consistent internal shape.
 *
 * Pure. Nothing here reads or writes the database, opens a browser, or touches
 * the filesystem — give it a `ScrapedCar` and it returns a `NormalisedCar` and a
 * list of what it could not understand. That is what makes it testable without a
 * crawl and safe to run over stored records long after the page has changed.
 *
 * ── The rule this module exists to hold ───────────────────────────────
 *
 * It never guesses. A figure it cannot parse becomes null with a reason
 * recorded, never a plausible number. That is the catalogue's governing rule
 * pushed one layer earlier: the moment a normaliser is willing to invent a
 * value, every downstream check is inspecting fiction.
 *
 * Concretely: "1.05 Cr" parses, "around 1 crore" does not, and "PKR 45–52 Lakh"
 * yields a min and a max rather than an average nobody published.
 */

/** What every source is flattened into, before matching or review. */
export interface NormalisedCar {
  /** Manufacturer, in the catalogue's casing where recognised. */
  brand: string | null
  /** Model without the brand or the trim. */
  model: string | null
  /** Trim or variant, when the name carried one: "Advanced", "GT-Line". */
  variant: string | null
  /** Four-digit year, when stated. */
  modelYear: number | null
  /** Brand + model + variant, as the source presented it. */
  fullName: string | null
  /** EV | PHEV | REEV | Hybrid, mapped from whatever the source called it. */
  category: string | null

  /** Rupees. Equal when a single price was published. */
  priceMin: number | null
  priceMax: number | null
  /** The price exactly as written, so a qualifier survives the parse. */
  priceRaw: string | null

  batteryKwh: number | null
  rangeKm: number | null
  electricRangeKm: number | null
  powerHp: number | null
  accelerationSec: number | null
  topSpeedKph: number | null
  torqueNm: number | null
  seats: number | null
  dcKw: number | null
  acKw: number | null
  engineCc: number | null
  connectors: string[]

  imageUrl: string | null
}

export interface NormaliseResult {
  car: NormalisedCar
  /** Field name → why it could not be read. Empty when everything parsed. */
  problems: Record<string, string>
  /** Fields carrying a value, and how many were attempted. */
  filled: number
  attempted: number
  /** 0–100. Coverage, reduced when the source disagreed with itself. */
  confidence: number
}

const LAKH = 100_000
const CRORE = 10_000_000

/** How sources spell the four powertrains this catalogue recognises. */
const CATEGORY_ALIASES: Record<string, string> = {
  ev: 'EV',
  bev: 'EV',
  electric: 'EV',
  'battery electric': 'EV',
  'fully electric': 'EV',
  phev: 'PHEV',
  'plug-in hybrid': 'PHEV',
  'plug in hybrid': 'PHEV',
  'plugin hybrid': 'PHEV',
  'dm-i': 'PHEV',
  reev: 'REEV',
  erev: 'REEV',
  'range extender': 'REEV',
  'range-extended': 'REEV',
  hybrid: 'Hybrid',
  hev: 'Hybrid',
  'full hybrid': 'Hybrid',
  'self-charging hybrid': 'Hybrid',
}

/** Connector spellings, mapped to the four the catalogue stores. */
const CONNECTOR_ALIASES: Record<string, string> = {
  ccs2: 'CCS2',
  'ccs 2': 'CCS2',
  'ccs combo 2': 'CCS2',
  'type 2': 'Type 2',
  type2: 'Type 2',
  mennekes: 'Type 2',
  'gb/t': 'GB/T',
  gbt: 'GB/T',
  chademo: 'CHAdeMO',
}

/** Collapses whitespace and strips the punctuation sources vary on. */
export function normaliseText(value: string | null | undefined): string | null {
  if (!value) return null
  const out = value.replace(/\s+/g, ' ').trim()
  return out.length > 0 ? out : null
}

/**
 * A key for comparing names across sources.
 *
 * Lowercased, punctuation removed, whitespace collapsed — so "BYD Atto-3" and
 * "byd atto 3" agree. Digits are deliberately kept: they are the difference
 * between a Sealion 6 and a Sealion 7.
 */
export function nameKey(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Rupees from the ways a Pakistani price is written.
 *
 * Handles "PKR 72.9 Lakh", "1.05 Cr", "Rs 8,500,000" and the spans between two
 * of them. Returns null rather than a guess for anything vaguer — "around 1
 * crore" is a sentence, not a figure.
 */
export function parsePkr(input: string | null): { min: number; max: number } | null {
  const text = normaliseText(input)
  if (!text) return null

  const cleaned = text.toLowerCase().replace(/,/g, '')
  const unit = /\bcr(?:ore)?\b/.test(cleaned) ? CRORE : /\blakh?\b|\blac\b/.test(cleaned) ? LAKH : 1

  const numbers = cleaned.match(/\d+(?:\.\d+)?/g)
  if (!numbers || numbers.length === 0) return null

  const values = numbers.map((entry) => Number(entry) * unit).filter((entry) => Number.isFinite(entry))
  if (values.length === 0) return null

  /*
    A plain rupee figure below a lakh is almost certainly not a car price — it
    is a page number, a year, or a stray digit picked up by a loose selector.
    Rejecting it is better than storing a car that costs 2,024 rupees.
  */
  const plausible = values.filter((value) => unit !== 1 || value >= LAKH)
  if (plausible.length === 0) return null

  const min = Math.round(Math.min(...plausible))
  const max = Math.round(Math.max(...plausible))
  return { min, max }
}

/** The first number in a string, with an optional plausibility window. */
export function parseNumber(
  input: string | null,
  bounds?: { min: number; max: number },
): number | null {
  const text = normaliseText(input)
  if (!text) return null

  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null

  const value = Number(match[0])
  if (!Number.isFinite(value)) return null
  if (bounds && (value < bounds.min || value > bounds.max)) return null

  return value
}

/** Splits "BYD Atto 3 Advanced" into its parts, given a known brand. */
export function splitName(
  fullName: string | null,
  knownBrands: string[],
): { brand: string | null; model: string | null; variant: string | null } {
  const text = normaliseText(fullName)
  if (!text) return { brand: null, model: null, variant: null }

  // Longest brand first, so "Great Wall" is not shadowed by a shorter match.
  const brand =
    [...knownBrands]
      .sort((a, b) => b.length - a.length)
      .find((candidate) => nameKey(text).startsWith(nameKey(candidate))) ?? null

  const rest = brand ? text.slice(brand.length).trim() : text
  if (rest.length === 0) return { brand, model: null, variant: null }

  /*
    Trim words are matched from a list rather than "the last word", because the
    last word of "Tiggo 8 Pro Max" is part of the model, and taking it would
    make two different cars look like one.
  */
  /*
    Deliberately short, and 'Pro', 'Max' and 'Plus' are deliberately absent.

    They read like trims and are not: "Tiggo 8 Pro Max" is a model, and treating
    'Max' as a trim turned it into "Tiggo 8 Pro" — a name for a different car
    that the matcher would then have matched with complete confidence. A word
    only belongs here if it is never part of a model name, and the cost of being
    wrong is silently merging two cars.
  */
  const TRIMS = ['advanced', 'premium', 'performance', 'gt-line', 'gt line', 'luxury']
  const lowered = rest.toLowerCase()
  const trim = TRIMS.filter((entry) => lowered.endsWith(` ${entry}`)).sort(
    (a, b) => b.length - a.length,
  )[0]

  if (!trim) return { brand, model: rest, variant: null }

  return {
    brand,
    model: rest.slice(0, rest.length - trim.length - 1).trim(),
    variant: rest.slice(rest.length - trim.length).trim(),
  }
}

/** A four-digit year in a plausible window, or null. */
export function parseYear(input: string | null): number | null {
  const text = normaliseText(input)
  if (!text) return null
  const match = text.match(/\b(19[89]\d|20[0-4]\d)\b/)
  return match ? Number(match[1]) : null
}

function mapAlias(value: string | null, table: Record<string, string>): string | null {
  const key = normaliseText(value)?.toLowerCase()
  if (!key) return null
  if (table[key]) return table[key]
  // Substring fallback: "Plug-in Hybrid (DM-i)" should still land on PHEV.
  const hit = Object.keys(table).find((alias) => key.includes(alias))
  return hit ? (table[hit] ?? null) : null
}

/** Reads a spec block, tolerating the label wording each source prefers. */
function spec(specs: Record<string, string>, ...labels: string[]): string | null {
  const entries = Object.entries(specs)
  for (const label of labels) {
    const needle = label.toLowerCase()
    const hit = entries.find(([key]) => key.toLowerCase().includes(needle))
    if (hit) return hit[1]
  }
  return null
}

export interface NormaliseOptions {
  /** Brands already in the catalogue, used to split a name. */
  knownBrands?: string[]
}

/**
 * Normalises one scraped record.
 *
 * Never throws. A crawl of two hundred pages must not stop because page eleven
 * had a malformed price — the failure belongs in `problems`, attached to the
 * record, where a reviewer can see it.
 */
export function normalise(scraped: ScrapedCar, options: NormaliseOptions = {}): NormaliseResult {
  const problems: Record<string, string> = {}
  const specs = scraped.specs ?? {}
  const knownBrands = options.knownBrands ?? []

  const fullName = normaliseText(scraped.name?.value ?? null)
  if (!fullName) problems.fullName = scraped.name?.error ?? 'no name on the page'

  const parts = splitName(fullName, knownBrands)
  if (fullName && !parts.brand) {
    problems.brand = `no known brand at the start of "${fullName}"`
  }

  const priceRaw = normaliseText(scraped.price?.value ?? null)
  const price = parsePkr(priceRaw)
  if (priceRaw && !price) problems.price = `could not read a rupee figure from "${priceRaw}"`
  if (!priceRaw) problems.price = scraped.price?.error ?? 'no price on the page'

  const category = mapAlias(spec(specs, 'powertrain', 'fuel', 'category', 'type'), CATEGORY_ALIASES)

  const connectorText = spec(specs, 'connector', 'charging port', 'plug')
  const connectors = connectorText
    ? [...new Set(
        connectorText
          .split(/[,/|]| and /i)
          .map((entry) => mapAlias(entry, CONNECTOR_ALIASES))
          .filter((entry): entry is string => entry !== null),
      )]
    : []

  /*
    Every numeric field is bounded. A range of 40,000 km or a battery of 4 kWh is
    a mis-parse, not a car, and bounds turn that into a recorded problem instead
    of a number somebody has to notice later.
  */
  const car: NormalisedCar = {
    brand: parts.brand,
    model: parts.model,
    variant: parts.variant,
    modelYear: parseYear(spec(specs, 'year', 'model year') ?? fullName),
    fullName,
    category,

    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    priceRaw,

    batteryKwh: parseNumber(spec(specs, 'battery'), { min: 1, max: 250 }),
    rangeKm: parseNumber(spec(specs, 'driving range', 'range'), { min: 20, max: 1500 }),
    electricRangeKm: parseNumber(spec(specs, 'electric range', 'ev range'), { min: 5, max: 400 }),
    powerHp: parseNumber(spec(specs, 'power', 'horsepower'), { min: 20, max: 2000 }),
    accelerationSec: parseNumber(spec(specs, '0-100', 'acceleration'), { min: 1, max: 30 }),
    topSpeedKph: parseNumber(spec(specs, 'top speed'), { min: 60, max: 400 }),
    torqueNm: parseNumber(spec(specs, 'torque'), { min: 30, max: 2000 }),
    seats: parseNumber(spec(specs, 'seat'), { min: 2, max: 9 }),
    dcKw: parseNumber(spec(specs, 'dc charging', 'dc'), { min: 1, max: 400 }),
    acKw: parseNumber(spec(specs, 'ac charging', 'ac'), { min: 1, max: 50 }),
    engineCc: parseNumber(spec(specs, 'engine'), { min: 500, max: 8000 }),
    connectors,

    imageUrl: scraped.imageUrl?.value ?? null,
  }

  /*
    A photograph the extractor already flagged as belonging to another car is
    dropped rather than carried forward. A wrong image is the hardest bad data
    to notice downstream, because nothing about it is empty.
  */
  if (scraped.imageUrl?.suspect) {
    car.imageUrl = null
    problems.imageUrl = scraped.imageUrl.suspect
  }

  // A hybrid has no plug. The catalogue's write path rejects one that carries a
  // charging figure, so contradicting it here would only fail later and further
  // from the cause.
  if (car.category === 'Hybrid' && (car.dcKw !== null || car.acKw !== null || connectors.length > 0)) {
    problems.category = 'source calls this a full hybrid but published charging figures'
  }

  const counted = [
    car.brand, car.model, car.category, car.priceMin, car.batteryKwh, car.rangeKm,
    car.electricRangeKm, car.powerHp, car.dcKw, car.acKw, car.imageUrl,
  ]
  const filled = counted.filter((value) => value !== null && value !== '').length
  const attempted = counted.length

  const coverage = Math.round((filled / attempted) * 100)
  // Each contradiction costs ten points, so a well-covered but self-inconsistent
  // record cannot outrank a sparse, coherent one.
  const confidence = Math.max(0, Math.min(100, coverage - Object.keys(problems).length * 10))

  return { car, problems, filled, attempted, confidence }
}

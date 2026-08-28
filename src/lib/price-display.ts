// src/lib/price-display.ts

/**
 * Keeping `priceDisplay` honest when `priceMin` or `priceMax` changes.
 *
 * ── The inconsistency this exists to prevent ───────────────────────────
 *
 * Car carries three price columns: two integers a filter sorts on, and one
 * string every card and page actually shows. Approving a crawled price wrote the
 * integer and left the string alone, so a car could sit in the catalogue priced
 * at 15,500,000 rupees while every page that mentions it said "PKR 1.40 Cr". The
 * wrong half is the half people read.
 *
 * ── Why the string is not simply generated ─────────────────────────────
 *
 * Because the catalogue's own strings cannot be generated. They carry two things
 * no formatter can recover from an integer:
 *
 *   an editorial qualifier — "PKR 82 Lakh (indicative)" means the figure is not
 *   a confirmed retail price, and dropping that word turns a hedge into a quote;
 *
 *   a chosen precision — 12,000,000 is written "PKR 1.20 Cr" while 17,000,000 is
 *   written "PKR 1.7 Cr". Both are correct. No rule picks between them, because
 *   the choice was a person's.
 *
 * So this module does not generate a display string from a price. It *rewrites
 * an existing one*, keeping that string's own unit, precision and qualifier, and
 * only when the string can be read back and proves to agree with the integers it
 * accompanies. When it cannot — an unreadable string, a string that already
 * disagrees with its own columns, a figure that will not write exactly at the
 * chosen precision, a price crossing between Lakh and Crore in a way that needs
 * an editorial decision — it refuses and says why, and the caller must send the
 * change to a person instead of publishing a number nobody chose.
 *
 * Refusing is the safe outcome here. A price change held up for a human is a
 * delay; a price change published half-applied is a wrong price on a public page.
 */

export const LAKH = 100_000
export const CRORE = 10_000_000

export type PriceUnit = 'Lakh' | 'Cr'

/** The en dash the catalogue uses between the ends of a span. */
const EN_DASH = '–'

export interface ParsedPriceDisplay {
  min: number
  max: number
  unit: PriceUnit
  /** Decimal places the string was written to, so a rewrite can keep them. */
  decimals: number
  /** A trailing parenthetical such as "(indicative)", or an empty string. */
  qualifier: string
}

const MULTIPLIER: Record<PriceUnit, number> = { Lakh: LAKH, Cr: CRORE }

/**
 * Reads a catalogue price string back into numbers.
 *
 * Strict on shape and deliberately so: this is the gate that decides whether a
 * string is machine-understood enough to be rewritten at all. Anything it does
 * not recognise is something a person wrote for a reason, and the caller's
 * response to null is to ask that person rather than to guess.
 */
export function parsePriceDisplay(display: string | null | undefined): ParsedPriceDisplay | null {
  if (!display) return null

  //         PKR | Rs      lower              optional upper           unit       optional (qualifier)
  const pattern =
    /^\s*(?:PKR|Rs\.?)\s+(\d+(?:\.\d+)?)(?:\s*[–—-]\s*(\d+(?:\.\d+)?))?\s+(Lakh|Cr)\s*(\([^()]*\))?\s*$/i

  const found = pattern.exec(display)
  if (!found) return null

  const [, lowerText, upperText, unitText, qualifier] = found
  if (!lowerText || !unitText) return null

  const unit: PriceUnit = unitText.toLowerCase() === 'cr' ? 'Cr' : 'Lakh'
  const multiplier = MULTIPLIER[unit]

  const min = Math.round(Number(lowerText) * multiplier)
  const max = upperText === undefined ? min : Math.round(Number(upperText) * multiplier)

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null

  /*
    Decimals are taken from the wider end when a span writes them differently.
    "1.33–1.70" is two decimals; a rewrite that produced "1.4–1.70" would look
    like a typo even though both halves are right.
  */
  const decimals = Math.max(
    decimalsIn(lowerText),
    upperText === undefined ? 0 : decimalsIn(upperText),
  )

  return { min, max, unit, decimals, qualifier: qualifier ?? '' }
}

function decimalsIn(text: string): number {
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** The unit the catalogue writes a figure of this size in. */
export function unitFor(value: number): PriceUnit {
  return value >= CRORE ? 'Cr' : 'Lakh'
}

/**
 * The fewest decimal places that write `value` exactly in `unit`.
 *
 * Returns null when no allowed precision does — 10,649,321 rupees is 1.0649321
 * Cr, and a price is not something to round into a public string. Four is the
 * most the catalogue uses ("PKR 1.0649 Cr").
 */
export function exactDecimals(value: number, unit: PriceUnit, limit = 4): number | null {
  const multiplier = MULTIPLIER[unit]
  for (let decimals = 0; decimals <= limit; decimals += 1) {
    if ((value * 10 ** decimals) % multiplier === 0) return decimals
  }
  return null
}

export interface FormatInput {
  min: number
  max: number
  unit: PriceUnit
  decimals: number
  qualifier?: string
}

/** Writes the catalogue's price string. The inverse of `parsePriceDisplay`. */
export function formatPriceDisplay(input: FormatInput): string {
  const multiplier = MULTIPLIER[input.unit]
  const lower = (input.min / multiplier).toFixed(input.decimals)
  const upper = (input.max / multiplier).toFixed(input.decimals)

  const figure = lower === upper ? lower : `${lower}${EN_DASH}${upper}`
  const qualifier = input.qualifier ? ` ${input.qualifier}` : ''

  return `PKR ${figure} ${input.unit}${qualifier}`
}

export interface DeriveInput {
  /** What the catalogue shows today. */
  currentDisplay: string
  /** What the catalogue's integer columns hold today. */
  currentMin: number
  currentMax: number
  /** What they would hold after the change. */
  nextMin: number
  nextMax: number
}

export type DeriveResult =
  | { ok: true; display: string; changed: boolean }
  | { ok: false; reason: string }

/** How a figure reads in a refusal message, without inventing a unit for it. */
function span(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`
}

/**
 * The display string that goes with a new pair of price integers.
 *
 * Refuses rather than guesses. Every refusal reason is written to be shown to
 * the reviewer who tried to approve the change, because the action it asks for
 * is theirs: open the car editor and write the price string by hand.
 */
export function derivePriceDisplay(input: DeriveInput): DeriveResult {
  const { currentDisplay, currentMin, currentMax, nextMin, nextMax } = input

  if (!Number.isInteger(nextMin) || !Number.isInteger(nextMax)) {
    return { ok: false, reason: 'a price must be a whole number of rupees.' }
  }
  if (nextMin <= 0) {
    return { ok: false, reason: 'a price of zero or less is not a price.' }
  }
  if (nextMax < nextMin) {
    return {
      ok: false,
      reason: `this would leave the upper price (${nextMax}) below the lower one (${nextMin}), which renders as a backwards range.`,
    }
  }

  const parsed = parsePriceDisplay(currentDisplay)
  if (!parsed) {
    return {
      ok: false,
      reason: `the displayed price "${currentDisplay}" is not in a form this can rewrite, so a new one cannot be derived without changing how the price reads. Edit the car by hand.`,
    }
  }

  /*
    The round-trip check, and the reason this is safe at all.

    If the string already disagrees with the columns beside it, then somebody has
    been editing one without the other and this function has no idea which is
    right. Rewriting it would silently pick a side.
  */
  if (parsed.min !== currentMin || parsed.max !== currentMax) {
    return {
      ok: false,
      reason: `the displayed price "${currentDisplay}" already disagrees with the stored figures (${span(currentMin, currentMax)}), so it cannot be trusted as a template. Fix the car by hand first.`,
    }
  }

  const unit = unitFor(nextMax)

  /*
    A span whose ends fall either side of a crore.

    "PKR 99.99 Lakh – 1.05 Cr" is not a form the catalogue uses, and writing both
    ends in one unit gives "PKR 0.99–1.05 Cr", which nobody would choose. That is
    an editorial decision, so it goes back to a person.
  */
  if (unitFor(nextMin) !== unit) {
    return {
      ok: false,
      reason:
        'the new range crosses from Lakh into Crore, and how that should read is an editorial choice. Write the price string by hand.',
    }
  }

  const neededMin = exactDecimals(nextMin, unit)
  const neededMax = exactDecimals(nextMax, unit)
  if (neededMin === null || neededMax === null) {
    return {
      ok: false,
      reason: `${span(nextMin, nextMax)} rupees cannot be written exactly in ${unit}, and a price must not be rounded into the string people read.`,
    }
  }

  /*
    Keep the precision the catalogue already chose, unless the new figure needs
    more. "PKR 1.20 Cr" becoming 13,000,000 stays at two decimals — "PKR 1.30
    Cr" — because dropping to "1.3" would read as an edit nobody made.
  */
  const needed = Math.max(neededMin, neededMax)
  const decimals = unit === parsed.unit ? Math.max(parsed.decimals, needed) : needed

  const display = formatPriceDisplay({
    min: nextMin,
    max: nextMax,
    unit,
    decimals,
    qualifier: parsed.qualifier,
  })

  return { ok: true, display, changed: display !== currentDisplay }
}

/** The columns whose approval must carry `priceDisplay` with it. */
export const PRICE_COLUMNS = new Set(['priceMin', 'priceMax'])

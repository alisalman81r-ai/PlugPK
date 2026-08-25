// crawler/units.ts

/**
 * Converting a source's units into the catalogue's, without losing what it said.
 *
 * Every function here returns the converted value **and** the original. That is
 * not politeness — it is the only way a reviewer can tell a genuine
 * disagreement from a unit mistake. "298" against "480" looks like two sources
 * contradicting each other until you can see that one wrote 298 miles.
 *
 * ── The rule ──────────────────────────────────────────────────────────
 *
 * A unit is never guessed. If a source publishes a bare number with no unit and
 * the field could plausibly be either, the value is flagged rather than
 * converted. Assuming kilometres because most of the world uses them is how an
 * American range figure ends up 60% too low on a Pakistani price page.
 *
 * The catalogue's units, for reference: kWh, km, km/h, kW, Nm, kg, mm, PKR.
 * Power is the one exception — `Car.power` is stored in **hp**, because that is
 * what every Pakistani spec sheet quotes, so kW arrives here and leaves as hp.
 */

export type CanonicalUnit = 'kWh' | 'km' | 'km/h' | 'kW' | 'hp' | 'Nm' | 'kg' | 'mm' | 'PKR' | 'sec'

export interface Converted {
  /** In the canonical unit, or null when it could not be established. */
  value: number | null
  unit: CanonicalUnit | null
  /** Exactly what the source gave, including its unit if it had one. */
  raw: string
  /** Set when a conversion happened, naming both ends. */
  conversion?: string
  /** Set when the value was refused rather than converted. */
  problem?: string
}

const FACTORS = {
  milesToKm: 1.609344,
  mphToKmh: 1.609344,
  lbsToKg: 0.45359237,
  hpToKw: 0.7457,
  kwToHp: 1 / 0.7457,
  whToKwh: 1 / 1000,
  inchToMm: 25.4,
  ftLbToNm: 1.35582,
} as const

const round = (value: number, places = 2): number =>
  Math.round(value * 10 ** places) / 10 ** places

/** The number and the unit token out of a string like "298 miles" or "77,4 kWh". */
function split(input: string): { amount: number | null; unit: string } {
  /*
    A comma is a decimal separator in much of Europe and a thousands separator
    elsewhere, and EV datasets come from both. The rule used here: a comma
    followed by exactly two digits at the end of the number is a decimal comma
    ("77,4" is not a possibility — one digit — but "1.234,56" is); otherwise the
    comma is grouping and is dropped. Ambiguous cases are left to the caller's
    bounds check rather than silently resolved.
  */
  let text = input.trim()
  const decimalComma = /\d,\d{1,2}\b/.test(text) && !/\d\.\d/.test(text)
  text = decimalComma ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '')

  const match = text.match(/-?\d+(?:\.\d+)?/)
  const amount = match ? Number(match[0]) : null

  return {
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    unit: text.replace(/-?\d+(?:\.\d+)?/, '').trim().toLowerCase(),
  }
}

/**
 * A distance, as kilometres.
 *
 * `assume` says what a bare number means for this field. Pass nothing and a
 * unitless value is refused — which is the safe default for range, where the
 * mile/kilometre difference is 60%.
 */
export function toKm(input: string, assume?: 'km' | 'mi'): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(mi|mile|miles)$/.test(unit)) {
    return {
      value: round(amount * FACTORS.milesToKm, 1),
      unit: 'km',
      raw,
      conversion: `${amount} mi -> ${round(amount * FACTORS.milesToKm, 1)} km`,
    }
  }
  if (/^(km|kilometre|kilometres|kilometer|kilometers)$/.test(unit) || unit === '') {
    if (unit === '' && assume === undefined) {
      return {
        value: null,
        unit: null,
        raw,
        problem: 'bare number with no unit — km and miles differ by 60%, so this is not guessed',
      }
    }
    if (unit === '' && assume === 'mi') {
      return {
        value: round(amount * FACTORS.milesToKm, 1),
        unit: 'km',
        raw,
        conversion: `${amount} (assumed mi) -> ${round(amount * FACTORS.milesToKm, 1)} km`,
      }
    }
    return { value: amount, unit: 'km', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised distance unit "${unit}"` }
}

/** A battery or energy figure, as kWh. Wh is converted; a bare number is kWh. */
export function toKwh(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^wh$/.test(unit)) {
    return {
      value: round(amount * FACTORS.whToKwh),
      unit: 'kWh',
      raw,
      conversion: `${amount} Wh -> ${round(amount * FACTORS.whToKwh)} kWh`,
    }
  }
  if (/^(kwh|kw h|kilowatt hours?)$/.test(unit) || unit === '') {
    /*
      A bare number is taken as kWh, unlike distance — and the difference is
      defensible. No production car has a battery measured in Wh at this scale, so
      a bare "77.4" cannot plausibly mean 77.4 Wh; a bare "298" genuinely could be
      miles or kilometres. The bounds check in validate.ts catches the rest.
    */
    return { value: amount, unit: 'kWh', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised energy unit "${unit}"` }
}

/** A speed, as km/h. */
export function toKmh(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(mph|mi\/h)$/.test(unit)) {
    return {
      value: round(amount * FACTORS.mphToKmh, 1),
      unit: 'km/h',
      raw,
      conversion: `${amount} mph -> ${round(amount * FACTORS.mphToKmh, 1)} km/h`,
    }
  }
  if (/^(km\/h|kmh|kph|km\/hr)$/.test(unit) || unit === '') {
    return { value: amount, unit: 'km/h', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised speed unit "${unit}"` }
}

/** Charging or motor power, as kW. */
export function toKw(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(hp|bhp|ps|cv)$/.test(unit)) {
    return {
      value: round(amount * FACTORS.hpToKw, 1),
      unit: 'kW',
      raw,
      conversion: `${amount} ${unit} -> ${round(amount * FACTORS.hpToKw, 1)} kW`,
    }
  }
  if (/^(kw|kilowatts?)$/.test(unit) || unit === '') {
    return { value: amount, unit: 'kW', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised power unit "${unit}"` }
}

/**
 * Engine or motor output, as hp.
 *
 * The catalogue stores power in hp, because that is what Pakistani spec sheets
 * quote. Sources that publish kW are converted here rather than at the point of
 * comparison, so a kW figure never lands in an hp column.
 */
export function toHp(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(kw|kilowatts?)$/.test(unit)) {
    return {
      value: Math.round(amount * FACTORS.kwToHp),
      unit: 'hp',
      raw,
      conversion: `${amount} kW -> ${Math.round(amount * FACTORS.kwToHp)} hp`,
    }
  }
  if (/^(hp|bhp|ps|cv)$/.test(unit) || unit === '') {
    return { value: amount, unit: 'hp', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised power unit "${unit}"` }
}

/** Torque, as Nm. */
export function toNm(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(lb-?ft|ft-?lbs?|lbft)$/.test(unit)) {
    return {
      value: Math.round(amount * FACTORS.ftLbToNm),
      unit: 'Nm',
      raw,
      conversion: `${amount} lb-ft -> ${Math.round(amount * FACTORS.ftLbToNm)} Nm`,
    }
  }
  if (/^(nm|newton ?met(re|er)s?)$/.test(unit) || unit === '') {
    return { value: amount, unit: 'Nm', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised torque unit "${unit}"` }
}

/** Mass, as kg. */
export function toKg(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(lbs?|pounds?)$/.test(unit)) {
    return {
      value: Math.round(amount * FACTORS.lbsToKg),
      unit: 'kg',
      raw,
      conversion: `${amount} lb -> ${Math.round(amount * FACTORS.lbsToKg)} kg`,
    }
  }
  if (/^(kg|kilograms?|kgs)$/.test(unit) || unit === '') {
    return { value: amount, unit: 'kg', raw }
  }

  return { value: null, unit: null, raw, problem: `unrecognised mass unit "${unit}"` }
}

/** A dimension, as mm. Metres and inches are converted; a bare number is mm. */
export function toMm(input: string): Converted {
  const { amount, unit } = split(input)
  const raw = input.trim()
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/^(in|inch|inches|")$/.test(unit)) {
    return {
      value: Math.round(amount * FACTORS.inchToMm),
      unit: 'mm',
      raw,
      conversion: `${amount} in -> ${Math.round(amount * FACTORS.inchToMm)} mm`,
    }
  }
  if (/^(m|met(re|er)s?)$/.test(unit)) {
    return { value: Math.round(amount * 1000), unit: 'mm', raw, conversion: `${amount} m -> ${Math.round(amount * 1000)} mm` }
  }
  if (/^(cm|centimet(re|er)s?)$/.test(unit)) {
    return { value: Math.round(amount * 10), unit: 'mm', raw, conversion: `${amount} cm -> ${Math.round(amount * 10)} mm` }
  }
  if (/^mm$/.test(unit) || unit === '') return { value: amount, unit: 'mm', raw }

  return { value: null, unit: null, raw, problem: `unrecognised length unit "${unit}"` }
}

/**
 * A Pakistani price, as whole rupees.
 *
 * Lakh and crore are the units this market actually quotes in, so they are
 * first-class rather than an afterthought. A foreign currency is refused, not
 * converted: an exchange rate is a moving number and applying today's to a price
 * published last March would fabricate a figure nobody published.
 */
export function toPkr(input: string): Converted {
  const raw = input.trim()
  const lowered = raw.toLowerCase()

  const foreign = lowered.match(/\b(usd|eur|gbp|aed|cny|inr|jpy|\$|€|£)\b|[$€£]/)
  if (foreign) {
    return {
      value: null,
      unit: null,
      raw,
      problem: `price is in ${foreign[0]}, not PKR — converting would invent a figure at today's rate`,
    }
  }

  const { amount } = split(lowered.replace(/\b(pkr|rs\.?|rupees?)\b/g, ''))
  if (amount === null) return { value: null, unit: null, raw, problem: 'no number found' }

  if (/\bcr(ore)?\b/.test(lowered)) {
    const value = Math.round(amount * 10_000_000)
    return { value, unit: 'PKR', raw, conversion: `${amount} crore -> ${value} PKR` }
  }
  if (/\bla[ck]h?s?\b/.test(lowered)) {
    const value = Math.round(amount * 100_000)
    return { value, unit: 'PKR', raw, conversion: `${amount} lakh -> ${value} PKR` }
  }

  return { value: Math.round(amount), unit: 'PKR', raw }
}

/** Which converter a field uses, so the comparison engine can look it up. */
export const FIELD_UNITS: Record<string, { unit: CanonicalUnit; convert: (input: string) => Converted }> = {
  batteryCapacity: { unit: 'kWh', convert: toKwh },
  usableBatteryCapacityKwh: { unit: 'kWh', convert: toKwh },
  range: { unit: 'km', convert: (input) => toKm(input) },
  rangeMax: { unit: 'km', convert: (input) => toKm(input) },
  electricRange: { unit: 'km', convert: (input) => toKm(input) },
  electricRangeMax: { unit: 'km', convert: (input) => toKm(input) },
  topSpeed: { unit: 'km/h', convert: toKmh },
  dcCharging: { unit: 'kW', convert: toKw },
  acCharging: { unit: 'kW', convert: toKw },
  power: { unit: 'hp', convert: toHp },
  torque: { unit: 'Nm', convert: toNm },
  weightKg: { unit: 'kg', convert: toKg },
  priceMin: { unit: 'PKR', convert: toPkr },
  priceMax: { unit: 'PKR', convert: toPkr },
}

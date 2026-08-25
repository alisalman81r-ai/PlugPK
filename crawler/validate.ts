// crawler/validate.ts

/**
 * Sanity rules for incoming values.
 *
 * Flags, never silently accepts, and never silently discards either. A value
 * that fails a rule is returned with the failure attached, so it reaches review
 * carrying the reason rather than vanishing — a battery of 4,000 kWh is
 * interesting evidence that a source or a parser is broken, and deleting it
 * hides that.
 *
 * ── Two kinds of rule, and the difference matters ─────────────────────
 *
 * `impossible` — physically or logically cannot be true. A negative battery, a
 * hybrid with a DC charging port, a car with one seat. These make a value
 * unusable.
 *
 * `implausible` — could be true, almost certainly is not. A 1,400 km range, a
 * PKR 500 car, a 40 kWh battery in something sold as a long-range EV. These are
 * worth a human's attention rather than a refusal, because the exception exists
 * and refusing it would quietly cap what the catalogue can describe.
 */

export type Severity = 'impossible' | 'implausible'

export interface ValidationFlag {
  field: string
  severity: Severity
  message: string
}

/** Plausible windows per field. Deliberately wide — these catch nonsense, not nuance. */
const BOUNDS: Record<string, { min: number; max: number; unit: string }> = {
  batteryCapacity: { min: 0.5, max: 250, unit: 'kWh' },
  range: { min: 20, max: 1200, unit: 'km' },
  rangeMax: { min: 20, max: 1200, unit: 'km' },
  electricRange: { min: 5, max: 400, unit: 'km' },
  electricRangeMax: { min: 5, max: 400, unit: 'km' },
  dcCharging: { min: 1, max: 400, unit: 'kW' },
  acCharging: { min: 1, max: 50, unit: 'kW' },
  power: { min: 20, max: 2000, unit: 'hp' },
  torque: { min: 30, max: 2000, unit: 'Nm' },
  acceleration: { min: 1.5, max: 30, unit: 'sec' },
  topSpeed: { min: 60, max: 400, unit: 'km/h' },
  seats: { min: 2, max: 9, unit: 'seats' },
  engineCapacity: { min: 500, max: 8000, unit: 'cc' },
  weightKg: { min: 500, max: 4000, unit: 'kg' },
  // A car under two lakh is a data error; above 20 crore is not a car sold here.
  priceMin: { min: 200_000, max: 200_000_000, unit: 'PKR' },
  priceMax: { min: 200_000, max: 200_000_000, unit: 'PKR' },
}

/** Fields that are quantities and can never be negative. */
const NON_NEGATIVE = Object.keys(BOUNDS)

/** One field, on its own. */
export function validateField(field: string, value: unknown): ValidationFlag[] {
  const flags: ValidationFlag[] = []
  if (value === null || value === undefined) return flags

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      flags.push({ field, severity: 'impossible', message: 'not a finite number' })
      return flags
    }

    if (NON_NEGATIVE.includes(field) && value < 0) {
      flags.push({ field, severity: 'impossible', message: `negative (${value})` })
      return flags
    }

    const bound = BOUNDS[field]
    if (bound) {
      if (value < bound.min) {
        flags.push({
          field,
          severity: 'implausible',
          message: `${value} ${bound.unit} is below the plausible floor of ${bound.min}`,
        })
      } else if (value > bound.max) {
        flags.push({
          field,
          severity: 'implausible',
          message: `${value} ${bound.unit} is above the plausible ceiling of ${bound.max}`,
        })
      }
    }
  }

  if (field === 'seats' && typeof value === 'number' && !Number.isInteger(value)) {
    flags.push({ field, severity: 'impossible', message: 'a fractional number of seats' })
  }

  return flags
}

export interface CrossFieldInput {
  category?: string | null
  batteryCapacity?: number | null
  range?: number | null
  rangeMax?: number | null
  electricRange?: number | null
  electricRangeMax?: number | null
  dcCharging?: number | null
  acCharging?: number | null
  connectors?: string[] | null
  engineCapacity?: number | null
  priceMin?: number | null
  priceMax?: number | null
}

/**
 * Rules that only make sense across several fields at once.
 *
 * This is where the powertrain rules live, and they are the ones most likely to
 * corrupt the catalogue quietly. A source that lists a hybrid's charging port
 * because its template has one, or that reports a PHEV's 85 km electric range in
 * the `range` column beside real EVs doing 500 km, produces a row that is
 * individually plausible and collectively wrong.
 */
export function validateCrossField(input: CrossFieldInput): ValidationFlag[] {
  const flags: ValidationFlag[] = []
  const category = input.category ?? null

  // ── Hybrids have no plug ──────────────────────────────────────────
  if (category === 'Hybrid') {
    if (input.dcCharging !== null && input.dcCharging !== undefined) {
      flags.push({
        field: 'dcCharging',
        severity: 'impossible',
        message: 'a full hybrid has no charging port, so it cannot have a DC rate',
      })
    }
    if (input.acCharging !== null && input.acCharging !== undefined) {
      flags.push({
        field: 'acCharging',
        severity: 'impossible',
        message: 'a full hybrid has no charging port, so it cannot have an AC rate',
      })
    }
    if (input.connectors && input.connectors.length > 0) {
      flags.push({
        field: 'connectors',
        severity: 'impossible',
        message: `a full hybrid has no connector, but ${input.connectors.join(', ')} was published`,
      })
    }
    if (input.electricRange !== null && input.electricRange !== undefined) {
      flags.push({
        field: 'electricRange',
        severity: 'implausible',
        message: 'a full hybrid has no meaningful electric-only range — check it is not a PHEV',
      })
    }
  }

  /*
    A PHEV's electric range must not become a BEV range.

    `range` is the full-charge driving range of an electric car; `electricRange`
    is a plug-in's electric-only distance. They are different columns because
    they are different quantities, and a source that puts 85 into `range` makes
    the PHEV look like the shortest-range EV in the catalogue and drags every
    "cheapest per km" comparison with it.
  */
  if (category === 'PHEV' || category === 'REEV') {
    if (input.range !== null && input.range !== undefined) {
      flags.push({
        field: 'range',
        severity: 'impossible',
        message: `a ${category} has no BEV range — ${input.range} km probably belongs in electricRange`,
      })
    }
    if (input.electricRange !== null && input.electricRange !== undefined && input.electricRange > 200) {
      flags.push({
        field: 'electricRange',
        severity: 'implausible',
        message: `${input.electricRange} km of electric-only range is high for a ${category} — check it is not the combined figure`,
      })
    }
  }

  // ── An EV has no engine ───────────────────────────────────────────
  if (category === 'EV') {
    if (input.engineCapacity !== null && input.engineCapacity !== undefined) {
      flags.push({
        field: 'engineCapacity',
        severity: 'impossible',
        message: 'a battery electric car has no petrol engine',
      })
    }
    if (input.electricRange !== null && input.electricRange !== undefined) {
      flags.push({
        field: 'electricRange',
        severity: 'implausible',
        message: 'an EV’s range belongs in `range`; electricRange is for plug-in hybrids',
      })
    }
  }

  // ── Spans must not be inverted ────────────────────────────────────
  if (
    typeof input.range === 'number' &&
    typeof input.rangeMax === 'number' &&
    input.rangeMax < input.range
  ) {
    flags.push({
      field: 'rangeMax',
      severity: 'impossible',
      message: `upper figure ${input.rangeMax} is below the lower ${input.range}`,
    })
  }
  if (
    typeof input.priceMin === 'number' &&
    typeof input.priceMax === 'number' &&
    input.priceMax < input.priceMin
  ) {
    flags.push({
      field: 'priceMax',
      severity: 'impossible',
      message: `upper price ${input.priceMax} is below the lower ${input.priceMin}`,
    })
  }

  /*
    Range against battery, as a cheap cross-check on both.

    Production EVs consume roughly 12–30 kWh per 100 km. A pair outside 6–45
    implies one of the two numbers is wrong, or that a mile figure was read as
    kilometres — which is exactly the mistake units.ts refuses to make silently
    and this catches when a source made it upstream.
  */
  if (
    typeof input.batteryCapacity === 'number' &&
    typeof input.range === 'number' &&
    input.batteryCapacity > 0 &&
    input.range > 0
  ) {
    const per100 = (input.batteryCapacity / input.range) * 100
    /*
      The floor is 8, not 6, and the difference is the whole point of this rule.

      No production car does better than roughly 9 kWh/100km. A floor of 6 was
      too generous to catch the mistake this exists for: a 480 km car whose
      range was read as 480 *miles* becomes 772 km, giving 7.8 kWh/100km — which
      passed. At 8 it is flagged.
    */
    if (per100 < 8 || per100 > 45) {
      flags.push({
        field: 'range',
        severity: 'implausible',
        message: `${input.batteryCapacity} kWh for ${input.range} km implies ${per100.toFixed(1)} kWh/100km, outside the 8–45 a production car achieves`,
      })
    }
  }

  return flags
}

/** True when nothing found makes the value unusable. */
export function isUsable(flags: ValidationFlag[]): boolean {
  return !flags.some((flag) => flag.severity === 'impossible')
}

import { randomUUID } from 'node:crypto'

import { isRangeStandard } from '../../../crawler/range-standard'

import { prisma } from './client'

/**
 * Declaring a catalogue row's identity, and correcting its figures, with a trail.
 *
 * ── Why this exists rather than `updateCar` ───────────────────────────
 *
 * Phase 4.1 gave `Car` real identity columns — `variant`, `trim`, `modelYear`,
 * `generation`, `rangeStandard`, `electricRangeStandard` — and made the matcher
 * and the approval gate read them. Declaring a variant is therefore the single
 * most consequential edit an operator can make to a row: it decides which source
 * records may ever write to it.
 *
 * Two things made `updateCar` in car-actions.ts the wrong vehicle for that:
 *
 *   it does not handle the identity columns at all, and
 *   it writes `Car` without leaving a `CarChangeHistory` row.
 *
 * The second matters more. `CarChangeHistory.changeId` is documented as "null for
 * a hand edit", which says hand edits were always meant to be recorded — and
 * `updateCar` never has. For an ordinary typo that is a gap; for the edit that
 * governs which crawled figures may reach a public page it would be a hole. So
 * this function writes the row and the history together, in one transaction, or
 * neither.
 *
 * ── What this is NOT ─────────────────────────────────────────────────
 *
 * Not a bypass of the Phase 4.1 gate. That gate governs *crawler proposals* —
 * `applyChange` refusing to apply a source's figure while the trim is unproven.
 * This is the other side of the same design: the operator asserting what the trim
 * IS, which is the act the gate is waiting for. It touches no crawler code, does
 * not weaken `unproven`, and cannot apply a proposal.
 *
 * Nothing here guesses. Every value is supplied by the caller, and the caller is
 * expected to be able to say where it came from — `reason` is required, and the
 * source citation fields exist so an evidenced figure carries its evidence.
 */

/** Figures this function will correct, alongside an identity declaration. */
const CORRECTABLE = {
  batteryCapacity: 'float',
  range: 'int',
  rangeMax: 'int',
  electricRange: 'int',
  electricRangeMax: 'int',
  power: 'int',
  torque: 'int',
  topSpeed: 'int',
  acceleration: 'float',
  seats: 'int',
  dcCharging: 'float',
  acCharging: 'float',
} as const

export type CorrectableField = keyof typeof CORRECTABLE

export interface IdentityDeclaration {
  carId: string

  /**
   * The trim this row describes, as published.
   *
   * `undefined` leaves the column alone; an explicit `null` clears it. The two
   * are deliberately different — "I am not touching this" and "I am asserting
   * that no variant is declared" are different statements, and a caller that
   * cannot express the first would clear a variant by omission.
   */
  variant?: string | null
  trim?: string | null
  modelYear?: number | null
  generation?: string | null

  /**
   * The test cycle behind `range` / `electricRange`.
   *
   * Validated against the six known cycles. There is no default: a range cycle
   * that nobody has evidence for stays null, because `unspecified` and null both
   * mean "unknown" to the comparison layer and inventing a cycle is exactly the
   * error that put 425 km over 650 km.
   */
  rangeStandard?: string | null
  electricRangeStandard?: string | null

  /**
   * Renaming the model, for rows that carry the trim inside it.
   *
   * "Atto 3 Advanced" → model "Atto 3" + variant "Advanced". Both must move
   * together or the row becomes internally inconsistent: a source publishing
   * model "Atto 3" and variant "Advanced" would fail to match a row whose model
   * still reads "Atto 3 Advanced".
   *
   * `slug` is deliberately absent. It is the public URL, and this is a data
   * correction, not a migration of links.
   */
  model?: string
  fullName?: string

  /** Figures to correct in the same transaction. */
  corrections?: Partial<Record<CorrectableField, number | null>>

  /**
   * Repairing the price display string, guarded.
   *
   * `priceDisplay` is deliberately NOT in `corrections` above. A price is three
   * columns that must move together — `priceMin`, `priceMax` and the string every
   * card and page actually shows — and Phase 3 closed a bug where approving one
   * integer left the catalogue internally contradictory. Letting a caller set the
   * string alone would reopen it.
   *
   * So this exists only to restore a string that has drifted from figures which
   * are already correct, and it refuses unless the caller states the figures it
   * expects to find AND they match the row. That makes it impossible to write a
   * display that disagrees with the numbers beside it: if the numbers are wrong
   * too, this is the wrong tool and the price editor is the right one.
   */
  priceDisplay?: string
  expectPriceMin?: number
  expectPriceMax?: number

  /** Required. Goes into every history row this writes. */
  reason: string
  /** Who is asserting it. See the note on approvedBy in car-review-actions.ts. */
  declaredBy: string

  /** Where an evidenced figure came from, when it came from a source. */
  sourceId?: string | null
  sourceUrl?: string | null
}

export interface DeclarationResult {
  ok: boolean
  message: string
  /** Field → [old, new], exactly what moved. Empty when nothing did. */
  changed: Record<string, [string | null, string | null]>
  /** Pages worth revalidating, for a caller that can. */
  revalidate: string[]
}

const render = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value)

/**
 * Applies an identity declaration and any figure corrections.
 *
 * Every changed field gets its own `CarChangeHistory` row, in the same
 * transaction as the update — one row per field, matching what `applyChange`
 * does, so the trail reads the same whether a change came from a source or from a
 * person.
 */
export async function declareCarIdentity(
  input: IdentityDeclaration,
): Promise<DeclarationResult> {
  const empty: DeclarationResult = { ok: false, message: '', changed: {}, revalidate: [] }

  if (!input.reason.trim()) {
    return { ...empty, message: 'A reason is required — this is an audited change.' }
  }

  const car = await prisma.car.findUnique({ where: { id: input.carId } })
  if (!car) return { ...empty, message: `No car with id "${input.carId}".` }

  const data: Record<string, unknown> = {}

  // ── Identity ──────────────────────────────────────────────────────
  for (const key of ['variant', 'trim', 'generation'] as const) {
    if (input[key] === undefined) continue
    const value = input[key]
    data[key] = typeof value === 'string' ? (value.trim() || null) : null
  }

  if (input.modelYear !== undefined) {
    if (input.modelYear !== null) {
      /*
        A sanity range, not a guess. The point is to catch a mistyped 202 or
        20250 — nothing here infers a year, and null stays null.
      */
      if (!Number.isInteger(input.modelYear) || input.modelYear < 1990 || input.modelYear > 2100) {
        return { ...empty, message: `"${input.modelYear}" is not a plausible model year.` }
      }
    }
    data.modelYear = input.modelYear
  }

  for (const key of ['rangeStandard', 'electricRangeStandard'] as const) {
    if (input[key] === undefined) continue
    const value = input[key]
    if (value === null) {
      data[key] = null
      continue
    }
    const cycle = value.trim().toLowerCase()
    /*
      Validated strictly, and NOT passed through toRangeStandard().

      toRangeStandard maps anything unrecognised to 'unspecified', which is right
      when reading a source's free text and wrong here: an operator who types a
      cycle name with a typo should be told, not silently recorded as having said
      "unknown".
    */
    if (!isRangeStandard(cycle)) {
      return {
        ...empty,
        message: `"${value}" is not a known test cycle. Use wltp, epa, cltc, nedc, jc08 or unspecified.`,
      }
    }
    data[key] = cycle
  }

  // ── Model rename ──────────────────────────────────────────────────
  if (input.model !== undefined) {
    const model = input.model.trim()
    if (!model) return { ...empty, message: 'The model cannot be emptied.' }

    /*
      The rename must not create two rows a source cannot tell apart.

      After a split, (brand, model, variant) is what identity compares on, so two
      rows agreeing on all three would be ambiguous forever — and the matcher
      would have no way to choose. Checked here rather than by a unique
      constraint, because a null variant is legitimately shared by many rows
      today and SQL treats each null as distinct anyway.
    */
    const nextVariant = (data.variant ?? car.variant) as string | null
    const clash = await prisma.car.findFirst({
      where: {
        id: { not: car.id },
        brand: car.brand,
        model,
        variant: nextVariant,
      },
      select: { slug: true },
    })
    if (clash) {
      return {
        ...empty,
        message:
          `"${car.brand} ${model}" with variant ${nextVariant === null ? 'null' : `"${nextVariant}"`} ` +
          `would collide with ${clash.slug}. Declare distinct variants first.`,
      }
    }
    data.model = model
  }

  if (input.fullName !== undefined) {
    const fullName = input.fullName.trim()
    if (!fullName) return { ...empty, message: 'The full name cannot be emptied.' }
    data.fullName = fullName
  }

  // ── Figure corrections ────────────────────────────────────────────
  for (const [field, kind] of Object.entries(CORRECTABLE) as [CorrectableField, string][]) {
    const value = input.corrections?.[field]
    if (value === undefined) continue

    if (value === null) {
      data[field] = null
      continue
    }
    if (!Number.isFinite(value)) {
      return { ...empty, message: `${field}: "${value}" is not a number.` }
    }
    if (value < 0) {
      return { ...empty, message: `${field}: a negative figure is not plausible.` }
    }
    data[field] = kind === 'int' ? Math.round(value) : value
  }

  // ── Price display, only as a guarded repair ───────────────────────
  if (input.priceDisplay !== undefined) {
    const display = input.priceDisplay.trim()
    if (!display) return { ...empty, message: 'The price display cannot be emptied.' }

    if (input.expectPriceMin === undefined || input.expectPriceMax === undefined) {
      return {
        ...empty,
        message:
          'Repairing priceDisplay requires expectPriceMin and expectPriceMax, so the string ' +
          'cannot be set to something the stored figures contradict.',
      }
    }
    if (car.priceMin !== input.expectPriceMin || car.priceMax !== input.expectPriceMax) {
      return {
        ...empty,
        message:
          `Refusing to repair priceDisplay: the row holds ${car.priceMin}–${car.priceMax} but ` +
          `${input.expectPriceMin}–${input.expectPriceMax} was expected. The figures themselves ` +
          `need attention first, through the price editor.`,
      }
    }
    data.priceDisplay = display
  }

  // ── What actually moves ───────────────────────────────────────────
  const before = car as unknown as Record<string, unknown>
  const changed: Record<string, [string | null, string | null]> = {}

  for (const [field, value] of Object.entries(data)) {
    const old = render(before[field])
    const next = render(value)
    if (old !== next) changed[field] = [old, next]
  }

  if (Object.keys(changed).length === 0) {
    return {
      ok: true,
      message: 'Nothing to change — the row already reads that way.',
      changed: {},
      revalidate: [],
    }
  }

  /*
    One transaction. Either the row and its whole trail move, or neither does.

    A partial write here would be the worst of both: a catalogue value with no
    record of where it came from, which is precisely the situation this project
    spent a phase escaping.
  */
  await prisma.$transaction(async (tx) => {
    await tx.car.update({ where: { id: car.id }, data })

    await tx.carChangeHistory.createMany({
      data: Object.entries(changed).map(([field, [oldValue, newValue]]) => ({
        id: randomUUID(),
        carId: car.id,
        field,
        oldValue,
        newValue,
        /*
          changeId is null: this is a hand edit, not an applied proposal. The
          schema documents that exact meaning, and keeping it honest is what lets
          somebody later ask "which of these figures came from a source?" and get
          a true answer.
        */
        changeId: null,
        sourceId: input.sourceId ?? null,
        sourceUrl: input.sourceUrl ?? null,
        approvedBy: input.declaredBy,
        reason: input.reason,
      })),
    })
  })

  return {
    ok: true,
    message: `Updated ${Object.keys(changed).length} field(s) on ${car.slug}.`,
    changed,
    /*
      Every surface a car appears on. Narrower than a full-site revalidation and
      wider than the detail page: the card carries the model name, the comparison
      carries the figures, and the home page carries a car rail.
    */
    revalidate: [
      '/cars',
      `/cars/${car.slug}`,
      '/cars/compare',
      '/admin/cars',
      `/admin/cars/${car.slug}`,
      '/',
    ],
  }
}

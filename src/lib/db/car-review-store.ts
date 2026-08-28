// src/lib/db/car-review-store.ts

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'

import {
  assessIdentity,
  identityFromCar,
  identityFromSource,
  isVariantSensitive,
} from '../../../crawler/identity'
import { compareStandards, standardColumnFor, toRangeStandard } from '../../../crawler/range-standard'
import { requiresUnmetAttribution } from '../../data/dataSources'
import { derivePriceDisplay, PRICE_COLUMNS } from '../price-display'

import { prisma } from './client'

/**
 * The review layer's data access, and the one path from a proposal to the
 * catalogue.
 *
 * Without `server-only`, like car-source-store.ts and for the same reason: the
 * crawler is a Node script, where that guard throws on import. The guarded
 * re-export lives in car-review-queries.ts and is what application code uses.
 *
 * ── What may write to Car, and what may not ───────────────────────────
 *
 * Exactly one function here writes to Car: `applyChange`. Everything else reads,
 * or writes to the staging and history tables. That is deliberate and worth
 * keeping true — if a second writer appears, the guarantee that every change to
 * the public catalogue has an approver and a history row is gone.
 */

export const CHANGE_STATUS = ['pending', 'approved', 'rejected', 'superseded'] as const
export type ChangeStatus = (typeof CHANGE_STATUS)[number]

export const RISK_LEVELS = ['safe', 'review', 'high-risk'] as const
export type RiskLevelValue = (typeof RISK_LEVELS)[number]

// ─── Proposals ────────────────────────────────────────────────────────

export interface ProposalInput {
  carId: string
  recordId: string
  sourceId: string
  runId: string
  field: string
  currentValue: string | null
  proposedValue: string | null
  rawValue?: string | null
  unit?: string | null
  changeType: string
  riskLevel: RiskLevelValue
  confidence: number
  confidenceReasons?: string | null
  opinions?: unknown
  validationFlags?: unknown
  sourceUrl: string
  fetchedAt: Date

  /**
   * --- Variant evidence, Phase 4.1 ---------------------------------
   *
   * Optional so existing callers compile, and defaulted below in the direction
   * that requires review rather than permits a write: an absent verdict is
   * stored as `unproven`, and an absent `variantSensitive` as true for any field
   * not known to be model-level.
   *
   * These exist because the review queue that produced the byd-seal mistake
   * showed five competing numbers and labelled them "sources disagree", without
   * ever showing that they described five different trims.
   */
  variantVerdict?: string | null
  identityTier?: string | null
  sourceVariant?: string | null
  sourceModelYear?: number | null
  variantSensitive?: boolean
  currentRangeStandard?: string | null
  proposedRangeStandard?: string | null
}

/**
 * Records one proposed field change.
 *
 * Upserts on (carId, field, sourceId, runId): a run that produces the same
 * proposal twice updates it, while a later run creates a new row so the sequence
 * of what each source claimed over time survives.
 *
 * ── Yesterday's pending proposal is superseded ────────────────────────
 *
 * Writing a proposal marks any *pending* proposal for the same car, field and
 * source from an earlier run as superseded. Without this, three runs of the same
 * command produced three identical pending rows for byd-seal's battery — and on a
 * daily schedule that is a queue growing by a row a day per unreviewed field,
 * which is a queue nobody opens twice.
 *
 * Only pending rows are touched, and only from other runs. Anything already
 * approved or rejected is history and stays exactly as it was.
 */
export async function storeProposal(input: ProposalInput) {
  const data = {
    carId: input.carId,
    recordId: input.recordId,
    sourceId: input.sourceId,
    runId: input.runId,
    field: input.field,
    currentValue: input.currentValue,
    proposedValue: input.proposedValue,
    rawValue: input.rawValue ?? null,
    unit: input.unit ?? null,
    changeType: input.changeType,
    riskLevel: input.riskLevel,
    confidence: input.confidence,
    confidenceReasons: input.confidenceReasons ?? null,
    opinions: input.opinions === undefined ? null : JSON.stringify(input.opinions),
    validationFlags:
      input.validationFlags === undefined ? null : JSON.stringify(input.validationFlags),
    sourceUrl: input.sourceUrl,
    fetchedAt: input.fetchedAt,

    /*
      Variant evidence, defaulted toward review.

      An absent verdict becomes 'unproven' rather than null, and an absent
      `variantSensitive` becomes true. Both defaults point the same way: a caller
      that did not say whether the variant was established has not established it,
      and the field then waits for a person. The alternative default would make
      "we forgot to check" indistinguishable from "we checked and it was fine".
    */
    variantVerdict: input.variantVerdict ?? 'unproven',
    identityTier: input.identityTier ?? null,
    sourceVariant: input.sourceVariant ?? null,
    sourceModelYear: input.sourceModelYear ?? null,
    variantSensitive: input.variantSensitive ?? true,
    currentRangeStandard: input.currentRangeStandard ?? null,
    proposedRangeStandard: input.proposedRangeStandard ?? null,
  }

  await prisma.carFieldChange.updateMany({
    where: {
      carId: input.carId,
      field: input.field,
      sourceId: input.sourceId,
      status: 'pending',
      runId: { not: input.runId },
    },
    data: {
      status: 'superseded',
      reviewNote: `superseded by a newer claim from the same source (run ${input.runId})`,
      reviewedAt: new Date(),
    },
  })

  return prisma.carFieldChange.upsert({
    where: {
      carId_field_sourceId_runId: {
        carId: input.carId,
        field: input.field,
        sourceId: input.sourceId,
        runId: input.runId,
      },
    },
    create: { id: randomUUID(), ...data },
    update: data,
  })
}

export interface ReviewFilters {
  status?: ChangeStatus
  carId?: string
  /**
   * The car's slug, for filtering by the identifier the URL carries.
   *
   * Applied in the query rather than by the caller afterwards. It used to be a
   * `.filter()` on the fetched page, which meant the limit was applied first and
   * the car filter second — so "show me this car's proposals" could return
   * nothing while the car had twenty, simply because the first 200 rows of the
   * queue were about other cars.
   */
  carSlug?: string
  sourceId?: string
  field?: string
  riskLevel?: RiskLevelValue
  changeType?: string
  /** Inclusive floor on confidence. */
  minConfidence?: number
  /** Only rows fetched on or after this date. */
  since?: Date
  limit?: number
}

/** The where-clause every proposal query shares, so a filter cannot mean two things. */
function proposalWhere(filters: ReviewFilters) {
  return {
    status: filters.status ?? 'pending',
    ...(filters.carId ? { carId: filters.carId } : {}),
    ...(filters.carSlug ? { car: { slug: filters.carSlug } } : {}),
    ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
    ...(filters.field ? { field: filters.field } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    ...(filters.changeType ? { changeType: filters.changeType } : {}),
    ...(filters.minConfidence !== undefined ? { confidence: { gte: filters.minConfidence } } : {}),
    ...(filters.since ? { fetchedAt: { gte: filters.since } } : {}),
  }
}

/**
 * Newest decisions first is wrong here; most dangerous first is right.
 *
 * Risk ascending puts `high-risk` last only because the strings sort that way —
 * so it is spelled out: the intent is a stable order in which a reviewer meets
 * the defensible rows of a risk band before its hard ones, and in which the same
 * query returns the same page twice. `id` breaks remaining ties, because a page
 * boundary that moves between requests can show a row twice or skip it entirely.
 */
const PROPOSAL_ORDER = [
  { riskLevel: 'asc' as const },
  { confidence: 'desc' as const },
  { fetchedAt: 'asc' as const },
  { id: 'asc' as const },
]

export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZES = [25, 50, 100] as const

export interface PageRequest {
  /** 1-based. Anything lower is treated as the first page. */
  page?: number
  pageSize?: number
}

export interface ProposalPage<Row> {
  rows: Row[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

/**
 * One page of the review queue, counted and sliced by the database.
 *
 * The queue used to be fetched whole — `take: 200` and every row shipped to the
 * browser, where the component held all of them in state. That is fine at twenty
 * rows and not at two thousand: the page grows without limit, and the operator
 * has no way to work through it in passes.
 *
 * The count is a separate query against the same where-clause, so the totals a
 * reviewer sees always describe the filter they applied.
 */
export async function listProposalPage(
  filters: ReviewFilters & PageRequest = {},
): Promise<ProposalPage<Awaited<ReturnType<typeof listProposals>>[number]>> {
  const where = proposalWhere(filters)
  const pageSize = clampPageSize(filters.pageSize)

  const total = await prisma.carFieldChange.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  /*
    A page number past the end is clamped rather than returning nothing.

    Approving the last rows of page 4 leaves the operator on a page that no
    longer exists, and an empty screen reads as "the queue is done" when it is
    not.
  */
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount)

  const rows = await prisma.carFieldChange.findMany({
    where,
    orderBy: PROPOSAL_ORDER,
    skip: (page - 1) * pageSize,
    take: pageSize,
    /*
      The car's declared variant travels with the row.

      So the review screen can print "the catalogue declares no variant" beside
      "the source says U 87 kWh Design". That single comparison is what the queue
      was missing when five Seal variants were competing for one row.
    */
    include: { car: { select: { slug: true, fullName: true, category: true, variant: true } } },
  })

  return { rows, total, page, pageSize, pageCount }
}

function clampPageSize(requested: number | undefined): number {
  if (!requested || !Number.isFinite(requested)) return DEFAULT_PAGE_SIZE
  // An allow-list, so a hand-typed URL cannot ask for the whole table at once.
  return (PAGE_SIZES as readonly number[]).includes(requested) ? requested : DEFAULT_PAGE_SIZE
}

/** How many proposals match a filter, without fetching any of them. */
export async function countProposals(filters: ReviewFilters = {}): Promise<number> {
  return prisma.carFieldChange.count({ where: proposalWhere(filters) })
}

/**
 * The review queue.
 *
 * Ordered by risk first, then confidence descending: the rows that most need a
 * human are at the top, and within a risk band the most defensible come first so
 * a reviewer builds momentum before hitting the hard ones.
 */
export async function listProposals(filters: ReviewFilters = {}) {
  return prisma.carFieldChange.findMany({
    where: proposalWhere(filters),
    orderBy: PROPOSAL_ORDER,
    take: filters.limit ?? 200,
    include: { car: { select: { slug: true, fullName: true, category: true, variant: true } } },
  })
}

export async function getProposal(id: string) {
  return prisma.carFieldChange.findUnique({
    where: { id },
    include: { car: { select: { slug: true, fullName: true, category: true, variant: true } } },
  })
}

/** Counts for the queue's filter chips, without pulling the rows. */
export async function proposalCounts() {
  const [pending, safe, review, highRisk, conflicting, approved, rejected] = await Promise.all([
    prisma.carFieldChange.count({ where: { status: 'pending' } }),
    prisma.carFieldChange.count({ where: { status: 'pending', riskLevel: 'safe' } }),
    prisma.carFieldChange.count({ where: { status: 'pending', riskLevel: 'review' } }),
    prisma.carFieldChange.count({ where: { status: 'pending', riskLevel: 'high-risk' } }),
    prisma.carFieldChange.count({ where: { status: 'pending', changeType: 'conflicting' } }),
    prisma.carFieldChange.count({ where: { status: 'approved' } }),
    prisma.carFieldChange.count({ where: { status: 'rejected' } }),
  ])
  return { pending, safe, review, highRisk, conflicting, approved, rejected }
}

// ─── Applying an approved change ──────────────────────────────────────

/** Columns a proposal is permitted to write. */
const WRITABLE: Record<string, 'int' | 'float' | 'string' | 'stringOrNull'> = {
  batteryCapacity: 'float',
  range: 'int',
  rangeMax: 'int',
  electricRange: 'int',
  electricRangeMax: 'int',
  power: 'int',
  acceleration: 'float',
  topSpeed: 'int',
  torque: 'int',
  seats: 'int',
  dcCharging: 'float',
  acCharging: 'float',
  engineCapacity: 'int',
  connectors: 'string',
  notes: 'stringOrNull',
  priceMin: 'int',
  priceMax: 'int',
  /*
    `priceDisplay` is deliberately absent.

    It is not a figure a source can publish, it is a sentence about a figure —
    with a unit, a precision and sometimes an "(indicative)" that a person chose.
    Letting it be approved on its own was half of how the three price columns
    drifted apart: the integers could be approved without the string, and the
    string without the integers, and nothing checked that the two agreed.

    It is still written from here, but only ever as a consequence of approving
    `priceMin` or `priceMax`, in the same transaction, derived from the string
    already in the catalogue. See derivePriceDisplay.
  */
}

export interface ApplyResult {
  ok: boolean
  message: string
  /** Pages that should be revalidated, so the caller can be targeted. */
  revalidate?: string[]
}

/**
 * Applies an approved proposal to the catalogue.
 *
 * The only writer to Car in this file, and it refuses more than it accepts:
 *
 *   - the proposal must exist and still be pending
 *   - the field must be on the allow-list above; `slug`, `id`, `brand`, `model`
 *     and `image` are deliberately absent, because a crawler changing what a car
 *     *is* — or its photograph — is a different and more dangerous operation than
 *     correcting a figure
 *   - the value must parse into the column's type
 *   - the source's licence obligations must be met, because this is the moment
 *     the figure becomes something the public reads
 *
 * Every success writes a CarChangeHistory row in the same transaction. A change
 * without a trail is indistinguishable from a change nobody made.
 */
/** A staging row, as much of it as identity needs. */
interface RecordIdentityColumns {
  variant: string | null
  trim: string | null
  modelYear: number | null
  generation: string | null
  externalId: string | null
  normalised: string | null
  raw: string
}

/**
 * The identity a staging row asserts, from its columns and its payload.
 *
 * Columns win where they are set, because they were written by the code that also
 * computed the verdict. The payload fills the rest: brand and model always live
 * there, and so does the variant on any row written before Phase 4.1.
 *
 * An unreadable payload yields an identity with no variant, which the gate then
 * refuses. Failing closed on a corrupt row is correct — the alternative is
 * publishing a figure whose subject could not be determined.
 */
function readSourceIdentity(record: RecordIdentityColumns) {
  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(record.normalised ?? record.raw) as Record<string, unknown>
  } catch {
    payload = {}
  }

  return identityFromSource({
    brand: (payload.brand as string | null) ?? null,
    model: (payload.model as string | null) ?? null,
    variant: record.variant ?? (payload.variant as string | null) ?? null,
    trim: record.trim ?? (payload.trim as string | null) ?? null,
    modelYear: record.modelYear ?? (payload.modelYear as number | null) ?? null,
    generation: record.generation ?? (payload.generation as string | null) ?? null,
    externalId: record.externalId,
  })
}

export interface ApplyOptions {
  /**
   * The licence check to run before publishing. Defaults to the real registry.
   *
   * ── Injected for exactly one reason ─────────────────────────────────
   *
   * The verification suites approve proposals from a fixture source
   * ("verify-fixture") whose id must stay distinct from every real one, because
   * their teardown deletes everything carrying it — pointing a fixture at
   * "openev" would make a test run delete real crawled history. A fixture source
   * has no upstream licensor, so there is nothing to credit and nothing the real
   * check could meaningfully say about it.
   *
   * The default is the strict one, and nothing in src/app passes this. If a
   * server action ever does, that is a bug: the whole point of the check is that
   * the caller does not get to decide whether a licence applies.
   */
  attributionCheck?: (sourceId: string) => string | null
}

export async function applyChange(
  changeId: string,
  approvedBy: string,
  note?: string,
  options: ApplyOptions = {},
): Promise<ApplyResult> {
  const change = await prisma.carFieldChange.findUnique({ where: { id: changeId } })
  if (!change) return { ok: false, message: 'That proposal no longer exists.' }
  if (change.status !== 'pending') {
    return { ok: false, message: `Already ${change.status}.` }
  }

  const kind = WRITABLE[change.field]
  if (!kind) {
    return {
      ok: false,
      message: `${change.field} cannot be written from crawled data. Identity fields and the photograph are changed by hand in the car editor.`,
    }
  }

  /*
    ── Licence, checked at the point of publication ──────────────────

    Not at crawl time, and not at review time: at approval, because approval is
    the only step that makes a figure public. A source may be read, staged and
    reviewed while its credit is outstanding — nothing is being distributed. The
    instant one of its numbers lands on a car page, the licence's attribution
    clause is live.

    Open EV Data requires visible credit. That obligation was written down in
    Phase 2, restated in two reports, and went unmet for two phases because
    nothing in the code depended on it. Now something does.
  */
  const unmet = (options.attributionCheck ?? requiresUnmetAttribution)(change.sourceId)
  if (unmet) {
    return {
      ok: false,
      message:
        `Not applied — ${unmet} ` +
        `The proposal stays pending and nothing on the public site changed.`,
    }
  }

  const car = await prisma.car.findUnique({ where: { id: change.carId } })
  if (!car) return { ok: false, message: 'That car no longer exists.' }

  /*
    ── Variant identity, re-checked here rather than trusted ───────────

    THE PHASE 4.1 GATE. A variant-level figure is refused unless the variant is
    proven, and "proven" is recomputed now, against the catalogue row as it stands
    and the identity the source record carries.

    Re-evaluated rather than read off `change.variantVerdict` for two reasons, and
    the second is the important one:

      the stored verdict is a snapshot from crawl time, and the catalogue row may
      have gained a variant since;

      and re-checking is what makes the fix actionable. An operator who declares
      "Seal" to be variant "61.4 kWh RWD Comfort" in the car editor has answered
      the question, and the proposal that was blocked a minute ago becomes
      approvable with no re-crawl. If this trusted the stored value, declaring the
      variant would change nothing until the next run.

    Why this is a refusal and not merely a risk label: the policy layer already
    grades these `high-risk` and excludes them from bulk approval, and that was
    not enough. On 2026-08-27 five proposals graded `review` and `high-risk` were
    approved individually through the UI, and a 87 kWh figure from
    "U 87 kWh Design" overwrote the 61.44 kWh the catalogue held for the Seal. A
    label advises; this refuses.

    Model-level fields are untouched by this. The same crawl's `acCharging` 11 kW
    was correct — every Seal variant charges at 11 kW AC — and `connectors` was a
    harmless reordering. Neither is blocked.
  */
  if (isVariantSensitive(change.field)) {
    const record = await prisma.carSourceRecord.findUnique({
      where: { id: change.recordId },
      select: {
        variant: true,
        trim: true,
        modelYear: true,
        generation: true,
        externalId: true,
        normalised: true,
        raw: true,
      },
    })

    /*
      Identity, read from the columns where they exist and the payload otherwise.

      CarSourceRecord holds no brand or model columns — those have always lived in
      the payload, and there is no reason to duplicate them. The variant columns
      were added in Phase 4.1, so rows written before it have them null while
      their payload has carried the variant all along. Reading both means the gate
      works on historical rows, which is what matters here: those are exactly the
      rows sitting in the queue right now.
    */
    const sourceIdentity = record ? readSourceIdentity(record) : null

    if (!sourceIdentity) {
      return {
        ok: false,
        message:
          `Not applied — ${change.field} is a variant-level figure and the source record behind it ` +
          `is no longer available, so which variant it described cannot be established. ` +
          `The proposal stays pending and nothing on the public site changed.`,
      }
    }

    /*
      Sibling rows sharing this brand and model, so a model-only record is
      recognised as ambiguous rather than assigned to whichever row was matched.
    */
    const siblings = await prisma.car.findMany({
      where: { brand: car.brand, model: car.model, id: { not: car.id } },
      select: { slug: true, brand: true, model: true, variant: true, trim: true, modelYear: true, generation: true },
    })

    const identity = assessIdentity({
      source: sourceIdentity,
      car: identityFromCar(car),
      siblings: siblings.map(identityFromCar),
    })

    if (identity.blocksVariantSensitive) {
      /*
        The advice depends on the verdict, because the remedies are opposites.

        An unproven or ambiguous variant is a gap: declaring the trim on the
        catalogue row settles it, and the same proposal then applies with no
        re-crawl. A mismatch is not a gap — both sides named a trim and the trims
        differ — so the remedy is to reject the proposal, and telling somebody to
        set a variant they have already set would send them in a circle.
      */
      const remedy =
        identity.verdict === 'mismatch'
          ? `This record describes a different trim, so it should be rejected rather than applied. ` +
            `If the catalogue row's variant is what is wrong, correct that first.`
          : `Set this car's variant in the editor if you can confirm which trim it is, then approve again.`

      return {
        ok: false,
        message:
          `Not applied — ${change.field} depends on which variant this is, and ${identity.reason}. ` +
          `The catalogue row is ${car.variant === null ? 'declared as no particular variant' : `"${car.variant}"`}; ` +
          `the source described ${sourceIdentity.variant === null ? 'no particular variant' : `"${sourceIdentity.variant}"`}. ` +
          remedy +
          ` Nothing on the public site changed.`,
      }
    }

    /*
      A range whose test cycle cannot be compared is refused for the same reason.

      425 km unspecified replacing 650 km CLTC is not a smaller number; it is a
      different measurement. This is the second half of what went wrong on the
      Seal, and it survives a proven variant — two figures for the same trim on
      different cycles are still not interchangeable.
    */
    const standardColumn = standardColumnFor(change.field)
    if (standardColumn) {
      const comparability = compareStandards(
        toRangeStandard((car as unknown as Record<string, string | null>)[standardColumn]),
        toRangeStandard(change.proposedRangeStandard),
      )
      if (!comparability.comparable) {
        return {
          ok: false,
          message:
            `Not applied — ${comparability.reason}. Record the test cycle for this car's ` +
            `${standardColumn === 'rangeStandard' ? 'range' : 'electric range'} in the editor, or reject this proposal. ` +
            `Nothing on the public site changed.`,
        }
      }
    }
  }

  // ── Parse into the column's type ──────────────────────────────────
  const text = change.proposedValue
  let value: number | string | null

  if (kind === 'int' || kind === 'float') {
    if (text === null || text.trim() === '') {
      return { ok: false, message: 'Refusing to clear a numeric field from a proposal.' }
    }
    const parsed = Number(text)
    if (!Number.isFinite(parsed)) {
      return { ok: false, message: `"${text}" is not a number.` }
    }
    value = kind === 'int' ? Math.round(parsed) : parsed
  } else if (kind === 'stringOrNull') {
    value = text === null || text.trim() === '' ? null : text
  } else {
    if (text === null || text.trim() === '') {
      return { ok: false, message: 'Refusing to write an empty string to a required column.' }
    }
    value = text
  }

  const oldValue = (car as unknown as Record<string, unknown>)[change.field]

  /*
    ── A price is three columns, and they move together ──────────────

    priceMin and priceMax are what filters sort on; priceDisplay is what every
    card and page actually shows. Approving one integer used to write that integer
    and nothing else, which left the catalogue internally contradictory — a car
    stored at one price and displayed at another, with the displayed one being the
    one anybody reads.

    So an approved price carries its display string with it, in the same
    transaction, or it is not applied at all. The string is derived from the
    string already there — keeping its unit, its precision and its "(indicative)"
    — and when it cannot be derived safely, this refuses and the proposal stays
    pending for a person. Refusing to publish beats publishing half a change.
  */
  let derivedDisplay: string | null = null

  if (PRICE_COLUMNS.has(change.field)) {
    const nextMin = change.field === 'priceMin' ? (value as number) : car.priceMin
    const nextMax = change.field === 'priceMax' ? (value as number) : car.priceMax

    const derived = derivePriceDisplay({
      currentDisplay: car.priceDisplay,
      currentMin: car.priceMin,
      currentMax: car.priceMax,
      nextMin,
      nextMax,
    })

    if (!derived.ok) {
      return {
        ok: false,
        message: `Not applied — ${derived.reason} The proposal is still pending, and nothing on the public site changed.`,
      }
    }

    // Only written when it actually differs, so a no-op does not fabricate history.
    derivedDisplay = derived.changed ? derived.display : null
  }

  const now = new Date()

  /*
    One transaction for every write.

    A Car updated without its history row, or a proposal marked approved without
    the Car changing, are both worse than a failure — the first loses the audit
    trail, the second tells an operator the change landed when it did not. The
    derived price string is inside the same transaction for the same reason: a
    committed integer beside an uncommitted string is the exact inconsistency
    this is here to prevent.
  */
  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.car.update({
      where: { id: change.carId },
      data: {
        [change.field]: value,
        ...(derivedDisplay === null ? {} : { priceDisplay: derivedDisplay }),
      },
    }),
    prisma.carChangeHistory.create({
      data: {
        id: randomUUID(),
        carId: change.carId,
        field: change.field,
        oldValue: oldValue === null || oldValue === undefined ? null : String(oldValue),
        newValue: change.proposedValue,
        sourceId: change.sourceId,
        sourceUrl: change.sourceUrl,
        changeId: change.id,
        approvedBy,
        reason: note ?? change.confidenceReasons,
      },
    }),
  ]

  /*
    The derived string gets its own history row.

    It is a change to a column somebody could otherwise find no record of, and
    "why does this car show this price?" has to be answerable about the string as
    well as the number. The reason names the approval that caused it rather than
    claiming a source published it, because none did.
  */
  if (derivedDisplay !== null) {
    writes.push(
      prisma.carChangeHistory.create({
        data: {
          id: randomUUID(),
          carId: change.carId,
          field: 'priceDisplay',
          oldValue: car.priceDisplay,
          newValue: derivedDisplay,
          sourceId: change.sourceId,
          sourceUrl: change.sourceUrl,
          changeId: change.id,
          approvedBy,
          reason: `derived from the approved ${change.field}, keeping the catalogue's own wording`,
        },
      }),
    )
  }

  writes.push(
    prisma.carFieldChange.update({
      where: { id: change.id },
      data: { status: 'approved', reviewedAt: now, reviewedBy: approvedBy, reviewNote: note ?? null },
    }),
    /*
      Other pending proposals for the same car and field become superseded.

      Without this, approving one source's battery figure leaves a rival
      proposal in the queue that would, if also approved, silently undo the
      decision just taken.

      A price approval also supersedes any pending priceDisplay proposal: the
      string has just been rewritten from the new figures, so an older claim
      about it can only put the two back out of step.
    */
    prisma.carFieldChange.updateMany({
      where: {
        carId: change.carId,
        status: 'pending',
        id: { not: change.id },
        field: derivedDisplay === null ? change.field : { in: [change.field, 'priceDisplay'] },
      },
      data: { status: 'superseded', reviewedAt: now, reviewNote: `superseded by ${change.id}` },
    }),
  )

  await prisma.$transaction(writes)

  /*
    Targeted revalidation.

    Only the pages that actually render this car, plus the two that aggregate
    every car. Revalidating the whole site per field would mean a run of two
    hundred approvals rebuilding everything two hundred times.
  */
  return {
    ok: true,
    message:
      `${change.field} updated on ${car.fullName}.` +
      (derivedDisplay === null ? '' : ` Displayed price is now "${derivedDisplay}".`),
    revalidate: [`/cars/${car.slug}`, '/cars', '/cars/compare'],
  }
}

/**
 * Whether a proposal may be approved as part of a batch.
 *
 * The policy layer decides this per field when the proposal is built, but that
 * verdict is not a stored column — so this re-derives it from what *is* stored,
 * and it is the one definition both the server and the queue UI use. Two
 * definitions would drift, and the one that drifted would be whichever the
 * server did not consult.
 *
 * Price fields are excluded even at `review` risk. A price is the figure a buyer
 * acts on, and it now carries the displayed string with it — neither is a thing
 * to change forty at a time because they happened to be ticked together.
 */
export function bulkEligible(change: {
  riskLevel: string
  changeType: string
  field: string
}): { ok: boolean; reason: string } {
  if (change.riskLevel === 'high-risk') {
    return { ok: false, reason: 'high risk — must be reviewed individually' }
  }
  if (change.changeType === 'conflicting') {
    return { ok: false, reason: 'sources conflict — must be resolved individually' }
  }
  if (PRICE_COLUMNS.has(change.field) || change.field === 'priceDisplay') {
    return { ok: false, reason: 'a price change is never applied in bulk' }
  }
  return { ok: true, reason: '' }
}

export async function rejectChange(changeId: string, reviewedBy: string, note?: string) {
  return prisma.carFieldChange.update({
    where: { id: changeId },
    data: { status: 'rejected', reviewedAt: new Date(), reviewedBy, reviewNote: note ?? null },
  })
}

/**
 * Applies several proposals, one at a time, collecting outcomes.
 *
 * Sequential rather than batched, and it refuses anything the policy marked
 * `excludeFromBulk`. Bulk approval exists to clear a queue of small, uncontested
 * corrections — it must not become a way to wave through a price change or a
 * conflict because it happened to be selected alongside forty safe rows.
 */
export async function applyMany(
  changeIds: string[],
  approvedBy: string,
  options: ApplyOptions = {},
): Promise<{ applied: string[]; refused: { id: string; reason: string }[]; revalidate: string[] }> {
  const applied: string[] = []
  const refused: { id: string; reason: string }[] = []
  const revalidate = new Set<string>()

  for (const id of changeIds) {
    const change = await prisma.carFieldChange.findUnique({ where: { id } })
    if (!change) {
      refused.push({ id, reason: 'no longer exists' })
      continue
    }

    const eligible = bulkEligible(change)
    if (!eligible.ok) {
      refused.push({ id, reason: eligible.reason })
      continue
    }

    const result = await applyChange(id, approvedBy, 'approved in bulk', options)
    if (result.ok) {
      applied.push(id)
      for (const path of result.revalidate ?? []) revalidate.add(path)
    } else {
      refused.push({ id, reason: result.message })
    }
  }

  return { applied, refused, revalidate: [...revalidate] }
}

// ─── History ──────────────────────────────────────────────────────────

/** Why does this car show this figure? Newest first. */
export async function listHistory(carId: string, limit = 100) {
  return prisma.carChangeHistory.findMany({
    where: { carId },
    orderBy: { approvedAt: 'desc' },
    take: limit,
  })
}

export async function listFieldHistory(carId: string, field: string) {
  return prisma.carChangeHistory.findMany({
    where: { carId, field },
    orderBy: { approvedAt: 'desc' },
  })
}

// ─── Price history ────────────────────────────────────────────────────

export interface PricePointInput {
  carId: string
  price: number
  currency?: string
  market?: string
  priceType?: string
  sourceId?: string | null
  sourceUrl?: string | null
  fetchedAt: Date
  effectiveDate?: Date | null
  confidence?: number
  note?: string | null
}

/**
 * Records a price as at a moment.
 *
 * Append-only by design: there is no update and no delete. A price that changed
 * is not a correction, it is history, and the whole point of this table is being
 * able to answer "what did this cost in March?".
 *
 * The only de-duplication is exact: the same price, from the same source, on the
 * same day is not recorded twice, because a re-crawl finding no change is not a
 * price event.
 */
export async function recordPrice(input: PricePointInput) {
  const dayStart = new Date(input.fetchedAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const existing = await prisma.carPriceHistory.findFirst({
    where: {
      carId: input.carId,
      price: input.price,
      currency: input.currency ?? 'PKR',
      market: input.market ?? 'PK',
      sourceId: input.sourceId ?? null,
      fetchedAt: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  })
  if (existing) return existing

  return prisma.carPriceHistory.create({
    data: {
      id: randomUUID(),
      carId: input.carId,
      price: input.price,
      currency: input.currency ?? 'PKR',
      market: input.market ?? 'PK',
      priceType: input.priceType ?? 'indicative',
      sourceId: input.sourceId ?? null,
      sourceUrl: input.sourceUrl ?? null,
      fetchedAt: input.fetchedAt,
      effectiveDate: input.effectiveDate ?? null,
      confidence: input.confidence ?? 0,
      note: input.note ?? null,
    },
  })
}

export async function listPriceHistory(carId: string, market = 'PK') {
  return prisma.carPriceHistory.findMany({
    where: { carId, market },
    orderBy: { fetchedAt: 'asc' },
  })
}

// ─── Image candidates ─────────────────────────────────────────────────

export interface ImageCandidateInput {
  carId: string
  imageUrl: string
  sourceUrl: string
  sourceId?: string | null
  licence?: string | null
  licenceUrl?: string | null
  attribution?: string | null
  fetchedAt: Date
}

/**
 * Records an image a source published, without fetching it.
 *
 * Discovery stores a URL and a licence. Nothing downloads the file, nothing
 * writes to public/images/cars, and nothing changes Car.image — that directory
 * holds Commons files whose attribution lives in src/data/carImageCredits.ts,
 * and a crawler writing there would both break that credit and put uncredited
 * third-party work on a commercial site.
 */
export async function recordImageCandidate(input: ImageCandidateInput) {
  return prisma.carImageCandidate.upsert({
    where: { carId_imageUrl: { carId: input.carId, imageUrl: input.imageUrl } },
    create: {
      id: randomUUID(),
      carId: input.carId,
      imageUrl: input.imageUrl,
      sourceUrl: input.sourceUrl,
      sourceId: input.sourceId ?? null,
      licence: input.licence ?? null,
      licenceUrl: input.licenceUrl ?? null,
      attribution: input.attribution ?? null,
      fetchedAt: input.fetchedAt,
    },
    update: {
      licence: input.licence ?? null,
      licenceUrl: input.licenceUrl ?? null,
      attribution: input.attribution ?? null,
      fetchedAt: input.fetchedAt,
    },
  })
}

export async function listImageCandidates(status = 'pending', limit = 100) {
  return prisma.carImageCandidate.findMany({
    where: { status },
    orderBy: { fetchedAt: 'desc' },
    take: limit,
    include: { car: { select: { slug: true, fullName: true, image: true } } },
  })
}

/**
 * Marks an image candidate reviewed.
 *
 * Approval does NOT publish it. Car.image is untouched here: a person still has
 * to place the file under a licence-compatible path, and refusing an image with
 * no recorded licence is the default rather than a judgement call.
 */
export async function reviewImageCandidate(
  id: string,
  status: 'approved' | 'rejected',
  note?: string,
) {
  const candidate = await prisma.carImageCandidate.findUnique({ where: { id } })
  if (!candidate) return { ok: false, message: 'That candidate no longer exists.' }

  if (status === 'approved' && !candidate.licence) {
    return {
      ok: false,
      message:
        'This image has no recorded licence, so it cannot be approved. Find the licence, or reject it.',
    }
  }

  await prisma.carImageCandidate.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewNote: note ?? null },
  })

  return {
    ok: true,
    message:
      status === 'approved'
        ? 'Marked approved. The file still has to be placed by hand — nothing was published.'
        : 'Rejected.',
  }
}

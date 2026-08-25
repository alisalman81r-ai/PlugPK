// src/lib/db/car-review-store.ts

import { randomUUID } from 'node:crypto'

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

/**
 * The review queue.
 *
 * Ordered by risk first, then confidence descending: the rows that most need a
 * human are at the top, and within a risk band the most defensible come first so
 * a reviewer builds momentum before hitting the hard ones.
 */
export async function listProposals(filters: ReviewFilters = {}) {
  return prisma.carFieldChange.findMany({
    where: {
      status: filters.status ?? 'pending',
      ...(filters.carId ? { carId: filters.carId } : {}),
      ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
      ...(filters.field ? { field: filters.field } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
      ...(filters.changeType ? { changeType: filters.changeType } : {}),
      ...(filters.minConfidence !== undefined
        ? { confidence: { gte: filters.minConfidence } }
        : {}),
      ...(filters.since ? { fetchedAt: { gte: filters.since } } : {}),
    },
    orderBy: [{ riskLevel: 'asc' }, { confidence: 'desc' }, { fetchedAt: 'asc' }],
    take: filters.limit ?? 200,
    include: { car: { select: { slug: true, fullName: true, category: true } } },
  })
}

export async function getProposal(id: string) {
  return prisma.carFieldChange.findUnique({
    where: { id },
    include: { car: { select: { slug: true, fullName: true, category: true } } },
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
  priceDisplay: 'string',
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
 *
 * Every success writes a CarChangeHistory row in the same transaction. A change
 * without a trail is indistinguishable from a change nobody made.
 */
export async function applyChange(
  changeId: string,
  approvedBy: string,
  note?: string,
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

  const car = await prisma.car.findUnique({ where: { id: change.carId } })
  if (!car) return { ok: false, message: 'That car no longer exists.' }

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
    One transaction for all three writes.

    A Car updated without its history row, or a proposal marked approved without
    the Car changing, are both worse than a failure — the first loses the audit
    trail, the second tells an operator the change landed when it did not.
  */
  await prisma.$transaction([
    prisma.car.update({ where: { id: change.carId }, data: { [change.field]: value } }),
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
    prisma.carFieldChange.update({
      where: { id: change.id },
      data: { status: 'approved', reviewedAt: new Date(), reviewedBy: approvedBy, reviewNote: note ?? null },
    }),
    /*
      Other pending proposals for the same car and field become superseded.

      Without this, approving one source's battery figure leaves a rival
      proposal in the queue that would, if also approved, silently undo the
      decision just taken.
    */
    prisma.carFieldChange.updateMany({
      where: { carId: change.carId, field: change.field, status: 'pending', id: { not: change.id } },
      data: { status: 'superseded', reviewedAt: new Date(), reviewNote: `superseded by ${change.id}` },
    }),
  ])

  /*
    Targeted revalidation.

    Only the pages that actually render this car, plus the two that aggregate
    every car. Revalidating the whole site per field would mean a run of two
    hundred approvals rebuilding everything two hundred times.
  */
  return {
    ok: true,
    message: `${change.field} updated on ${car.fullName}.`,
    revalidate: [`/cars/${car.slug}`, '/cars', '/cars/compare'],
  }
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
    if (change.riskLevel === 'high-risk') {
      refused.push({ id, reason: 'high risk — must be reviewed individually' })
      continue
    }
    if (change.changeType === 'conflicting') {
      refused.push({ id, reason: 'sources conflict — must be resolved individually' })
      continue
    }

    const result = await applyChange(id, approvedBy, 'approved in bulk')
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

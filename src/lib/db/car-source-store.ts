// src/lib/db/car-source-store.ts
import { createHash, randomUUID } from 'node:crypto'

import { prisma } from './client'

/**
 * The staging layer's data access — the implementation.
 *
 * Deliberately WITHOUT `server-only`, so the crawler can use it. The crawler is
 * a Node script, not a React Server Component, and `server-only` throws the
 * moment such a script imports it — which is correct behaviour for an app module
 * and useless for a CLI one.
 *
 * The guard still exists: car-source-queries.ts re-exports every function here
 * behind `import 'server-only'`, and that is what application code imports. So a
 * component that tried to pull this into a client bundle still fails, while
 * `npm run crawl:source` works, and there is one implementation rather than two
 * that can drift.
 *
 * Everything the crawler stores goes through here, and nothing here writes to
 * `Car`. That is the boundary the whole design rests on: a crawled figure is
 * evidence, not a fact, and the only path from evidence to catalogue runs
 * through a human and the existing validated write path in car-actions.ts.
 *
 * If a function in this file ever calls `prisma.car.update`, the separation has
 * been lost.
 */

/** Allowed values for the string columns, kept here so callers cannot drift. */
export const EXTRACTION_STATUS = ['ok', 'partial', 'failed'] as const
export const REVIEW_STATUS = ['pending', 'approved', 'rejected', 'superseded', 'duplicate'] as const
export const ROBOTS_STATUS = ['unchecked', 'allowed', 'disallowed', 'unreachable'] as const

export type ExtractionStatus = (typeof EXTRACTION_STATUS)[number]
export type ReviewStatus = (typeof REVIEW_STATUS)[number]
export type RobotsStatusValue = (typeof ROBOTS_STATUS)[number]

// ─── Sources ──────────────────────────────────────────────────────────

export interface SourceInput {
  id: string
  name: string
  baseUrl: string
  trustRank?: number
  crawlIntervalMinutes?: number
  requestDelayMs?: number
  isEnabled?: boolean
}

/**
 * Registers a source, or updates its settings.
 *
 * `isEnabled` defaults to false on create and is left alone on update unless
 * explicitly passed. Turning a source on is a decision about somebody else's
 * terms of service, and it should never be a side effect of editing a name.
 */
export async function upsertSource(input: SourceInput) {
  const settings = {
    name: input.name,
    baseUrl: input.baseUrl,
    ...(input.trustRank !== undefined ? { trustRank: input.trustRank } : {}),
    ...(input.crawlIntervalMinutes !== undefined
      ? { crawlIntervalMinutes: input.crawlIntervalMinutes }
      : {}),
    ...(input.requestDelayMs !== undefined ? { requestDelayMs: input.requestDelayMs } : {}),
    ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
  }

  return prisma.carSource.upsert({
    where: { id: input.id },
    create: { id: input.id, isEnabled: false, ...settings },
    update: settings,
  })
}

export async function listSources() {
  return prisma.carSource.findMany({ orderBy: [{ trustRank: 'desc' }, { name: 'asc' }] })
}

export async function getSource(id: string) {
  return prisma.carSource.findUnique({ where: { id } })
}

/**
 * Records what robots.txt said.
 *
 * Stored rather than only checked, so a refusal can be justified months later
 * and so the crawler can be stopped by policy without re-fetching.
 */
export async function recordRobotsCheck(
  sourceId: string,
  status: RobotsStatusValue,
  note: string | null,
) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { robotsStatus: status, robotsCheckedAt: new Date(), robotsNote: note },
  })
}

/**
 * Sources a crawl may actually visit.
 *
 * Two conditions, both required: switched on, and last told by robots.txt that
 * crawling is allowed. A source whose robots status is 'unchecked' is not
 * eligible — the check is a precondition, not a formality.
 */
export async function listCrawlableSources() {
  return prisma.carSource.findMany({
    where: { isEnabled: true, robotsStatus: 'allowed' },
    orderBy: { trustRank: 'desc' },
  })
}

export async function markSourceCrawled(sourceId: string) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { lastCrawledAt: new Date() },
  })
}

// ─── Records ──────────────────────────────────────────────────────────

export interface RecordInput {
  sourceId: string
  sourceUrl: string
  externalId?: string | null
  runId: string
  fetchedAt?: Date
  httpStatus?: number | null
  /** Serialised by the caller; this layer does not decide the shape. */
  raw: unknown
  normalised?: unknown
  extractionStatus?: ExtractionStatus
  fieldsFound?: number
  fieldsExpected?: number
  confidence?: number
  matchedCarId?: string | null
  matchStrategy?: string | null
  matchScore?: number | null
  matchCandidates?: unknown
  errorMessage?: string | null
  errorFields?: string[] | null
}

/** Stable hash of the raw payload, so an unchanged re-crawl is recognisable. */
export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload ?? null)).digest('hex').slice(0, 32)
}

/**
 * Stores one crawled page.
 *
 * Upserts on (sourceId, sourceUrl, runId): a run that visits the same URL twice
 * updates rather than duplicating, while a later run inserts a new row and the
 * history survives. That is why the run id is part of the key.
 *
 * `matchedCarId` is only ever a proposal here. Writing it does not change the
 * car, and nothing downstream may treat it as approval.
 */
export async function storeRecord(input: RecordInput) {
  const raw = JSON.stringify(input.raw ?? null)
  const data = {
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    externalId: input.externalId ?? null,
    runId: input.runId,
    fetchedAt: input.fetchedAt ?? new Date(),
    httpStatus: input.httpStatus ?? null,
    raw,
    normalised: input.normalised === undefined ? null : JSON.stringify(input.normalised),
    contentHash: hashPayload(input.raw),
    extractionStatus: input.extractionStatus ?? 'ok',
    fieldsFound: input.fieldsFound ?? 0,
    fieldsExpected: input.fieldsExpected ?? 0,
    confidence: input.confidence ?? 0,
    matchedCarId: input.matchedCarId ?? null,
    matchStrategy: input.matchStrategy ?? null,
    matchScore: input.matchScore ?? null,
    matchCandidates:
      input.matchCandidates === undefined ? null : JSON.stringify(input.matchCandidates),
    errorMessage: input.errorMessage ?? null,
    errorFields: input.errorFields ? JSON.stringify(input.errorFields) : null,
  }

  return prisma.carSourceRecord.upsert({
    where: {
      sourceId_sourceUrl_runId: {
        sourceId: input.sourceId,
        sourceUrl: input.sourceUrl,
        runId: input.runId,
      },
    },
    create: { id: randomUUID(), ...data },
    update: data,
  })
}

export async function getRecord(id: string) {
  return prisma.carSourceRecord.findUnique({ where: { id }, include: { source: true } })
}

export async function listRecordsForRun(runId: string) {
  return prisma.carSourceRecord.findMany({
    where: { runId },
    orderBy: { fetchedAt: 'asc' },
    include: { source: true },
  })
}

/** The review queue: what a person still has to look at, oldest first. */
export async function listPendingReview(limit = 100) {
  return prisma.carSourceRecord.findMany({
    where: { reviewStatus: 'pending' },
    orderBy: [{ confidence: 'desc' }, { fetchedAt: 'asc' }],
    take: limit,
    include: { source: true },
  })
}

/**
 * Every source's view of one car, newest first.
 *
 * This is what makes disagreement visible: two sources quoting different prices
 * both appear, with their trust ranks, instead of one silently overwriting the
 * other.
 */
export async function listRecordsForCar(carId: string, limit = 50) {
  return prisma.carSourceRecord.findMany({
    where: { matchedCarId: carId },
    orderBy: { fetchedAt: 'desc' },
    take: limit,
    include: { source: true },
  })
}

/** Records that matched nothing — candidates for cars the catalogue lacks. */
export async function listUnmatched(limit = 100) {
  return prisma.carSourceRecord.findMany({
    where: { matchedCarId: null, reviewStatus: 'pending' },
    orderBy: { fetchedAt: 'desc' },
    take: limit,
    include: { source: true },
  })
}

/**
 * Records the outcome of a review.
 *
 * Deliberately does not apply anything. Marking a record approved says a person
 * agreed with it; writing it to the catalogue is a separate action, through
 * car-actions.ts, with its own validation and its own admin check. Keeping the
 * two apart means a mis-click here cannot change the public site.
 */
export async function setReviewStatus(id: string, status: ReviewStatus, note?: string | null) {
  return prisma.carSourceRecord.update({
    where: { id },
    data: { reviewStatus: status, reviewedAt: new Date(), reviewNote: note ?? null },
  })
}

/** Attaches or clears a proposed match. Still only a proposal. */
export async function setProposedMatch(
  id: string,
  carId: string | null,
  strategy: string | null,
  score: number | null,
) {
  return prisma.carSourceRecord.update({
    where: { id },
    data: { matchedCarId: carId, matchStrategy: strategy, matchScore: score },
  })
}

/** Whether this exact payload has been seen before, at any time, anywhere. */
export async function hasSeenPayload(sourceId: string, payload: unknown): Promise<boolean> {
  const found = await prisma.carSourceRecord.findFirst({
    where: { sourceId, contentHash: hashPayload(payload) },
    select: { id: true },
  })
  return found !== null
}

/** Counts for a dashboard, without pulling every row to compute them. */
export async function getStagingStats() {
  const [total, pending, matched, unmatched, sources, runs] = await Promise.all([
    prisma.carSourceRecord.count(),
    prisma.carSourceRecord.count({ where: { reviewStatus: 'pending' } }),
    prisma.carSourceRecord.count({ where: { matchedCarId: { not: null } } }),
    prisma.carSourceRecord.count({ where: { matchedCarId: null } }),
    prisma.carSource.count(),
    prisma.carSourceRecord.findMany({ distinct: ['runId'], select: { runId: true } }),
  ])

  return { total, pending, matched, unmatched, sources, runs: runs.length }
}

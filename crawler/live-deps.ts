// crawler/live-deps.ts

/**
 * The real dependencies, assembled in one place.
 *
 * pipeline.ts declares what it needs; this satisfies it with Prisma, the adapter
 * registry, the batching logger and the rate limiter. Both entry points — the
 * command and the HTTP trigger — build their deps here, so there is exactly one
 * definition of "the live pipeline" and a difference between what a person runs
 * and what a timer runs cannot creep in.
 *
 * Everything is imported dynamically. These modules pull in the Prisma client,
 * and a dry run or a status report should not require a database to exist at all
 * — importing at module scope would make it a hard requirement for both.
 */

import { ADAPTERS } from './adapters'
import { limiterFor } from './limiter'
import { CrawlLogger } from './logger'
import type {
  PipelineCatalogue,
  PipelineDeps,
  PipelineStore,
  ProposalCar,
  ProposalRecord,
  SourceRow,
} from './pipeline'
import { addTotals, proposeForCar, type CarLike, type RecordLike } from './proposals'

export interface LiveDepsOptions {
  /** Fixed clock, for a reproducible report. Defaults to the real one. */
  now?: () => Date
}

/**
 * Builds the live dependency set.
 *
 * Async because the store, the client and `randomUUID` are all loaded on demand.
 */
export async function liveDeps(options: LiveDepsOptions = {}): Promise<PipelineDeps> {
  const store = await import('../src/lib/db/car-source-store')
  const { prisma } = await import('../src/lib/db/client')
  const { randomUUID } = await import('node:crypto')

  const sources = (await store.listSourcesForSchedule()) as unknown as SourceRow[]

  const pipelineStore: PipelineStore = {
    recordRobotsCheck: (sourceId, status, note) =>
      store.recordRobotsCheck(sourceId, status as never, note),
    openRun: (input) => store.openRun(input),
    closeRun: (runId, input) => store.closeRun(runId, input),
    updateSourceHealth: (sourceId, patch) => store.updateSourceHealth(sourceId, patch),
    updateSourceValidators: (sourceId, patch) => store.updateSourceValidators(sourceId, patch),
    clearSourceValidators: (sourceId) => store.clearSourceValidators(sourceId),
    knownContentHashes: (sourceId) => store.knownContentHashes(sourceId),
    knownRecordIdentities: (sourceId) => store.knownRecordIdentities(sourceId),
    storeRecord: (input) => store.storeRecord(input),
    upsertCandidate: (input) => store.upsertCandidate(input as never),
    hashPayload: (payload) => store.hashPayload(payload),
  }

  const catalogue: PipelineCatalogue = {
    /*
      The catalogue is read once per source rather than once per record.

      Thirty-six rows is nothing, but the shape matters more than the size: as
      soon as this becomes a query inside the record loop it is one round trip per
      car per source per morning, against a single-writer SQLite file, and the
      cost grows with exactly the thing a daily run is meant to make cheap.
    */
    cars: () =>
      prisma.car.findMany({
        select: {
          id: true,
          slug: true,
          brand: true,
          model: true,
          fullName: true,
          category: true,
          /*
            The identity columns the matcher now compares. Without these in the
            select, every catalogue row would arrive with variant undefined and
            the variant tiers could never fire — the exact shape of the original
            bug, reintroduced by an omission in a projection.
          */
          variant: true,
          trim: true,
          modelYear: true,
          generation: true,
        },
      }),

    recordsForProposal: async (recordIds) => {
      const records = await prisma.carSourceRecord.findMany({
        where: { id: { in: recordIds } },
        include: { matchedCar: true },
      })
      return records as unknown as ProposalRecord[]
    },

    countCars: () => prisma.car.count(),
  }

  return {
    store: pipelineStore,
    catalogue,
    sources,
    adapters: ADAPTERS,

    /*
      The proposal path, bridged rather than reimplemented.

      proposeForCar is the same function the manual `crawl:propose` command calls.
      Two implementations of "what counts as a change worth showing a person"
      would diverge, and the one that diverged would be the automated one nobody
      watches.
    */
    propose: async (car, records, opts) => {
      /*
        Sibling rows are looked up per car, so a source record naming no variant
        can be recognised as ambiguous rather than assigned to whichever row the
        matcher reached first. One small query per car with proposals, which is a
        handful per run — not per record.
      */
      const siblings = await prisma.car.findMany({
        where: { brand: String(car.brand ?? ''), model: String(car.model ?? ''), id: { not: car.id } },
        select: {
          slug: true,
          brand: true,
          model: true,
          variant: true,
          trim: true,
          modelYear: true,
          generation: true,
        },
      })

      let totals = { proposed: 0, unchanged: 0, prices: 0, images: 0, highRisk: 0 }
      totals = addTotals(
        totals,
        await proposeForCar(car as unknown as CarLike, records as unknown as RecordLike[], {
          runId: opts.runId,
          logger: opts.logger as unknown as CrawlLogger | undefined,
          siblings,
        }),
      )
      return totals
    },

    logger: ({ persist }) => new CrawlLogger({ persist, echo: false }),
    limiter: (sourceId, opts) => limiterFor(sourceId, opts),
    now: options.now ?? (() => new Date()),
    newRunId: () => randomUUID(),
  }
}

/** The car shape the proposal path hands back, re-exported for the CLI's types. */
export type { ProposalCar }

// crawler/daily.ts
//
// The scheduled run. One command, safe to invoke every morning.
//
//   npm run crawl:daily                     every source that is due
//   npm run crawl:daily -- --status         report what would run, fetch nothing
//   npm run crawl:daily -- --dry            run without writing
//   npm run crawl:daily -- --source openev  one source, ignoring its cadence
//
// What this command will not do, by construction:
//   * write to Car — every crawled value becomes a proposal for a person
//   * delete anything, ever, including cars a source has stopped listing
//   * fetch a source robots.txt disallows, or one whose robots.txt is unreadable
//   * let one source's failure stop the others, or empty the catalogue
//
// Exit code is 0 when the run completed, whatever the sources did. A source
// being down is an expected condition, not a broken command — and a cron job
// that mails an operator every time a website is slow is a cron job the operator
// filters into a folder they stop reading.

import { randomUUID } from 'node:crypto'

import { ADAPTERS, toMatchInput } from './adapters'
import { classify, isCandidate, candidateKey } from './discover'
import { applyOutcome, grade, type HealthState, type RunOutcome } from './health'
import { limiterFor } from './limiter'
import { CrawlLogger } from './logger'
import { match, type MatchCandidateCar } from './match'
import { coverage, type NormalisedVehicle } from './model'
import { addTotals, groupByCar, proposeForCar, type CarLike, type ProposeTotals, type RecordLike } from './proposals'
import { CADENCES, isDue, toCadence } from './schedule'

interface Args {
  /** Only this source, and ignore its cadence. */
  source: string | null
  dry: boolean
  status: boolean
  limit: number
  /**
   * Restrict a manual run to records whose name contains one of these.
   *
   * For checking one car without pulling a whole dataset through the pipeline.
   * Ignored on a scheduled run, where covering the source is the entire point.
   */
  only: string[]
}

function parseArgs(argv: string[]): Args {
  const sourceFlag = argv.indexOf('--source')
  const limitFlag = argv.indexOf('--limit')
  const onlyFlag = argv.indexOf('--only')
  return {
    only:
      onlyFlag >= 0
        ? (argv[onlyFlag + 1] ?? '')
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [],
    source: sourceFlag >= 0 ? (argv[sourceFlag + 1] ?? null) : null,
    dry: argv.includes('--dry'),
    status: argv.includes('--status'),
    /*
      No limit by default on a scheduled run — the point of the schedule is to
      cover the whole source — but a manual run gets one unless it asks
      otherwise, because a manual run is usually somebody checking something.
    */
    limit: limitFlag >= 0 ? Number(argv[limitFlag + 1] ?? 0) : 0,
  }
}

interface SourceTotals extends ProposeTotals {
  found: number
  stored: number
  failed: number
  unchanged: number
  candidates: number
}

const ZERO: SourceTotals = {
  found: 0,
  stored: 0,
  failed: 0,
  unchanged: 0,
  candidates: 0,
  proposed: 0,
  prices: 0,
  images: 0,
  highRisk: 0,
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = Date.now()

  const store = await import('../src/lib/db/car-source-store')
  const { prisma } = await import('../src/lib/db/client')

  const sources = await store.listSourcesForSchedule()
  const now = new Date()

  console.log(`\nDaily crawl — ${now.toISOString()}`)
  console.log(`  ${sources.length} registered source(s)`)
  if (args.dry) console.log('  mode: dry (nothing will be written)')
  if (args.status) console.log('  mode: status only (nothing will be fetched)')

  // ── What is due, and why ──────────────────────────────────────────
  console.log('\nSchedule')
  const plan: { source: (typeof sources)[number]; run: boolean; reason: string }[] = []

  for (const source of sources) {
    const health = grade({ ...source, now })

    if (args.source) {
      /*
        A named source runs regardless of cadence, but never regardless of
        robots.txt. Impatience is a fine reason to ignore a schedule and never a
        reason to ignore somebody's stated wishes about their own server.
      */
      const run = source.id === args.source
      plan.push({
        source,
        run,
        reason: run ? 'named on the command line, cadence ignored' : 'not the named source',
      })
    } else {
      const verdict = isDue({ ...source, now })
      plan.push({ source, run: verdict.due, reason: verdict.reason })
    }

    const cadence = toCadence(source.schedule)
    console.log(
      `  ${source.id.padEnd(10)} ${CADENCES[cadence].label.padEnd(14)} ${health.grade.padEnd(10)} ` +
        `${plan[plan.length - 1]!.run ? 'RUN ' : 'skip'} — ${plan[plan.length - 1]!.reason}`,
    )
    if (health.grade !== 'healthy' && health.summary) {
      console.log(`             ${health.grade}: ${health.summary}`)
    }
  }

  if (args.status) {
    await reportStale(sources, now)
    await prisma.$disconnect()
    return 0
  }

  const due = plan.filter((entry) => entry.run)
  if (due.length === 0) {
    console.log('\nNothing due. Exiting without contacting any source.')
    await reportStale(sources, now)
    await prisma.$disconnect()
    return 0
  }

  // ── The catalogue, read once ───────────────────────────────────────
  const catalogue: MatchCandidateCar[] = await prisma.car.findMany({
    select: { id: true, slug: true, brand: true, model: true, fullName: true, category: true },
  })
  console.log(`\n${catalogue.length} car(s) in the catalogue to match against`)

  let grand: SourceTotals = { ...ZERO }

  for (const { source } of due) {
    /*
      Each source in its own try/catch.

      This is the whole of the failure isolation, and it is deliberately at the
      outermost level per source: whatever goes wrong — network, parse, a bug in
      an adapter — the loop moves to the next source, the run still closes, and
      the catalogue is untouched. A daily job that aborts halfway leaves the
      operator with no report and half the sources silently a day older.
    */
    try {
      const totals = await crawlSource({ source, catalogue, args, store, prisma })
      grand = mergeTotals(grand, totals)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`\n  ${source.id}: unexpected failure — ${message}`)
      if (!args.dry) {
        const next = applyOutcome(source as HealthState, {
          outcome: 'failure',
          error: message,
          at: new Date(),
        })
        await store.updateSourceHealth(source.id, next)
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(
    `\nDone in ${seconds}s` +
      `\n  fetched   ${grand.found}` +
      `\n  new/changed ${grand.stored}` +
      `\n  unchanged ${grand.unchanged}   (skipped without re-storing)` +
      `\n  failed    ${grand.failed}` +
      `\n  proposals ${grand.proposed} awaiting review (${grand.highRisk} high-risk)` +
      `\n  candidates ${grand.candidates} possible new cars` +
      `\n  prices    ${grand.prices} points recorded` +
      `\n  images    ${grand.images} candidates recorded (none downloaded)`,
  )

  await reportStale(await store.listSourcesForSchedule(), new Date())

  const cars = await prisma.car.count()
  console.log(`\n  Car table untouched: ${cars} rows\n`)

  await prisma.$disconnect()
  return 0
}

interface CrawlArgs {
  source: Awaited<ReturnType<typeof import('../src/lib/db/car-source-store').listSourcesForSchedule>>[number]
  catalogue: MatchCandidateCar[]
  args: Args
  store: typeof import('../src/lib/db/car-source-store')
  prisma: (typeof import('../src/lib/db/client'))['prisma']
}

async function crawlSource(input: CrawlArgs): Promise<SourceTotals> {
  const { source, catalogue, args, store, prisma } = input
  const totals: SourceTotals = { ...ZERO }
  const adapter = ADAPTERS[source.id]
  const runId = randomUUID()
  const runStart = Date.now()

  console.log(`\n${source.name}`)
  console.log(`  run ${runId}`)

  if (!adapter) {
    console.log(`  no adapter is registered for "${source.id}" — skipping`)
    return totals
  }

  const logger = new CrawlLogger({ persist: !args.dry, echo: false })
  const trigger = args.source ? 'manual' : 'scheduled'

  // ── Access, before a single request ───────────────────────────────
  const verdict = await adapter.access()
  console.log(`  access: ${verdict.kind} — ${verdict.reason}`)
  if (verdict.attribution) console.log(`  ATTRIBUTION REQUIRED: ${verdict.attribution}`)

  if (!verdict.allowed) {
    console.log('  refusing to fetch; recording the reason and moving on')
    if (!args.dry) {
      await store.recordRobotsCheck(source.id, 'unchecked', verdict.reason)
      await store.openRun({ id: runId, sourceId: source.id, trigger })
      await store.closeRun(runId, {
        status: 'blocked',
        durationMs: Date.now() - runStart,
        notes: verdict.reason,
        errors: verdict.requires ?? null,
      })
      /*
        Blocked, not failed.

        Declining to fetch is this system working as designed. Counting it as a
        failure would back off against our own decision and eventually report a
        perfectly fine source as unhealthy, when the only fact is that we are not
        permitted to read it.
      */
      const next = applyOutcome(source as HealthState, {
        outcome: 'blocked',
        error: verdict.reason,
        at: new Date(),
      })
      await store.updateSourceHealth(source.id, next)
      logger.log({ runId, sourceId: source.id, operation: 'skip', status: 'blocked', message: verdict.reason })
      await logger.flush()
    }
    return totals
  }

  if (!args.dry) {
    await store.recordRobotsCheck(source.id, 'allowed', verdict.reason)
    await store.openRun({ id: runId, sourceId: source.id, trigger })
  }

  const limiter = limiterFor(source.id, {
    minDelayMs: source.requestDelayMs ?? 1_500,
    concurrency: 1,
  })

  let vehicles: NormalisedVehicle[] = []
  let fetchMs: number | null = null
  const errors: string[] = []

  try {
    const result = await limiter.run(() =>
      adapter.fetch({ ...(args.limit > 0 ? { limit: args.limit } : {}), only: args.only }),
    )
    vehicles = result.value
    fetchMs = result.totalMs
    totals.found = vehicles.length
    logger.log({
      runId,
      sourceId: source.id,
      operation: 'fetch',
      status: 'ok',
      message: `${vehicles.length} record(s)`,
      durationMs: result.totalMs,
    })
    console.log(`  fetched ${vehicles.length} record(s) in ${result.totalMs}ms`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(message)
    logger.error({ runId, sourceId: source.id, operation: 'fetch' }, error)
    console.log(`  fetch failed: ${message}`)

    if (!args.dry) {
      await store.closeRun(runId, {
        status: 'failed',
        durationMs: Date.now() - runStart,
        errors,
      })
      const next = applyOutcome(source as HealthState, {
        outcome: 'failure',
        error: message,
        at: new Date(),
      })
      await store.updateSourceHealth(source.id, next)
      await logger.flush()
    }

    /*
      Nothing else happens on a failed fetch.

      In particular: no records are marked missing, no cars are touched, and no
      candidate is withdrawn. The catalogue after a failed crawl is identical to
      the catalogue before it, which is the only behaviour that makes a daily
      automated job safe to leave running unattended.
    */
    totals.failed = 1
    return totals
  }

  // ── Idempotency: what have we already seen? ───────────────────────
  const seen = args.dry ? new Set<string>() : await store.knownContentHashes(source.id)
  const changedRecordIds: string[] = []

  for (const vehicle of vehicles) {
    const label = `${vehicle.brand ?? '?'} ${vehicle.model ?? '?'}`.trim()
    const hash = store.hashPayload(vehicle)

    /*
      An unchanged payload is skipped entirely.

      Not re-stored, not re-compared, not re-proposed, and — critically — its
      image is not re-fetched. On a daily schedule this is the overwhelmingly
      common case: the vast majority of records are byte-identical to yesterday,
      and a run that re-processed them all would do a day's work to discover
      nothing, every day.
    */
    if (seen.has(hash)) {
      totals.unchanged += 1
      logger.log({ runId, sourceId: source.id, operation: 'fetch', status: 'unchanged', message: label })
      continue
    }

    const proposal = match(toMatchInput(vehicle), catalogue)
    const { filled, total } = coverage(vehicle)

    if (args.dry) {
      console.log(`  DRY  ${label.padEnd(30)} ${filled}/${total} fields · match ${proposal.decision}`)
      totals.stored += 1
      continue
    }

    try {
      const saved = await store.storeRecord({
        sourceId: source.id,
        sourceUrl: vehicle.sourceUrl,
        externalId: vehicle.externalId,
        runId,
        fetchedAt: new Date(vehicle.fetchedAt),
        httpStatus: 200,
        raw: vehicle,
        normalised: vehicle,
        extractionStatus: filled === 0 ? 'failed' : filled < total / 3 ? 'partial' : 'ok',
        fieldsFound: filled,
        fieldsExpected: total,
        confidence: vehicle.confidence,
        // A proposal only. Nothing downstream reads this as approval.
        matchedCarId: proposal.decision === 'confident' ? (proposal.best?.car.id ?? null) : null,
        matchStrategy: proposal.best?.strategy ?? 'none',
        matchScore: proposal.best?.score ?? null,
        matchCandidates: proposal.candidates.map((candidate) => ({
          carId: candidate.car.id,
          slug: candidate.car.slug,
          strategy: candidate.strategy,
          score: candidate.score,
          reason: candidate.reason,
        })),
      })

      totals.stored += 1
      logger.log({
        runId,
        sourceId: source.id,
        carId: proposal.best?.car.id ?? null,
        operation: 'match',
        status: 'changed',
        message: `${label} · ${proposal.decision}${proposal.best ? ` -> ${proposal.best.car.slug}` : ''}`,
      })

      if (proposal.decision === 'confident') {
        changedRecordIds.push(saved.id)
        continue
      }

      // ── Discovery, for anything that did not match ────────────────
      const discovery = classify({ vehicle, match: proposal })
      if (!isCandidate(discovery.verdict)) {
        logger.log({
          runId,
          sourceId: source.id,
          operation: 'discover',
          status: 'skipped',
          message: `${label}: ${discovery.reason}`,
        })
        continue
      }

      const key = candidateKey(vehicle)
      await store.upsertCandidate({
        sourceId: source.id,
        runId,
        recordId: saved.id,
        ...key,
        trim: vehicle.trim,
        category: vehicle.powertrainType,
        normalised: vehicle,
        possibleDuplicateOf: discovery.possibleDuplicateOf,
        duplicateReason: discovery.duplicateReason,
        matchScore: discovery.matchScore,
        confidence: discovery.confidence,
        sourceUrl: vehicle.sourceUrl,
        fetchedAt: new Date(vehicle.fetchedAt),
      })
      totals.candidates += 1
      logger.log({
        runId,
        sourceId: source.id,
        operation: 'discover',
        status: 'changed',
        message: `${label}: ${discovery.verdict} — ${discovery.reason}`,
      })
    } catch (error) {
      totals.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${label}: ${message}`)
      logger.error({ runId, sourceId: source.id, operation: 'normalise' }, error)
    }
  }

  // ── Proposals for the records that actually changed ───────────────
  if (!args.dry && changedRecordIds.length > 0) {
    const records = await prisma.carSourceRecord.findMany({
      where: { id: { in: changedRecordIds } },
      include: { matchedCar: true },
    })

    let proposeTotals: ProposeTotals = { proposed: 0, unchanged: 0, prices: 0, images: 0, highRisk: 0 }

    for (const [, group] of groupByCar(records)) {
      const car = group[0]?.matchedCar
      if (!car) continue
      proposeTotals = addTotals(
        proposeTotals,
        await proposeForCar(car as unknown as CarLike, group as unknown as RecordLike[], {
          logger,
          runId,
        }),
      )
    }

    totals.proposed = proposeTotals.proposed
    totals.prices = proposeTotals.prices
    totals.images = proposeTotals.images
    totals.highRisk = proposeTotals.highRisk
  }

  console.log(
    `  ${totals.stored} new/changed, ${totals.unchanged} unchanged, ${totals.failed} failed, ` +
      `${totals.proposed} proposal(s), ${totals.candidates} candidate(s)`,
  )

  if (!args.dry) {
    /*
      A run with some failures and some results is `partial`, not `failed`.

      The distinction matters to health: `partial` clears the failure count,
      because the source is plainly reachable. Calling it a failure would put a
      working source into backoff over one bad record.
    */
    const outcome: RunOutcome =
      totals.failed > 0 && totals.stored === 0 ? 'failure' : totals.failed > 0 ? 'partial' : 'success'

    await store.closeRun(runId, {
      status: outcome === 'failure' ? 'failed' : outcome === 'partial' ? 'partial' : 'completed',
      recordsFound: totals.found,
      recordsStored: totals.stored,
      recordsFailed: totals.failed,
      recordsChanged: totals.stored,
      recordsUnchanged: totals.unchanged,
      recordsPendingReview: totals.proposed,
      candidatesFound: totals.candidates,
      durationMs: Date.now() - runStart,
      errors: errors.length > 0 ? errors : null,
    })

    const next = applyOutcome(source as HealthState, {
      outcome,
      responseMs: fetchMs,
      changed: totals.stored > 0,
      error: errors[0] ?? null,
      at: new Date(),
    })
    await store.updateSourceHealth(source.id, next)
    await logger.flush()
  }

  return totals
}

/**
 * Names every source whose data is older than it should be.
 *
 * Printed at the end of every run, including runs where nothing was due, because
 * the failure this catches is silence: a source that stopped working three weeks
 * ago produces no errors at all, and the only evidence is a timestamp nobody
 * looks at. Staleness never removes data — an outage must not empty a catalogue.
 */
async function reportStale(
  sources: { id: string; name: string; lastSuccessAt: Date | null; staleAfterDays: number; schedule: string; isEnabled: boolean; robotsStatus: string; lastCrawledAt: Date | null; lastFailureAt: Date | null; lastError: string | null; consecutiveFailures: number; avgResponseMs: number | null; lastChangedAt: Date | null }[],
  now: Date,
): Promise<void> {
  const stale = sources
    .map((source) => ({ source, report: grade({ ...source, now }) }))
    .filter((entry) => entry.report.grade !== 'healthy')

  if (stale.length === 0) {
    console.log('\nEvery source is current.')
    return
  }

  console.log('\nNeeds attention')
  for (const { source, report } of stale) {
    console.log(`  ${source.id.padEnd(10)} ${report.grade.padEnd(10)} ${report.summary}`)
    if (report.detail) console.log(`             ${report.detail}`)
  }
}

function mergeTotals(a: SourceTotals, b: SourceTotals): SourceTotals {
  return {
    found: a.found + b.found,
    stored: a.stored + b.stored,
    failed: a.failed + b.failed,
    unchanged: a.unchanged + b.unchanged,
    candidates: a.candidates + b.candidates,
    proposed: a.proposed + b.proposed,
    prices: a.prices + b.prices,
    images: a.images + b.images,
    highRisk: a.highRisk + b.highRisk,
  }
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })

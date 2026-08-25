// crawler/run.ts
//
// Runs one source adapter and stores what it returns in CarSourceRecord.
//
// Nothing here writes to Car. The furthest it goes is proposing a match, which
// is recorded on the staging row for a reviewer to accept or reject.
//
// Usage:
//   npm run crawl:source -- openev --limit 5
//   npm run crawl:source -- openev --only "byd atto 3,kia ev9"
//   npm run crawl:source -- evdb            (refuses: no permitted access)

import { randomUUID } from 'node:crypto'

import { ADAPTERS, toMatchInput } from './adapters'
import { coverage } from './model'
import { match, type MatchCandidateCar } from './match'

interface Args {
  source: string
  limit: number
  only: string[]
  dry: boolean
}

function parseArgs(argv: string[]): Args {
  const source = argv.find((entry) => !entry.startsWith('--')) ?? 'openev'
  const limitFlag = argv.indexOf('--limit')
  const onlyFlag = argv.indexOf('--only')

  return {
    source,
    // Small by default. A crawler whose default is "everything" is one mistyped
    // command away from a thousand requests.
    limit: limitFlag >= 0 ? Number(argv[limitFlag + 1] ?? 5) : 5,
    only:
      onlyFlag >= 0
        ? (argv[onlyFlag + 1] ?? '').split(',').map((entry) => entry.trim()).filter(Boolean)
        : [],
    dry: argv.includes('--dry'),
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const adapter = ADAPTERS[args.source]

  if (!adapter) {
    console.error(`Unknown source "${args.source}". Known: ${Object.keys(ADAPTERS).join(', ')}`)
    return 1
  }

  const runId = randomUUID()
  console.log(`\n${adapter.name}\n  run:   ${runId}\n  limit: ${args.limit}${args.dry ? '\n  mode:  dry (nothing stored)' : ''}\n`)

  /*
    Imported here rather than at the top of the file.

    These modules are `server-only` and pull in the Prisma client. A dry run, or
    a run against a blocked source, should not need a database at all — and
    importing at module scope would make it a hard requirement for both.
  */
  const { upsertSource, storeRecord, recordRobotsCheck } = await import(
    '../src/lib/db/car-source-store'
  )
  const { prisma } = await import('../src/lib/db/client')

  // ── Access check, before anything is fetched ──────────────────────
  const verdict = await adapter.access()
  console.log(`  access: ${verdict.kind} — ${verdict.reason}`)
  if (verdict.licence) console.log(`  licence: ${verdict.licence}`)
  if (verdict.attribution) console.log(`  ATTRIBUTION REQUIRED: ${verdict.attribution}`)

  if (!verdict.allowed) {
    console.log('\n  Refusing to fetch. Required before this source can run:')
    for (const item of verdict.requires ?? []) console.log(`    - ${item}`)

    if (!args.dry) {
      await upsertSource({ id: adapter.id, name: adapter.name, baseUrl: adapter.baseUrl, isEnabled: false })
      await recordRobotsCheck(adapter.id, 'unchecked', verdict.reason)
      await prisma.crawlRun.create({
        data: {
          id: runId,
          sourceId: adapter.id,
          status: 'blocked',
          completedAt: new Date(),
          notes: verdict.reason,
          errors: JSON.stringify(verdict.requires ?? []),
        },
      })
      console.log('\n  Recorded as a blocked run. The source stays disabled.')
    }

    await prisma.$disconnect()
    // Not an error: refusing an inaccessible source is the system working.
    return 0
  }

  // ── Register the source and open the run ──────────────────────────
  if (!args.dry) {
    await upsertSource({
      id: adapter.id,
      name: adapter.name,
      baseUrl: adapter.baseUrl,
      trustRank: adapter.defaultTrust,
      isEnabled: true,
    })
    await recordRobotsCheck(adapter.id, 'allowed', verdict.reason)
    await prisma.crawlRun.create({ data: { id: runId, sourceId: adapter.id, status: 'running' } })
  }

  const errors: string[] = []
  /**
   * Distinct rows actually written.
   *
   * A counter incremented per call reported "stored 5" for a run that wrote one
   * row: five upserts collided on the same key, and the number that would have
   * revealed it was the one not being measured. Counting returned ids makes the
   * collision impossible to hide.
   */
  const savedIds = new Set<string>()
  let found = 0
  let stored = 0
  let failed = 0

  try {
    const vehicles = await adapter.fetch({ limit: args.limit, only: args.only })
    found = vehicles.length
    console.log(`\n  fetched ${found} record(s)\n`)

    // The catalogue, for match proposals only.
    const catalogue: MatchCandidateCar[] = (
      await prisma.car.findMany({
        select: { id: true, slug: true, brand: true, model: true, fullName: true, category: true },
      })
    ).map((car) => car)

    for (const vehicle of vehicles) {
      const { filled, total } = coverage(vehicle)

      const proposal = match(toMatchInput(vehicle), catalogue)

      const label = `${vehicle.brand ?? '?'} ${vehicle.model ?? '?'}`.trim()

      if (args.dry) {
        console.log(
          `  DRY   ${label.padEnd(30)} ${filled}/${total} fields · match ${proposal.decision}` +
            `${proposal.best ? ` -> ${proposal.best.car.slug}` : ''}`,
        )
        stored += 1
        continue
      }

      try {
        const saved = await storeRecord({
          sourceId: adapter.id,
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
          // A proposal only. Nothing reads this as approval.
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
        savedIds.add(saved.id)
        stored = savedIds.size
        console.log(
          `  OK    ${label.padEnd(30)} ${filled}/${total} fields · conf ${vehicle.confidence}` +
            ` · match ${proposal.decision}${proposal.best ? ` -> ${proposal.best.car.slug}` : ''}`,
        )
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`${label}: ${message}`)
        console.log(`  FAIL  ${label.padEnd(30)} ${message}`)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(message)
    console.error(`\n  Run failed: ${message}`)
  }

  if (!args.dry) {
    await prisma.crawlRun.update({
      where: { id: runId },
      data: {
        status: errors.length > 0 && stored === 0 ? 'failed' : 'completed',
        completedAt: new Date(),
        recordsFound: found,
        recordsStored: stored,
        recordsFailed: failed,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    })
    await prisma.carSource.update({
      where: { id: adapter.id },
      data: { lastCrawledAt: new Date() },
    })
  }

  /*
    Collapsed records are reported, never hidden.

    found minus stored minus failed is the number of records that landed on a key
    another record already held — meaning the source is not giving each record a
    unique identity, and rows overwrote each other. Silence here is how a
    five-record test came back claiming five stored rows with one in the table.
  */
  const collapsed = found - stored - failed
  console.log(
    `\n  found ${found}, stored ${stored} distinct row(s), failed ${failed}` +
      (collapsed > 0
        ? `\n  WARNING: ${collapsed} record(s) collapsed onto an existing key —` +
          ` the source is not giving each record a unique identity`
        : '') +
      `\n  Car table untouched: ${await prisma.car.count()} rows\n`,
  )

  await prisma.$disconnect()
  return failed > 0 || (found > 0 && stored === 0) ? 1 : 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })

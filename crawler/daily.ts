// crawler/daily.ts
//
// The scheduled run's command line. Safe to invoke every morning.
//
//   npm run crawl:daily                       every source that is due
//   npm run crawl:status                       what would run; fetches nothing
//   npm run crawl:dry                          a full pass that writes nothing
//   npm run crawl:all                          every enabled source, cadence ignored
//   npm run crawl:daily -- --source openev     one source, ignoring its cadence
//   npm run crawl:car -- byd-seal              one car, by slug or name
//   npm run crawl:daily -- --cars a,b,c        several cars
//   npm run crawl:daily -- --budget 200        process at most 200 records
//
// The orchestration itself lives in pipeline.ts, driven by verify-daily.ts under
// test. This file parses flags, prints, and sets an exit code — nothing that
// decides what the crawl does belongs here, because nothing in this file is
// covered by a test.
//
// What the run will not do, by construction:
//   * write to Car — every crawled value becomes a proposal for a person
//   * delete anything, ever, including cars a source has stopped listing
//   * fetch a source whose access check does not return allowed
//   * let one source's failure stop the others, or empty the catalogue
//
// Exit code is 0 when the run completed, whatever the sources did. A source being
// down is an expected condition, not a broken command — and a cron job that mails
// an operator every time a website is slow is a cron job the operator filters
// into a folder they stop reading. A non-zero code means the command itself could
// not run.

import { liveDeps } from './live-deps'
import { formatReport, formatSchedule, formatStale } from './report'
import { planRun, runDaily, type RunRequest } from './pipeline'

interface Args extends RunRequest {
  /** Report the plan and stop. Contacts nothing, writes nothing. */
  status: boolean
}

function flagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag)
  if (index < 0) return null
  return argv[index + 1] ?? null
}

function csv(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function parseArgs(argv: string[]): Args {
  const source = flagValue(argv, '--source')
  const all = argv.includes('--all')

  /*
    `--car` and `--cars` are the same thing spelled for one or many.

    Two flags rather than one, because `--car byd-seal` is what somebody types
    when checking a single car and being made to write `--cars byd-seal` for it is
    the kind of friction that ends with the flag not being used at all.
  */
  const cars = [...csv(flagValue(argv, '--cars')), ...csv(flagValue(argv, '--car'))]

  const limit = Number(flagValue(argv, '--limit') ?? 0)
  const budget = Number(flagValue(argv, '--budget') ?? 0)

  return {
    mode: source ? 'named' : all ? 'all' : 'scheduled',
    source,
    only: cars,
    dry: argv.includes('--dry'),
    status: argv.includes('--status'),
    /*
      No limit by default. The point of a schedule is to cover the source, and a
      silently capped scheduled run is a run that reports full coverage of a
      fraction of the data. Use --budget when a cap is wanted; it says so in the
      output and defers the rest to the next run rather than dropping it.
    */
    limit: Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 0,
    budget: Number.isFinite(budget) && budget > 0 ? Math.trunc(budget) : 0,
    /*
      A named source, a car filter or --all means a person typed this. Recorded on
      every CrawlRun so an unexpected run can be traced to whoever or whatever
      started it, which is the first question asked when a figure changes.
    */
    trigger: source || all || cars.length > 0 ? 'manual' : 'scheduled',
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const deps = await liveDeps()
  const { prisma } = await import('../src/lib/db/client')

  console.log(`\nDaily crawl — ${deps.now().toISOString()}`)
  console.log(`  ${deps.sources.length} registered source(s)`)
  console.log(`  mode: ${args.mode}${args.source ? ` (${args.source})` : ''}`)
  if (args.only && args.only.length > 0) console.log(`  cars: ${args.only.join(', ')}`)
  if (args.budget > 0) console.log(`  budget: ${args.budget} record(s) per source`)
  if (args.dry) console.log('  dry: nothing will be written')
  if (args.status) console.log('  status only: nothing will be fetched')

  // ── The plan, printed identically whether or not it is executed ────
  const plan = planRun(deps, args)
  console.log(formatSchedule(plan))

  if (args.status) {
    console.log(formatStale(deps.sources, deps.now()))
    await prisma.$disconnect()
    return 0
  }

  if (!plan.some((entry) => entry.run)) {
    console.log('\nNothing due. Exiting without contacting any source.')
    console.log(formatStale(deps.sources, deps.now()))
    await prisma.$disconnect()
    return 0
  }

  const report = await runDaily(deps, args)
  console.log(formatReport(report))

  /*
    The catalogue count is printed after every run, including failed ones.

    It is the one line that answers the question this whole design exists to
    answer — "did the crawler change the site?" — and it is worth stating
    unconditionally rather than only when something went wrong.
  */
  console.log(`\n  Car table untouched: ${report.carsAfter} rows\n`)

  await prisma.$disconnect()
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })

// crawler/propose.ts
//
// Turns stored source records into reviewable proposals, on demand.
//
// A thin command over crawler/proposals.ts, which is the same module the daily
// orchestrator uses. Writes nothing to Car — the whole point of this stage is
// that a person decides.
//
// Usage:
//   npm run crawl:propose                 every pending matched record
//   npm run crawl:propose -- --dry        report without writing
//   npm run crawl:propose -- --car byd-seal

import {
  addTotals,
  groupByCar,
  proposeForCar,
  type CarLike,
  type ProposeTotals,
  type RecordLike,
} from './proposals'

interface Args {
  dry: boolean
  car: string | null
  limit: number
}

function parseArgs(argv: string[]): Args {
  const carFlag = argv.indexOf('--car')
  const limitFlag = argv.indexOf('--limit')
  return {
    dry: argv.includes('--dry'),
    car: carFlag >= 0 ? (argv[carFlag + 1] ?? null) : null,
    limit: limitFlag >= 0 ? Number(argv[limitFlag + 1] ?? 200) : 200,
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))

  const { prisma } = await import('../src/lib/db/client')

  console.log(`\nProposing changes${args.dry ? ' (dry — nothing written)' : ''}\n`)

  /*
    Only records that matched a car.

    An unmatched record has nothing to compare against, and inventing a car from
    one would be exactly the automatic merge this pipeline exists to prevent.
    Those go to discovery, which raises a candidate for a person to judge.
  */
  const records = await prisma.carSourceRecord.findMany({
    where: {
      matchedCarId: { not: null },
      reviewStatus: 'pending',
      ...(args.car ? { matchedCar: { slug: args.car } } : {}),
    },
    take: args.limit,
    include: { matchedCar: true },
  })

  console.log(`  ${records.length} matched record(s) to compare\n`)

  let totals: ProposeTotals = { proposed: 0, unchanged: 0, prices: 0, images: 0, highRisk: 0 }

  for (const [, group] of groupByCar(records)) {
    const car = group[0]?.matchedCar
    if (!car) continue

    console.log(`  ${car.fullName}  (${group.length} source record(s))`)

    totals = addTotals(
      totals,
      await proposeForCar(car as unknown as CarLike, group as unknown as RecordLike[], {
        dry: args.dry,
        verbose: true,
      }),
    )
  }

  console.log(
    `\n  ${totals.proposed} proposal(s) (${totals.highRisk} high-risk),` +
      ` ${totals.unchanged} field(s) already correct,` +
      ` ${totals.prices} price point(s), ${totals.images} image candidate(s)` +
      `\n  Car table untouched: ${await prisma.car.count()} rows\n`,
  )

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

// scripts/collapse-duplicate-proposals.ts
//
// Supersedes older pending proposals that a newer claim from the same source has
// already replaced.
//
//   npx tsx scripts/collapse-duplicate-proposals.ts             # dry run
//   npx tsx scripts/collapse-duplicate-proposals.ts --apply     # write
//
// ── Why this exists at all ────────────────────────────────────────────
//
// CarFieldChange is keyed on (carId, field, sourceId, runId). The run id is in
// the key deliberately: what each source claimed over time is history, and a
// later run proposing the same field is a new row rather than an overwrite.
//
// The consequence, before the fix in storeProposal, was that running the same
// command three times left three identical pending rows per field. An operator
// then faced a queue where the same decision appeared three times, and approving
// one left two rows proposing a change that had already been made — so the second
// approval would compare against the new value and look like a reversal.
//
// storeProposal now supersedes the previous pending row as it writes, so this
// cannot recur. This script is for the rows that predate that fix.
//
// ── What it does not do ───────────────────────────────────────────────
//
// Nothing is deleted. A superseded row keeps its values, its source, its URL and
// its reasoning, and says in its note why it is no longer pending — the history of
// what each source claimed survives, which is the entire reason the run id is in
// the key. No Car row is read or written.

import { prisma } from '../src/lib/db/client'

interface Args {
  apply: boolean
  /** Restrict to one car, for a cautious first pass. */
  car: string | null
}

function parseArgs(argv: string[]): Args {
  const carFlag = argv.indexOf('--car')
  return {
    /*
      Dry by default.

      This is a bulk status change across a review queue. The version of this that
      wrote by default was a scratch file in the project root, and the reason it
      was halted mid-session was precisely that nobody could see what it would do
      before it did it.
    */
    apply: argv.includes('--apply'),
    car: carFlag >= 0 ? (argv[carFlag + 1] ?? null) : null,
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))

  const rows = await prisma.carFieldChange.findMany({
    where: {
      status: 'pending',
      ...(args.car ? { carId: args.car } : {}),
    },
    /*
      Newest first, so the first row seen for a key is the one that survives.

      createdAt rather than runId: run ids are uuids and sort meaninglessly, and
      "the most recent claim" is the only definition of which duplicate to keep
      that matches what storeProposal now does as it writes.
    */
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      carId: true,
      field: true,
      sourceId: true,
      runId: true,
      currentValue: true,
      proposedValue: true,
      createdAt: true,
    },
  })

  const kept = new Map<string, (typeof rows)[number]>()
  const stale: { row: (typeof rows)[number]; supersededBy: (typeof rows)[number] }[] = []

  for (const row of rows) {
    const key = `${row.carId}|${row.field}|${row.sourceId}`
    const winner = kept.get(key)
    if (winner) stale.push({ row, supersededBy: winner })
    else kept.set(key, row)
  }

  console.log(`\n${rows.length} pending proposal(s) across ${kept.size} distinct car+field+source`)

  if (stale.length === 0) {
    console.log('No duplicates. Nothing to do.\n')
    await prisma.$disconnect()
    return 0
  }

  console.log(`\n${stale.length} older duplicate(s) would be superseded:\n`)

  for (const { row, supersededBy } of stale) {
    console.log(
      `  ${row.carId.padEnd(14)} ${row.field.padEnd(16)} ${row.sourceId.padEnd(9)} ` +
        `${(row.currentValue ?? '—').slice(0, 12).padEnd(13)} -> ${(row.proposedValue ?? '—').slice(0, 12).padEnd(13)}` +
        `  ${row.createdAt.toISOString()}  superseded by ${supersededBy.runId.slice(0, 8)}`,
    )
  }

  /*
    A duplicate whose values differ is reported and left alone.

    Two pending rows for one car+field+source with *different* proposed values are
    not a duplicate of the same claim — they are a source that changed its mind,
    and which one is current is a judgement a person should make with both in
    front of them. Collapsing those would silently pick one.
  */
  const divergent = stale.filter(
    ({ row, supersededBy }) => row.proposedValue !== supersededBy.proposedValue,
  )

  if (divergent.length > 0) {
    console.log(
      `\n  ${divergent.length} of these propose a DIFFERENT value from the row superseding them.`,
    )
    console.log('  Those are a source changing its mind, not a duplicate claim.')
    console.log('  They are left pending for a person to compare:\n')
    for (const { row, supersededBy } of divergent) {
      console.log(
        `    ${row.carId} ${row.field}: this row says ${row.proposedValue ?? '—'}, ` +
          `the newer one says ${supersededBy.proposedValue ?? '—'}`,
      )
    }
  }

  const collapsible = stale.filter(
    ({ row, supersededBy }) => row.proposedValue === supersededBy.proposedValue,
  )

  console.log(
    `\n  ${collapsible.length} identical duplicate(s) are safe to supersede, ` +
      `${divergent.length} left pending.`,
  )

  if (!args.apply) {
    console.log('\nDry run — nothing was written. Re-run with --apply to write.\n')
    await prisma.$disconnect()
    return 0
  }

  if (collapsible.length === 0) {
    console.log('\nNothing safe to collapse. Nothing written.\n')
    await prisma.$disconnect()
    return 0
  }

  /*
    One transaction.

    Either the queue is collapsed or it is not. A partial collapse would leave the
    queue in a state no code produced and no operator chose, which is worse than
    either end state.
  */
  const result = await prisma.$transaction(async (tx) =>
    tx.carFieldChange.updateMany({
      where: { id: { in: collapsible.map(({ row }) => row.id) } },
      data: {
        status: 'superseded',
        reviewedAt: new Date(),
        /*
          reviewedBy is deliberately left null.

          Nobody reviewed these. A maintenance script superseding a duplicate is
          not a person making a decision, and writing an approver name here would
          put a false entry in the one trail that answers "who decided this?".
        */
        reviewNote:
          'superseded by an identical, newer claim from the same source; collapsed by scripts/collapse-duplicate-proposals.ts',
      },
    }),
  )

  const remaining = await prisma.carFieldChange.count({ where: { status: 'pending' } })

  console.log(`\nSuperseded ${result.count} row(s). ${remaining} proposal(s) still pending.`)
  console.log(`Car table untouched: ${await prisma.car.count()} rows\n`)

  await prisma.$disconnect()
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nFailed:', error)
    process.exitCode = 1
  })

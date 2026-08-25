// One-off: collapse pending proposals the pre-fix runs duplicated.
//
// Keeps the newest pending row per (car, field, source) and marks the rest
// superseded — the same thing storeProposal now does as it writes. Nothing is
// deleted, and no Car row is touched.
import { prisma } from './src/lib/db/client'

async function main() {
  const rows = await prisma.carFieldChange.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, carId: true, field: true, sourceId: true },
  })

  const kept = new Set<string>()
  const stale: string[] = []

  for (const row of rows) {
    const key = `${row.carId}|${row.field}|${row.sourceId}`
    if (kept.has(key)) stale.push(row.id)
    else kept.add(key)
  }

  if (stale.length > 0) {
    await prisma.carFieldChange.updateMany({
      where: { id: { in: stale } },
      data: {
        status: 'superseded',
        reviewNote: 'superseded by a newer claim from the same source',
        reviewedAt: new Date(),
      },
    })
  }

  console.log(`kept ${kept.size} pending, superseded ${stale.length} older duplicate(s)`)
  console.log('cars:', await prisma.car.count())
  await prisma.$disconnect()
}

void main()

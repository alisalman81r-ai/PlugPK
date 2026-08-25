import { prisma } from './src/lib/db/client'

async function main() {
  const pending = await prisma.carFieldChange.groupBy({
    by: ['carId', 'field', 'sourceId'],
    where: { status: 'pending' },
    _count: { _all: true },
  })
  const dupes = pending.filter((p) => p._count._all > 1)
  console.log('pending groups:', pending.length, '| groups with >1 row:', dupes.length)
  for (const d of dupes.slice(0, 10)) console.log('  ', d.carId, d.field, d.sourceId, d._count._all)
  console.log('candidates:', await prisma.carCandidate.count(), 'pending:', await prisma.carCandidate.count({ where: { status: 'pending' } }))
  console.log('cars:', await prisma.car.count())
  console.log('runs:', await prisma.crawlRun.count(), 'log lines:', await prisma.crawlLogEntry.count())
  await prisma.$disconnect()
}

void main()

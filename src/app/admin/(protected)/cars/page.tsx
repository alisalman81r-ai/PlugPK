// src/app/admin/(protected)/cars/page.tsx
import { AlertTriangle, Car as CarIcon, ImageOff, Layers, Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { CarInventory } from '@/components/admin/CarInventory'
import { auditCatalogue, summarise } from '@/lib/car-admin'
import { listCars } from '@/lib/db/car-queries'
import { cn } from '@/lib/utils'

/**
 * The car catalogue, for an operator.
 *
 * Cars are a Prisma table now, like everything else in this portal, so this
 * section reads and writes. src/data/cars.ts remains as the seed — the authored,
 * reviewable 36 rows with their provenance in comments — and
 * scripts/seed-cars.ts loads it. Editing happens here.
 *
 * The catalogue's governing rule survives the move: nothing is invented, so a
 * figure that was never published is null rather than estimated. That makes the
 * gaps deliberate, and the gaps the work list — which is why this page leads
 * with what is missing rather than with a count of what is there.
 */

export const metadata = { title: { absolute: 'Cars · Plug.pk admin' } }

/** An admin page reading live rows must never be served from a cache. */
export const dynamic = 'force-dynamic'

export default async function AdminCarsPage() {
  const audits = auditCatalogue(await listCars())
  const summary = summarise(audits)

  return (
    <>
      <AdminHeader
        title="Cars"
        description={`${summary.total} models from ${summary.brands} brands.`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/cars"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              <CarIcon size={16} aria-hidden="true" />
              Live catalogue
            </Link>
            <Link
              href="/admin/cars/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              <Plus size={16} aria-hidden="true" />
              Add car
            </Link>
          </div>
        }
      />

      <div className="px-8 py-8">
        {/* ── The four figures worth knowing before scrolling ─────── */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            icon={Layers}
            value={summary.total}
            label="Models listed"
            detail={summary.byCategory
              .map((entry) => `${entry.count} ${entry.category}`)
              .join(' · ')}
          />
          <Tile
            icon={CarIcon}
            value={`${summary.averageCompleteness}%`}
            label="Average completeness"
            detail="Against the fields each powertrain is expected to carry"
          />
          <Tile
            icon={ImageOff}
            value={summary.withoutPhoto}
            label={summary.withoutPhoto === 1 ? 'Model with no photo' : 'Models with no photo'}
            detail={`${summary.withPhoto} of ${summary.total} have a licensed photograph`}
            tone={summary.withoutPhoto > 0 ? 'warn' : 'good'}
          />
          <Tile
            icon={AlertTriangle}
            value={summary.indicativePrices}
            label="Indicative prices"
            detail={`${summary.confirmedPrices} came from a supplied price list`}
            tone={summary.indicativePrices > 0 ? 'warn' : 'good'}
          />
        </div>

        <CarInventory audits={audits} />
      </div>
    </>
  )
}

/**
 * One summary figure.
 *
 * The tone is on the border and the icon, never a filled card: four filled
 * cards in a row compete with the table below, which is the thing being
 * summarised. `good` is deliberately quiet — a zero here is the absence of a
 * problem, and absence of a problem does not need celebrating in green.
 */
function Tile({
  icon: Icon,
  value,
  label,
  detail,
  tone = 'plain',
}: {
  icon: LucideIcon
  value: number | string
  label: string
  detail: string
  tone?: 'plain' | 'warn' | 'good'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4',
        tone === 'warn' ? 'border-amber-200' : 'border-slate-200',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          aria-hidden="true"
          className={tone === 'warn' ? 'text-amber-500' : 'text-slate-400'}
        />
        <p className="text-ui-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-ui-xs leading-relaxed text-slate-500">{detail}</p>
    </div>
  )
}

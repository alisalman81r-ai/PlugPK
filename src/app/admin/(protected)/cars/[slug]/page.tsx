// src/app/admin/(protected)/cars/[slug]/page.tsx
import { AlertTriangle, ArrowLeft, ExternalLink, Info, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { CarDeleteCard } from '@/components/admin/CarDeleteCard'
import { CarForm } from '@/components/admin/CarForm'
import { CarImageManager } from '@/components/admin/CarImageManager'
import { getBrands } from '@/lib/cars'
import { auditCar } from '@/lib/car-admin'
import { getCarBySlugFromDb, listCars } from '@/lib/db/car-queries'
import { cn } from '@/lib/utils'

/**
 * One car, editable.
 *
 * Three panels rather than one long form: the fields, the photograph, and what
 * is outstanding. They are separate because they are saved separately — the
 * photograph has its own action, so replacing an image cannot be lost by a
 * validation error twenty fields away, and a failed upload cannot take an edit
 * with it.
 *
 * The raw record stays at the bottom behind a disclosure. Now that the fields
 * are editable it is no longer the only way to see everything, but it is still
 * the fastest way to check one, paste one into a message, or diff one against a
 * supplier's sheet.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const car = await getCarBySlugFromDb(params.slug)
  return { title: { absolute: car ? `${car.fullName} · Plug.pk admin` : 'Car not found' } }
}

export default async function AdminCarDetailPage({ params }: PageProps) {
  const car = await getCarBySlugFromDb(params.slug)
  if (!car) notFound()

  const all = await listCars()
  const audit = auditCar(car)

  return (
    <>
      <AdminHeader
        title={car.fullName}
        description={`${car.category} · ${car.price.display}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cars"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              All cars
            </Link>
            <Link
              href={`/cars/${car.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Live page
            </Link>
          </div>
        }
      />

      <div className="px-8 py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-2 flex min-w-0 flex-col gap-5 xl:order-1">
            <CarForm car={car} brands={getBrands(all)} />

            <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500">
                Raw record
                <span className="text-ui-xs font-normal normal-case tracking-normal text-slate-400 group-open:hidden">
                  show JSON
                </span>
                <span className="hidden text-ui-xs font-normal normal-case tracking-normal text-slate-400 group-open:inline">
                  hide
                </span>
              </summary>
              <pre className="overflow-x-auto border-t border-slate-100 bg-slate-900 px-5 py-4 text-ui-xs leading-relaxed text-slate-100">
                <code>{JSON.stringify(car, null, 2)}</code>
              </pre>
            </details>
          </div>

          <aside className="order-1 flex min-w-0 flex-col gap-5 xl:order-2">
            <CarImageManager
              carId={car.id}
              carName={car.fullName}
              image={car.image}
              credit={audit.credit}
            />

            {/* ── Completeness ─────────────────────────────────────── */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
                Data completeness
              </h2>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
                  {audit.completeness}%
                </span>
                <span className="text-ui-sm text-slate-500">
                  {audit.filled} of {audit.expected} expected fields
                </span>
              </div>

              <span className="mt-3 block h-2 overflow-hidden rounded-full bg-slate-200">
                <span
                  className={cn(
                    'block h-full rounded-full',
                    audit.completeness === 100 ? 'bg-emerald-500' : 'bg-blue-500',
                  )}
                  style={{ width: `${audit.completeness}%` }}
                />
              </span>

              <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
                Measured against the fields a <strong>{car.category}</strong> is expected to carry.
                A full hybrid has no plug, so charging fields are not counted against one.
              </p>
            </section>

            {/* ── Outstanding ──────────────────────────────────────── */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
                Outstanding
              </h2>

              {audit.issues.length === 0 ? (
                <p className="mt-3 text-ui-sm text-slate-600">
                  Nothing outstanding. Every expected figure is present, the price came from a
                  supplied list, and the photograph is licensed and credited.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {audit.issues.map((issue) => (
                    <li key={issue.label} className="flex gap-2.5">
                      <IssueIcon level={issue.level} />
                      <div className="min-w-0">
                        <p className="text-ui-sm font-semibold text-slate-900">{issue.label}</p>
                        <p className="mt-0.5 text-ui-xs leading-relaxed text-slate-500">
                          {issue.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <CarDeleteCard carId={car.id} carName={car.fullName} />
          </aside>
        </div>
      </div>
    </>
  )
}

function IssueIcon({ level }: { level: 'warn' | 'info' }) {
  const Icon: LucideIcon = level === 'warn' ? AlertTriangle : Info
  return (
    <Icon
      size={15}
      aria-label={level === 'warn' ? 'Warning' : 'For information'}
      className={cn('mt-0.5 shrink-0', level === 'warn' ? 'text-amber-500' : 'text-slate-400')}
    />
  )
}

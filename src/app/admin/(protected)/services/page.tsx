// src/app/admin/(protected)/services/page.tsx
import { Inbox, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminServicesDirectory } from '@/components/admin/AdminServicesDirectory'
import { ServiceReviewControl } from '@/components/admin/ServiceReviewControl'
import { deleteService } from '@/lib/db/actions'
import { listServicesForAdmin } from '@/lib/db/queries'

/**
 * The services directory, and the queue of people asking to join it.
 *
 * This page used to call getServices(). That query now filters to approved,
 * because the public directory has to — which would have made every pending
 * application invisible to the only person who can approve one. It reads
 * listServicesForAdmin() instead, which returns every status by design.
 *
 * Applications sit in their own section above the directory rather than mixed
 * into it with a status chip. A queue is work and a directory is a record, and
 * an operator opening this page wants to know whether there is anything to do
 * before they want to know what is already listed.
 */

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const all = await listServicesForAdmin()
  const pending = all.filter((row) => row.status === 'pending')
  const listed = all.filter((row) => row.status !== 'pending')
  const approved = all.filter((row) => row.status === 'approved').length

  return (
    <>
      <AdminHeader
        title="Services"
          help={
            <>
              <b>Workshops, installers and dealerships listed in the services
              directory.</b> Reviewing one decides whether it appears publicly. This is
              the directory drivers search when they need a charger installed or a car
              serviced.
            </>
          }
        description={
          pending.length > 0
            ? `${pending.length} awaiting review · ${approved} live in the directory.`
            : `${approved} live in the directory.`
        }
        action={
          <Link
            href="/admin/services/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Add service
          </Link>
        }
      />

      <div className="px-8 py-8">
        {/* ── Applications ─────────────────────────────────────────
            Rendered only when there are some. An empty "Applications"
            panel sitting above the directory on every visit teaches an
            operator to stop looking at it. */}
        {pending.length > 0 ? (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-white">
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50/60 px-6 py-4">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-amber-300 text-amber-700"
              >
                <Inbox size={17} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">
                  {pending.length} {pending.length === 1 ? 'application' : 'applications'} to review
                </h2>
                <p className="text-ui-sm text-slate-500">
                  Approving publishes the listing on the public services page immediately.
                </p>
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {pending.map((row) => (
                <li key={row.id} className="flex flex-wrap items-start gap-4 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="mt-0.5 text-ui-sm text-slate-500">
                      <span className="capitalize">{row.category.replace(/-/g, ' ')}</span>
                      {' · '}
                      {row.city}
                    </p>
                    <p className="mt-1 font-mono text-ui-xs text-slate-400">
                      {row.phone || row.email || 'no contact given'}
                      {row.submittedAt
                        ? ` · applied ${row.submittedAt.toISOString().slice(0, 10)}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/services/${row.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-slate-300 px-3 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-plug-blue-400 hover:text-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Details
                    </Link>
                    <ServiceReviewControl id={row.id} name={row.name} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AdminServicesDirectory services={listed} onDelete={deleteService} />
      </div>
    </>
  )
}

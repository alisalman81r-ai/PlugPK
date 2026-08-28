// src/app/admin/(protected)/services/page.tsx
import { ExternalLink, Inbox, Pencil, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { ServiceReviewControl } from '@/components/admin/ServiceReviewControl'
import { deleteService } from '@/lib/db/actions'
import { listServicesForAdmin } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

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

const STATUS_CHIP: Record<string, string> = {
  pending: 'border-amber-300 bg-amber-50 text-amber-700',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-300 bg-slate-50 text-slate-500',
}

export default async function AdminServicesPage() {
  const all = await listServicesForAdmin()
  const pending = all.filter((row) => row.status === 'pending')
  const listed = all.filter((row) => row.status !== 'pending')
  const approved = all.filter((row) => row.status === 'approved').length

  return (
    <>
      <AdminHeader
        title="Services"
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

        {/* ── The directory ────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                Every service in the directory, with its approval status.
              </caption>
              <thead>
                <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-3 font-semibold">Business</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">City</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listed.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                        {row.name}
                        {row.isVerified ? (
                          <ShieldCheck
                            size={14}
                            className="shrink-0 text-plug-blue-600"
                            aria-label="Verified"
                          />
                        ) : null}
                      </p>
                      <p className="mt-0.5 font-mono text-ui-xs text-slate-400">{row.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-ui-sm capitalize text-slate-600">
                      {row.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-ui-sm text-slate-600">{row.city}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-ui-xs font-semibold capitalize',
                          STATUS_CHIP[row.status] ?? STATUS_CHIP.rejected,
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Only an approved listing has a public page to open. */}
                        {row.status === 'approved' ? (
                          <Link
                            href={`/services/${row.category}/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${row.name} on the live site`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/services/${row.id}`}
                          aria-label={`Edit ${row.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                        >
                          <Pencil size={15} />
                        </Link>
                        <DeleteButton
                          label={row.name}
                          action={async () => {
                            'use server'
                            return deleteService(row.id)
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

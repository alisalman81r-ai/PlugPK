// src/app/admin/(protected)/services/page.tsx
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminServicesDirectory } from '@/components/admin/AdminServicesDirectory'
import { ServiceReviewControl } from '@/components/admin/ServiceReviewControl'
import { flattenParams } from '@/components/admin/list-params'
import { AddLink, CARD, Ico, btnClass, rise } from '@/components/admin/network-kit'
import { deleteService } from '@/lib/db/actions'
import { listPendingServices, listServicesPage, toPage, toQuery } from '@/lib/db/admin-queries'

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

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const category = params.category?.slice(0, 60) || 'all'
  const city = params.city?.slice(0, 80) || 'all'
  const page = toPage(params.page)

  const [queue, directory] = await Promise.all([
    listPendingServices(),
    listServicesPage({ q, category, city, status: 'all', page }),
  ])
  const pending = queue.rows
  const approved = directory.counts.approved

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
          queue.total > 0
            ? `${queue.total} awaiting review · ${approved} live in the directory.`
            : `${approved} live in the directory.`
        }
        action={<AddLink href="/admin/services/new">Add service</AddLink>}
      />

      {/* ── Applications ─────────────────────────────────────────
          Rendered only when there are some. An empty "Applications"
          panel sitting above the directory on every visit teaches an
          operator to stop looking at it. */}
      {pending.length > 0 ? (
        <section {...rise()} aria-labelledby="service-queue" className={`${CARD} mb-[18px] overflow-hidden`}>
          <header className="flex items-center justify-between gap-3 border-b border-l-4 border-b-ink/[.09] border-l-[#FFB020] bg-paper px-6 py-[18px] max-[640px]:px-4">
            <div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Applications</span>
              <h2 id="service-queue" className="m-0 mt-1 font-display text-2xl font-normal leading-[1.1] text-ink">
                {queue.total} to review
                {queue.total > pending.length ? <span className="text-muted"> · oldest {pending.length} shown</span> : null}
              </h2>
              <p className="mb-0 mt-1.5 text-sm text-muted">Approving publishes the listing on the public services page immediately.</p>
            </div>
            <span className="inline-grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(255,176,32,.16)] text-[#8a5a00] [&_svg]:h-[22px] [&_svg]:w-[22px]">
              <Ico name="inbox" />
            </span>
          </header>

          <ul className="m-0 list-none p-0">
            {pending.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start gap-4 border-t border-ink/[.09] px-6 py-4 transition-colors duration-200 first:border-t-0 hover:bg-paper max-[640px]:px-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-display text-lg leading-[1.2] text-ink">{row.name}</p>
                  <p className="mb-0 mt-1 inline-flex flex-wrap items-center gap-x-1.5 text-sm text-muted [&_svg]:h-[15px] [&_svg]:w-[15px]">
                    <span className="capitalize">{row.category.replace(/-/g, ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <Ico name="pinl" className="text-fog" />
                    {row.city}
                  </p>
                  <p className="mb-0 mt-1 font-mono text-xs text-fog">
                    {row.phone || row.email || 'no contact given'}
                    {row.submittedAt ? ` · applied ${row.submittedAt.slice(0, 10)}` : ''}
                  </p>
                  {row.user ? (
                    <p className="mb-0 mt-1 text-[13px] text-muted">
                      Sent by{' '}
                      <Link href={`/admin/members/${row.user.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">
                        {row.user.name}
                      </Link>{' '}
                      <span className="text-fog">({row.user.email})</span>
                    </p>
                  ) : (
                    <p className="mb-0 mt-1 text-[13px] text-fog">Sent without signing in</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-start gap-2">
                  <Link href={`/admin/services/${row.id}`} className={btnClass('line', 'sm')}>
                    <Ico name="pen" />
                    Details
                  </Link>
                  <ServiceReviewControl id={row.id} name={row.name} lat={row.lat} lng={row.lng} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AdminServicesDirectory
        services={directory.rows}
        cities={directory.cities}
        category={category}
        city={city}
        total={directory.total}
        onDelete={deleteService}
      />

      <AdminPagination
        path="/admin/services"
        params={params}
        page={page}
        pageSize={directory.pageSize}
        total={directory.total}
        noun={['service', 'services']}
      />
    </>
  )
}

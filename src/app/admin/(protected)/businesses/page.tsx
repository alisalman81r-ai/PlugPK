// src/app/admin/(protected)/businesses/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { BusinessPhotoReview } from '@/components/admin/BusinessPhotoReview'
import { buildHref, flattenParams, pick } from '@/components/admin/list-params'
import { AddLink, EmptyCard, SegLinks, TOOLS, TOOLS_ROW, rise } from '@/components/admin/network-kit'
import { listBusinessesPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { getApplications } from '@/lib/db/listing-application-queries'
import { getBusinessPhotoReports } from '@/lib/db/queries'

import { BusinessCard } from './BusinessCard'


export const dynamic = 'force-dynamic'

const PATH = '/admin/businesses'

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick(params.status, ['all', 'pending', 'approved', 'rejected'] as const, 'all')
  const page = toPage(params.page)

  const [listing, reports] = await Promise.all([
    listBusinessesPage({ q, status, page }),
    getBusinessPhotoReports(),
  ])
  const rows = listing.rows
  const { counts } = listing
  const applications = await getApplications(rows.map((row) => row.id))

  return (
    <>
      <AdminHeader
        title="Business applications"
        help={
          <>
            <b>Hotels, malls and cafés that applied to be listed</b> through the public
            form. Approving one publishes it to the site; until then only you can see
            it. Anything still pending is a real business waiting on a reply from you.
          </>
        }
        description={
          counts.all === 0
            ? 'Businesses applying to list their chargers will appear here.'
            : `${counts.pending} pending of ${counts.all} total.`
        }
        action={<AddLink href="/admin/businesses/new">Add business</AddLink>}
      />

      <BusinessPhotoReview reports={reports} />

      <div {...rise(1)} className={TOOLS}>
        <div className={TOOLS_ROW}>
          <AdminSearch placeholder="Search business, owner, email or city" label="Search businesses" />
          <SegLinks
            label="Filter by status"
            current={status}
            options={(
              [
                ['all', 'All'],
                ['pending', 'Pending'],
                ['approved', 'Approved'],
                ['rejected', 'Rejected'],
              ] as const
            ).map(([value, label]) => ({ value, label, count: counts[value], href: buildHref(PATH, params, { status: value }) }))}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyCard
          icon="building"
          title={counts.all === 0 ? 'No applications yet.' : 'No application matches.'}
          text={counts.all === 0 ? 'The form at /business/signup posts straight here.' : 'Try another search, or clear the filter.'}
        />
      ) : (
        <ul className="m-0 grid list-none content-start gap-3.5 p-0">
          {rows.map((row, index) => (
            <BusinessCard key={row.id} row={row} index={index} application={applications.get(row.id)} />
          ))}
        </ul>
      )}

      <AdminPagination
        path={PATH}
        params={params}
        page={page}
        pageSize={listing.pageSize}
        total={listing.total}
        noun={['business', 'businesses']}
      />
    </>
  )
}

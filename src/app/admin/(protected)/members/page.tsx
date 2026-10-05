// src/app/admin/(protected)/members/page.tsx
import { Users } from '@/components/ui/icons'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { MemberList } from '@/components/admin/MemberList'
import { flattenParams, pick } from '@/components/admin/list-params'
import { listMembersPage, toPage, toQuery, type MemberFilter, type MemberSort } from '@/lib/db/admin-queries'

/**
 * Everyone registered on Plug.pk, one page at a time.
 *
 * Search, filter, sort and page are URL parameters read here, so the database
 * returns twenty-five rows rather than the browser receiving every account's
 * email address to filter through.
 */

export const dynamic = 'force-dynamic'

const PATH = '/admin/members'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const filter = pick<MemberFilter>(params.filter, ['all', 'admins', 'business'], 'all')
  const sort = pick<MemberSort>(params.sort, ['recent', 'oldest', 'name'], 'recent')
  const page = toPage(params.page)

  const listing = await listMembersPage({ q, filter, sort, page })
  const { counts } = listing
  const filtered = q !== '' || filter !== 'all'

  return (
    <>
      <AdminHeader
        title="Members"
        help={
          <>
            <b>People who created an account on the site.</b> Real sign-ups, not
            invited users. Opening one shows the cars they added, the stations they
            saved and the clubs they joined. The admin role on an account is what
            grants access to this portal, and it is set on the member&rsquo;s page.
          </>
        }
        description={
          counts.all === 0
            ? 'Nobody has registered yet.'
            : `${counts.all.toLocaleString('en-PK')} account${counts.all === 1 ? '' : 's'} · ${counts.withBusiness} with a business listing · ${counts.admins} admin${counts.admins === 1 ? '' : 's'}.`
        }
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        {counts.all === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No members yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              Accounts created at /signup and through the business form appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
              <AdminSearch placeholder="Search by name, email, city or vehicle" label="Search members" />
              <AdminFilterChips
                label="Show"
                param="filter"
                current={filter}
                path={PATH}
                params={params}
                options={[
                  { value: 'all', label: 'Everyone', count: counts.all },
                  { value: 'admins', label: 'Admins only', count: counts.admins },
                  { value: 'business', label: 'Has a listing', count: counts.withBusiness },
                ]}
              />
              <AdminFilterChips
                label="Sort"
                param="sort"
                current={sort === 'recent' ? 'all' : sort}
                path={PATH}
                params={params}
                options={[
                  { value: 'all', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'name', label: 'Name' },
                ]}
              />
            </div>

            {listing.rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-ui-sm text-slate-500">
                {filtered ? 'No member matches that.' : 'Nothing on this page.'}
              </p>
            ) : (
              <MemberList members={listing.rows} />
            )}

            <AdminPagination
              path={PATH}
              params={params}
              page={page}
              pageSize={listing.pageSize}
              total={listing.total}
              noun={['member', 'members']}
            />
          </>
        )}
      </div>
    </>
  )
}

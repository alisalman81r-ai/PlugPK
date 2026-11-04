// src/app/admin/(protected)/members/members-view.tsx
import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { MemberList } from '@/components/admin/MemberList'
import type { ListParams } from '@/components/admin/list-params'
import { EmptyCard, Page, PageHead, k, plural, rise, s } from '@/components/admin/people/kit'
import type { MemberFilter, MemberListing, MemberSort } from '@/lib/db/admin-queries'

const PATH = '/admin/members'

/** The members list (members.html): toolbar, one card per account, pager. */
export function MembersView({
  listing,
  params,
  q,
  filter,
  sort,
  page,
}: {
  listing: MemberListing
  params: ListParams
  q: string
  filter: MemberFilter
  sort: MemberSort
  page: number
}) {
  const { counts } = listing
  const filtered = q !== '' || filter !== 'all'
  const tools = rise(1)

  return (
    <Page>
      <PageHead
        title="Members"
        help={
          <>
            <b>People who created an account on the site.</b> Real sign-ups, not invited users. Opening one shows the
            cars they added, the stations they saved and the clubs they joined. The admin role on an account is what
            grants access to this portal, and it is set on the member&rsquo;s page.
          </>
        }
        description={
          counts.all === 0
            ? 'Nobody has registered yet.'
            : `${plural(counts.all, 'account')} · ${counts.withBusiness} with a business listing · ${plural(counts.admins, 'admin')}.`
        }
      />

      {counts.all === 0 ? (
        <EmptyCard icon="users" title="No members yet." text="Accounts created at /signup and through the business form appear here." />
      ) : (
        <>
          <div className={k('card', 'tools', tools.className)} style={tools.style}>
            <div className={s.tools__row}>
              <AdminSearch placeholder="Search by name, email, city or vehicle" label="Search members" />
              <AdminFilterChips
                variant="seg"
                label="Who"
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
                variant="seg"
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
          </div>

          {listing.rows.length === 0 ? (
            <EmptyCard
              icon="search"
              title={filtered ? 'No member matches.' : 'Nothing on this page.'}
              text={filtered ? 'Try another search, or clear the filter.' : undefined}
            />
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
    </Page>
  )
}

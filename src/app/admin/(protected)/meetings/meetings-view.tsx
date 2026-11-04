// src/app/admin/(protected)/meetings/meetings-view.tsx
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MeetingStatusToggle } from '@/components/admin/MeetingStatusToggle'
import type { ListParams } from '@/components/admin/list-params'
import { EmptyCard, Ico, Page, PageHead, k, rise, s } from '@/components/admin/people/kit'
import type { MeetingListing } from '@/lib/db/admin-queries'
import { deleteMeeting, setMeetingStatus } from '@/lib/db/meeting-actions'
import { formatRelativeTime } from '@/lib/utils'

const PATH = '/admin/meetings'

/** Meeting requests (meetings.html): toolbar, one card per request, pager. */
export function MeetingsView({
  listing,
  params,
  status,
  page,
}: {
  listing: MeetingListing
  params: ListParams
  status: 'all' | 'new' | 'handled'
  page: number
}) {
  const { rows, counts } = listing
  const tools = rise(1)

  return (
    <Page>
      <PageHead
        title="Meeting requests"
        help={
          <>
            <b>Callback requests from businesses that want to partner with you.</b> Each row is a real person who filled
            in the partner form and is expecting to hear back. Marking one handled clears it from the dashboard queue.
          </>
        }
        description={counts.all === 0 ? 'Businesses asking to talk will appear here.' : `${counts.new} new of ${counts.all} total.`}
      />

      <div className={k('card', 'tools', tools.className)} style={tools.style}>
        <div className={s.tools__row}>
          <AdminSearch placeholder="Search company, name, email or note" label="Search meeting requests" />
          <AdminFilterChips
            variant="seg"
            label="Status"
            param="status"
            current={status}
            path={PATH}
            params={params}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'new', label: 'New', count: counts.new },
              { value: 'handled', label: 'Handled', count: counts.handled },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        counts.all === 0 ? (
          <EmptyCard icon="cal" title="No requests yet." text="The meeting form on Partner Up posts straight here.">
            <Link href="/partners#meeting" target="_blank" rel="noopener noreferrer" className={k('btn', 'btn--line', 'btn--sm')}>
              <Ico n="ext" />
              See the form
            </Link>
          </EmptyCard>
        ) : (
          <EmptyCard icon="search" title="No request matches." text="Try another search or status." />
        )
      ) : (
        <ul className={s.stack} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, index) => {
            const isNew = row.status === 'new'
            const r = rise(Math.min(index, 8))
            const pref = `${row.preferredDate ?? 'any date'}${row.preferredTime ? ` at ${row.preferredTime}` : ''}`
            const reply = `mailto:${row.email}?subject=${encodeURIComponent(`Meeting follow-up for ${row.company}`)}&body=${encodeURIComponent(
              `Hi ${row.name},\n\nThank you for requesting a meeting with plugpk. We would like to discuss your listing and confirm a suitable time.\n\nYour preferred timing was: ${pref}.\n\nPlease let us know what works for you.\n\nBest,\nplugpk`,
            )}`

            return (
              <li key={row.id} className={k('card', 'mt', isNew ? 'is-new' : 'is-done', r.className)} style={r.style}>
                <div className={s.mt__top}>
                  <div style={{ minWidth: 0 }}>
                    <h2 className={s.mt__name}>
                      {row.company}
                      {isNew ? (
                        <span className={k('pill', 'pill--warn')}>New</span>
                      ) : (
                        <span className={k('pill', 'pill--ok')}>
                          <Ico n="okc" />
                          Handled
                        </span>
                      )}
                    </h2>
                    <p className={s.mt__by}>
                      {row.name} ·{' '}
                      {row.user ? (
                        <>
                          sent by <Link href={`/admin/members/${row.user.id}`}>{row.user.name}</Link> ({row.user.email})
                        </>
                      ) : (
                        'sent without signing in'
                      )}
                    </p>

                    {/* Real links, so an operator can act without retyping. */}
                    <div className={s.meta}>
                      <a href={`mailto:${row.email}`}>
                        <Ico n="mail" />
                        {row.email}
                      </a>
                      {row.phone ? (
                        <a href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}>
                          <Ico n="tel" />
                          {row.phone}
                        </a>
                      ) : null}
                      {row.preferredDate || row.preferredTime ? (
                        <span className={s.pref}>
                          <Ico n="cal" />
                          Prefers {row.preferredDate ?? 'any day'}
                          {row.preferredTime ? ` at ${row.preferredTime}` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={s.mt__acts}>
                    {/* Always offered: the reply is how a request gets handled. */}
                    <a href={reply} className={k('btn', 'btn--ink', 'btn--sm')}>
                      <Ico n="mail" />
                      Reply
                    </a>
                    <MeetingStatusToggle
                      isHandled={!isNew}
                      action={async (next: 'new' | 'handled') => {
                        'use server'
                        return setMeetingStatus(row.id, next)
                      }}
                    />
                    <DeleteButton
                      variant="icon"
                      label={`the request from ${row.company}`}
                      action={async () => {
                        'use server'
                        return deleteMeeting(row.id)
                      }}
                    />
                  </div>
                </div>

                {row.note ? <p className={s.mt__note}>{row.note}</p> : null}
                <p className={s.mt__when} suppressHydrationWarning>
                  Requested {formatRelativeTime(row.createdAt)}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <AdminPagination path={PATH} params={params} page={page} pageSize={listing.pageSize} total={listing.total} noun={['request', 'requests']} />
    </Page>
  )
}

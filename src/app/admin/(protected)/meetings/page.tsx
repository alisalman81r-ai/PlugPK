// src/app/admin/(protected)/meetings/page.tsx
import { CalendarClock, Mail, Phone } from '@/components/ui/icons'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MeetingStatusToggle } from '@/components/admin/MeetingStatusToggle'
import { flattenParams, pick } from '@/components/admin/list-params'
import { listMeetingsPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { deleteMeeting, setMeetingStatus } from '@/lib/db/meeting-actions'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PATH = '/admin/meetings'

export default async function AdminMeetingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick(params.status, ['all', 'new', 'handled'] as const, 'all')
  const page = toPage(params.page)

  const listing = await listMeetingsPage({ q, status, page })
  const { rows, counts } = listing

  return (
    <>
      <AdminHeader
        title="Meeting requests"
        help={
          <>
            <b>Callback requests from businesses that want to partner with you.</b>{' '}
            Each row is a real person who filled in the partner form and is expecting to
            hear back. Marking one handled clears it from the dashboard queue.
          </>
        }
        description={
          counts.all === 0
            ? 'Businesses asking to talk will appear here.'
            : `${counts.new} new of ${counts.all} total.`
        }
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
          <AdminSearch placeholder="Search company, name, email or note" label="Search meeting requests" />
          <AdminFilterChips
            label="Filter by status"
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

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarClock size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">
              {counts.all === 0 ? 'No requests yet' : 'No request matches that'}
            </p>
            <p className="mt-1 text-ui-sm text-slate-500">
              {counts.all === 0 ? 'The meeting form at /partners#meeting posts straight here.' : 'Try another search or status.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const isNew = row.status === 'new'

              return (
                <li
                  key={row.id}
                  className={
                    isNew
                      ? 'rounded-xl border-l-4 border-l-amber-500 border-y border-r border-slate-200 bg-white p-5'
                      : 'rounded-xl border border-slate-200 bg-slate-50/60 p-5'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {row.company}
                        {isNew ? (
                          <span className="ml-2.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-ui-xs font-bold uppercase tracking-wide text-amber-800">
                            New
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-ui-sm text-slate-600">{row.name}</p>

                      {/* Real links, so an operator can act without retyping. */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1.5 text-ui-sm text-plug-blue-600 hover:underline"
                        >
                          <Mail size={13} className="shrink-0" aria-hidden="true" />
                          {row.email}
                        </a>
                        {row.phone ? (
                          <a
                            href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-ui-sm text-plug-blue-600 hover:underline"
                          >
                            <Phone size={13} className="shrink-0" aria-hidden="true" />
                            {row.phone}
                          </a>
                        ) : null}
                      </div>

                      {row.preferredDate || row.preferredTime ? (
                        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-ui-xs text-slate-700">
                          <CalendarClock size={12} className="shrink-0" aria-hidden="true" />
                          Prefers {row.preferredDate ?? 'any day'}
                          {row.preferredTime ? ` at ${row.preferredTime}` : ''}
                        </p>
                      ) : null}

                      {row.note ? (
                        <p className="mt-3 max-w-2xl whitespace-pre-wrap text-ui-sm leading-relaxed text-slate-600">
                          {row.note}
                        </p>
                      ) : null}

                      <p className="mt-3 text-ui-xs text-slate-400">
                        Requested {formatRelativeTime(row.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-start gap-2">
                      {/* Always offered. It used to appear only once the
                          request was marked handled — the reply is how it gets
                          handled, so it was hidden at the one moment it was
                          needed. */}
                      <a
                          href={`mailto:${row.email}?subject=${encodeURIComponent(`Meeting follow-up for ${row.company}`)}&body=${encodeURIComponent(`Hi ${row.name},\n\nThank you for requesting a meeting with Plug.pk. We would like to discuss your listing and confirm a suitable time.\n\nYour preferred timing was: ${row.preferredDate ?? 'any date'}${row.preferredTime ? ` at ${row.preferredTime}` : ''}.\n\nPlease let us know what works for you.\n\nBest,\nPlug.pk`)}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-plug-blue-600 px-3 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                        >
                          <Mail size={14} aria-hidden="true" />
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
                        label={`the request from ${row.company}`}
                        action={async () => {
                          'use server'
                          return deleteMeeting(row.id)
                        }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <AdminPagination
          path={PATH}
          params={params}
          page={page}
          pageSize={listing.pageSize}
          total={listing.total}
          noun={['request', 'requests']}
        />
      </div>
    </>
  )
}

// src/app/admin/(protected)/meetings/page.tsx
import { CalendarClock, Mail, Phone } from 'lucide-react'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { MeetingStatusToggle } from '@/components/admin/MeetingStatusToggle'
import { deleteMeeting, setMeetingStatus } from '@/lib/db/meeting-actions'
import { getMeetingRequests } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminMeetingsPage() {
  const rows = await getMeetingRequests()
  const newCount = rows.filter((row) => row.status === 'new').length

  return (
    <>
      <AdminHeader
        title="Meeting requests"
        description={
          rows.length === 0
            ? 'Businesses asking to talk will appear here.'
            : `${newCount} new of ${rows.length} total.`
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarClock size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No requests yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              The form on /for-businesses posts straight here.
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
                      ? 'rounded-xl border-l-4 border-l-plug-blue-600 border-y border-r border-slate-200 bg-white p-5'
                      : 'rounded-xl border border-slate-200 bg-slate-50/60 p-5'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {row.company}
                        {isNew ? (
                          <span className="ml-2.5 rounded-md bg-plug-blue-600 px-1.5 py-0.5 text-ui-xs font-bold uppercase tracking-wide text-white">
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

                    <div className="flex shrink-0 items-center gap-2">
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
      </div>
    </>
  )
}

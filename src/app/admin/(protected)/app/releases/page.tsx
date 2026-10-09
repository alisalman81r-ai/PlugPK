// src/app/admin/(protected)/app/releases/page.tsx
import { RefreshCw } from '@/components/ui/icons'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AppReleaseForm, AppReleaseRow } from '@/components/admin/AppReleaseForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { listAppReleases } from '@/lib/db/app-admin-queries'
import { createRelease, deleteRelease, sendRelease, updateRelease } from '@/lib/db/app-release-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))

export default async function AdminAppReleasesPage() {
  const releases = await listAppReleases()
  const lastSent = releases
    .filter((release) => release.sentAt)
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0]

  return (
    <>
      <AdminHeader
        title="App updates"
        backHref="/admin/app"
        help={
          <>
            <b>The mobile app&apos;s release log.</b> Write what an update changed and send it: the next time
            each user opens the app they see it once as &ldquo;What&apos;s new&rdquo;. A draft is seen by nobody.
            Editing a sent update changes the note for anyone who has not opened the app since.
          </>
        }
        description={
          lastSent?.sentAt
            ? `Last update sent ${formatRelativeTime(lastSent.sentAt)} — ${formatDate(lastSent.sentAt)}.`
            : 'No update has been sent to users yet.'
        }
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-1 text-ui font-bold text-slate-900">New update</h2>
          <p className="mb-5 text-ui-sm text-slate-500">
            Short and in plain words — this is what users read in the app.
          </p>
          <AppReleaseForm mode="create" action={createRelease} />
        </section>

        <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-wide text-slate-500">History</h2>
        {releases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <RefreshCw size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No updates yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">The first one you write appears here.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {releases.map((release) => {
              const isLatest = lastSent?.id === release.id
              return (
                <li
                  key={release.id}
                  className={cn(
                    'rounded-xl border bg-white p-5',
                    release.sentAt ? 'border-slate-200' : 'border-l-4 border-y-slate-200 border-r-slate-200 border-l-amber-500',
                  )}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-ui-xs font-bold text-slate-700">
                      {release.version}
                    </span>
                    <p className="font-semibold text-slate-900">{release.title}</p>
                    {release.sentAt ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-ui-xs font-semibold text-emerald-800">
                        Sent {formatDate(release.sentAt)}
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-ui-xs font-bold uppercase tracking-wide text-amber-800">
                        Draft
                      </span>
                    )}
                    {isLatest ? (
                      <span className="rounded-md bg-plug-blue-600 px-2 py-0.5 text-ui-xs font-semibold text-plug-cyan-300">
                        Showing in the app
                      </span>
                    ) : null}
                  </div>
                  <p className="mb-4 max-w-3xl whitespace-pre-wrap text-ui-sm leading-relaxed text-slate-600">{release.notes}</p>
                  <p className="mb-3 text-ui-xs text-slate-400">
                    Written {formatRelativeTime(release.createdAt)}
                    {release.createdBy ? ` by ${release.createdBy}` : ''}
                  </p>
                  <AppReleaseRow
                    release={release}
                    update={async (form: FormData) => {
                      'use server'
                      return updateRelease(release.id, form)
                    }}
                    send={async () => {
                      'use server'
                      return sendRelease(release.id)
                    }}
                  >
                    <DeleteButton
                      label={`update ${release.version}`}
                      action={async () => {
                        'use server'
                        return deleteRelease(release.id)
                      }}
                    />
                  </AppReleaseRow>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </>
  )
}

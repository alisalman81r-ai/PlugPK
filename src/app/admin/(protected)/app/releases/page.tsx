// src/app/admin/(protected)/app/releases/page.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AppReleaseForm, AppReleaseRow } from '@/components/admin/AppReleaseForm'
import { PanelEmpty } from '@/components/admin/DashboardPanel'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { listAppReleases } from '@/lib/db/app-admin-queries'
import { createRelease, deleteRelease, sendRelease, updateRelease } from '@/lib/db/app-release-actions'
import { formatRelativeTime } from '@/lib/utils'

/**
 * The mobile app's release log — the design's App updates
 * (admin/app-updates.html): a form for the next update, then the history.
 * Sending makes it the "What's new" note each user sees once; a draft is seen
 * by nobody.
 */

export const dynamic = 'force-dynamic'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))

export default async function AdminAppReleasesPage() {
  const releases = await listAppReleases()
  const lastSent = releases.filter((release) => release.sentAt).sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0]

  return (
    <>
      <AdminHeader
        title="App updates"
        backHref="/admin/app"
        help={
          <>
            <b>What users read as &ldquo;What&apos;s new&rdquo; in the app.</b> Write what an update changed and send it:
            the next time each user opens the app they see it once. A draft is seen by nobody. Editing a sent update
            changes the note for anyone who has not opened the app since.
          </>
        }
        description={
          lastSent?.sentAt
            ? `Last sent: version ${lastSent.version}, ${formatDate(lastSent.sentAt)}.`
            : 'No update has been sent to users yet.'
        }
      />

      <section className="card formc" data-in aria-labelledby="new-update">
        <h2 id="new-update">New update</h2>
        <p className="formc__sub">Short and in plain words — this is what users read in the app.</p>
        <AppReleaseForm mode="create" action={createRelease} />
      </section>

      <p className="sechead" data-in>
        History
      </p>
      {releases.length === 0 ? (
        <div className="card dash">
          <PanelEmpty icon="refresh" title="No updates yet." reason="The first one you write appears here." />
        </div>
      ) : (
        <div className="card" data-in>
          <ol className="rows">
            {releases.map((release) => (
              <AppReleaseRow
                key={release.id}
                release={release}
                badge={lastSent?.id === release.id ? <span className="live-tag">In the app</span> : null}
                meta={
                  <>
                    {release.sentAt ? `Sent ${formatDate(release.sentAt)}` : `Draft saved ${formatRelativeTime(release.createdAt)}`}
                    {release.createdBy ? ` · by ${release.createdBy}` : ''}
                  </>
                }
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
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

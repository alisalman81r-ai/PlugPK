// src/app/business/dashboard/page.tsx
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
  Zap,
} from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ChargerStatusBoard } from '@/components/business/host/ChargerStatusBoard'
import { listingHref } from '@/components/business/listing-state'
import { chargerLabel } from '@/lib/charger-host'
import type { PhotoStatus } from '@/lib/db/business-listing'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getApplications } from '@/lib/db/listing-application-queries'
import { applicationProgress, type StepState } from '@/lib/listing-application'
import { formatRelativeTime, cn } from '@/lib/utils'
import { safeHref } from '@/lib/validate'

/**
 * The owner's own listings.
 *
 * This page used to render MOCK_BUSINESS with invented view counts, click
 * counts, conversion rates and growth percentages — numbers no part of this
 * application measures. It now shows what is actually stored against the
 * signed-in account, and nothing else.
 *
 * It is also where the outcome of a review is read. No email is sent by this
 * application, so the status, the operator's reason when a listing was not
 * approved, and the state of each photo are shown here in full rather than
 * promised elsewhere.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Your listings' }

/** The address already used for every other written enquiry on the site. */
const SUPPORT = 'hello@plug.pk'

const STATUS = {
  pending: {
    label: 'Under review',
    note: 'Submitted and waiting to be checked by a person. It is not on the map yet — the outcome will appear here.',
    chip: 'bg-amber-100 text-amber-800',
    Icon: Clock,
  },
  approved: {
    label: 'Live on the map',
    note: 'Approved and visible to drivers at the coordinates below.',
    chip: 'bg-emerald-100 text-emerald-800',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Not approved',
    note: 'This listing was not approved. Editing it sends it back for another review.',
    chip: 'bg-red-100 text-red-800',
    Icon: XCircle,
  },
} as const

const PHOTO_STATE: Record<PhotoStatus, { label: string; tone: string }> = {
  pending: { label: 'Photo awaiting review', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  approved: { label: 'Photo approved', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  'needs-better-photo': {
    label: 'Needs a better photo',
    tone: 'border-red-200 bg-red-50 text-red-800',
  },
}

const STEP_STATE: Record<StepState, { label: string; tone: string }> = {
  done: { label: 'Complete', tone: 'text-emerald-700' },
  waiting: { label: 'Being confirmed', tone: 'text-amber-700' },
  missing: { label: 'Needed from you', tone: 'text-plug-blue-700' },
  refused: { label: 'Not accepted — send again', tone: 'text-red-700' },
}

function photoState(photo: string | undefined, status: PhotoStatus | undefined) {
  if (!photo) return { label: 'No photo yet', tone: 'border-slate-200 bg-slate-50 text-slate-600' }
  // A photo saved before review existed has no status; the listing being
  // approved was its review.
  return PHOTO_STATE[status ?? 'approved'] ?? PHOTO_STATE.pending
}

export default async function BusinessDashboardPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  // Gated on the server. A client-side check would render the page first and
  // hide it after, which is not a gate.
  const portal = await requireOwnerPortal('/business/dashboard', searchParams.listing)
  const { user, listings, listing: selected } = portal
  const applications = await getApplications(listings.map((item) => item.id))

  // The chosen listing first, then the rest in their usual order.
  const ordered = [selected, ...listings.filter((item) => item.id !== selected.id)]

  return (
    <BusinessDashboardLayout title="Your listings" subtitle={user.email} {...portalListings(portal)}>
      {/* The thing a host does most, first: say which chargers are working
          today. One tap per charger; drivers see it on the listing. */}
      {selected.chargers.length > 0 ? (
        <section aria-labelledby="charger-status" className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="charger-status" className="text-lg font-bold text-slate-900">
              Charger status today
            </h2>
            <p className="text-ui-sm text-slate-500">
              {listings.length > 1 ? `${selected.businessName} · ` : ''}Drivers see this on your listing
            </p>
          </div>
          <ChargerStatusBoard
            businessId={selected.id}
            chargers={selected.chargers.map((charger, index) => ({
              // The same positional id the server gives a charger saved before ids existed.
              id: charger.id ?? `c-legacy-${index}`,
              label: chargerLabel(charger, index),
              condition: charger.condition ?? null,
              conditionAt: charger.conditionAt ?? null,
            }))}
          />
        </section>
      ) : null}

      <ul className="flex flex-col gap-4">
        {ordered.map((business) => {
          const state = STATUS[business.status as keyof typeof STATUS] ?? STATUS.pending
          const totalPorts = business.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)
          const website = safeHref(business.website)
          const manage = (href: string) => listingHref(href, business.id, listings.length)
          const flagged = business.chargers.some(
            (charger) =>
              charger.photoStatus === 'needs-better-photo' || charger.portPhotoStatus === 'needs-better-photo',
          )
          const application = applications.get(business.id)
          const progress = application ? applicationProgress(application, business.businessType) : null
          const waitingOnOwner = business.status === 'pending' && progress?.needsOwner
          const chip = waitingOnOwner
            ? { label: 'Action needed', chip: 'bg-plug-blue-100 text-plug-blue-800', Icon: AlertTriangle }
            : state

          return (
            <li
              key={business.id}
              className={cn(
                'rounded-2xl border bg-white p-6',
                business.id === selected.id && listings.length > 1 ? 'border-plug-blue-200' : 'border-slate-200',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">{business.businessName}</h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-ui-sm text-slate-600">
                    <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {business.address ? `${business.address}, ` : ''}
                    {business.city}
                  </p>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-ui-sm font-semibold ${chip.chip}`}
                >
                  <chip.Icon size={14} className="shrink-0" aria-hidden="true" />
                  {chip.label}
                </span>
              </div>

              <p className="mt-3 text-ui-sm text-slate-500">
                {waitingOnOwner
                  ? progress?.payment === 'refused'
                    ? 'Your payment could not be confirmed. Send it again and the review carries on from where it stopped.'
                    : 'Not submitted for review yet — finish the verification and payment below and it goes straight to the review team.'
                  : state.note}
              </p>

              {/* Where the paid application stands. Shown for every listing
                  that has one, so a confirmed payment is visible as such and
                  not only the steps still to do. */}
              {progress ? (
                <div
                  className={cn(
                    'mt-4 rounded-xl border p-4',
                    progress.needsOwner && business.status !== 'approved'
                      ? 'border-plug-blue-200 bg-plug-blue-50/50'
                      : 'border-slate-200 bg-slate-50/60',
                  )}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Verification', Icon: ShieldCheck, state: progress.identity },
                      { label: 'Listing fee', Icon: Banknote, state: progress.payment },
                    ].map((step) => (
                      <div key={step.label} className="flex items-center gap-2.5">
                        <step.Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="text-ui-sm text-slate-600">{step.label}</span>
                        <span className={cn('ml-auto text-ui-sm font-semibold sm:ml-0', STEP_STATE[step.state].tone)}>
                          {STEP_STATE[step.state].label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {progress.paymentNote ? (
                    <p className="mt-3 flex items-start gap-2 text-ui-sm text-red-800">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {progress.paymentNote}
                    </p>
                  ) : null}
                  {progress.needsOwner && business.status !== 'approved' ? (
                    <Link
                      href={manage('/business/application')}
                      className="mt-4 inline-flex h-10 items-center rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
                    >
                      Complete your application
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {business.status === 'rejected' ? (
                <div role="note" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-ui-sm font-semibold text-red-900">Reason given by the reviewer</p>
                  <p className="mt-1 whitespace-pre-line text-ui-sm leading-relaxed text-red-800">
                    {business.reviewNote ?? 'No reason was recorded.'}
                  </p>
                  <p className="mt-3 text-ui-sm text-red-800">
                    Fix what is described above and save, or write to{' '}
                    <a
                      href={`mailto:${SUPPORT}?subject=${encodeURIComponent(`Listing: ${business.businessName}`)}`}
                      className="inline-flex items-center gap-1 font-semibold underline"
                    >
                      <Mail size={13} aria-hidden="true" />
                      {SUPPORT}
                    </a>{' '}
                    if you think this is wrong.
                  </p>
                </div>
              ) : null}

              {flagged && business.status !== 'rejected' ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-ui-sm text-red-800">
                  A reviewer asked for a better photo of at least one charger.{' '}
                  <Link href={manage('/business/chargers')} className="font-semibold underline">
                    Replace it on the Chargers page
                  </Link>
                  .
                </p>
              ) : null}

              <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Map pin</dt>
                  <dd className="mt-1 font-mono text-ui-sm text-slate-700">
                    {business.lat !== null && business.lng !== null
                      ? `${business.lat.toFixed(5)}, ${business.lng.toFixed(5)}`
                      : 'Not set — cannot appear on the map'}
                  </dd>
                </div>

                <div>
                  <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Contact</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-slate-700">
                    {business.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        {business.phone}
                      </span>
                    ) : null}
                    {/* safeHref, because a website stored before input was
                        checked could be a javascript: link. */}
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-plug-blue-600 hover:underline"
                      >
                        <Globe size={13} className="shrink-0" aria-hidden="true" />
                        Website
                      </a>
                    ) : null}
                    {!business.phone && !website ? '—' : null}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="mb-2.5 text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Chargers</p>

                {business.chargers.length === 0 ? (
                  <p className="text-ui-sm text-slate-500">None listed.</p>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-ui-xs font-semibold text-slate-700">
                      <Zap size={12} className="shrink-0" aria-hidden="true" />
                      {business.chargers.length} charger
                      {business.chargers.length === 1 ? '' : 's'} · {totalPorts} port
                      {totalPorts === 1 ? '' : 's'}
                    </span>

                    <ul className="mt-3 flex flex-col gap-2">
                      {business.chargers.map((charger, index) => {
                        const primary = photoState(charger.photo, charger.photoStatus)
                        const port = charger.portPhoto ? photoState(charger.portPhoto, charger.portPhotoStatus) : null
                        return (
                          <li
                            key={`${business.id}-c${index}`}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <span className="font-mono text-ui-xs text-slate-700">
                              {charger.connectorType} · {charger.maxPowerKw}kW ×{charger.ports}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-ui-xs font-medium ${primary.tone}`}>
                              {primary.label}
                            </span>
                            {port ? (
                              <span className={`rounded-full border px-2 py-0.5 text-ui-xs font-medium ${port.tone}`}>
                                Port: {port.label.replace(/^Photo /, '')}
                              </span>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-ui-sm">
                <Link href={manage('/business/profile')} className="font-semibold text-plug-blue-600 hover:underline">
                  Edit details
                </Link>
                <Link href={manage('/business/chargers')} className="font-semibold text-plug-blue-600 hover:underline">
                  Manage chargers
                </Link>
                <span className="ml-auto text-ui-xs text-slate-400">
                  Submitted {formatRelativeTime(business.createdAt)}
                  {business.reviewedAt && business.status !== 'pending'
                    ? ` · reviewed ${formatRelativeTime(business.reviewedAt)}`
                    : ''}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </BusinessDashboardLayout>
  )
}

// src/app/business/dashboard/page.tsx
import { CheckCircle2, Clock, Globe, Mail, MapPin, Phone, XCircle, Zap } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { listingHref } from '@/components/business/listing-state'
import type { PhotoStatus } from '@/lib/db/business-listing'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
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

  // The chosen listing first, then the rest in their usual order.
  const ordered = [selected, ...listings.filter((item) => item.id !== selected.id)]

  return (
    <BusinessDashboardLayout title="Your listings" subtitle={user.email} {...portalListings(portal)}>
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
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-ui-sm font-semibold ${state.chip}`}
                >
                  <state.Icon size={14} className="shrink-0" aria-hidden="true" />
                  {state.label}
                </span>
              </div>

              <p className="mt-3 text-ui-sm text-slate-500">{state.note}</p>

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

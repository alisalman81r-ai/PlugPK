// src/app/business/dashboard/page.tsx
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
  Zap,
} from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdmIcon } from '@/components/admin/admin-icons'
import { BizKpi } from '@/components/business/BizKpi'
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
    pill: 'pill--warn',
    Icon: Clock,
  },
  approved: {
    label: 'Live on the map',
    note: 'Approved and visible to drivers at the coordinates below.',
    pill: 'pill--ok',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Not approved',
    note: 'This listing was not approved. Editing it sends it back for another review.',
    pill: 'pill--bad',
    Icon: XCircle,
  },
} as const

const PHOTO_STATE: Record<PhotoStatus, { label: string; tone: string }> = {
  pending: { label: 'Photo awaiting review', tone: 'pill--warn' },
  approved: { label: 'Photo approved', tone: 'pill--ok' },
  'needs-better-photo': {
    label: 'Needs a better photo',
    tone: 'pill--bad',
  },
}

const STEP_STATE: Record<StepState, { label: string; tone: string }> = {
  done: { label: 'Complete', tone: 'is-done' },
  waiting: { label: 'Being confirmed', tone: 'is-wait' },
  missing: { label: 'Needed from you', tone: 'is-miss' },
  refused: { label: 'Not accepted — send again', tone: 'is-bad' },
}

function photoState(photo: string | undefined, status: PhotoStatus | undefined) {
  if (!photo) return { label: 'No photo yet', tone: 'pill--unk' }
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

  const live = listings.filter((item) => item.status === 'approved').length
  const reviewing = listings.filter((item) => item.status === 'pending').length
  const selectedPorts = selected.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)
  const many = listings.length > 1

  return (
    <BusinessDashboardLayout title="Your listings" subtitle={user.email} {...portalListings(portal)}>
      {/* Four figures, every one counted from the owner's own rows. */}
      <div className="biz-kpis">
        <BizKpi
          lit
          icon="pinl"
          label="Live on the map"
          value={live}
          suffix={many ? ` / ${listings.length}` : undefined}
          ring={listings.length ? live / listings.length : 0}
          note={
            <>
              <i className={cn('dot', live ? 'dot--ok' : 'dot--warn')} aria-hidden="true" />
              {live ? (live === 1 ? 'Drivers can find it' : 'Drivers can find them') : 'Not on the map yet'}
            </>
          }
        />
        <BizKpi
          icon="cal"
          label="Under review"
          value={reviewing}
          note={
            <>
              <i className={cn('dot', reviewing ? 'dot--warn' : 'dot--ok')} aria-hidden="true" />
              {reviewing ? 'Checked by a person' : 'Nothing waiting'}
            </>
          }
        />
        <BizKpi
          icon="bolt"
          label="Chargers"
          value={selected.chargers.length}
          note={many ? selected.businessName : 'On this listing'}
        />
        <BizKpi icon="plug" label="Ports" value={selectedPorts} note="Cars that can charge at once" />
      </div>

      {/* The thing a host does most, first: say which chargers are working
          today. One tap per charger; drivers see it on the listing. */}
      {selected.chargers.length > 0 ? (
        <section aria-labelledby="charger-status" className="card">
          <div className="chead">
            <div className="min-w-0">
              <h2 id="charger-status">Charger status today</h2>
              <p>{many ? `${selected.businessName} · ` : ''}Drivers see this on your listing</p>
            </div>
            <span className="live" style={{ marginTop: 0 }}>
              <span className="pulse" aria-hidden="true" />
              Shown to drivers
            </span>
          </div>
          <div className="cbody">
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
          </div>
        </section>
      ) : null}

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
        const chip = waitingOnOwner ? { label: 'Action needed', pill: 'pill--warn', Icon: AlertTriangle } : state
        const ownerTurn = progress?.needsOwner && business.status !== 'approved'

        return (
          <article
            key={business.id}
            aria-labelledby={`listing-${business.id}`}
            className={cn('card lift', business.id === selected.id && many && 'is-picked')}
          >
            <div className="chead">
              <div className="min-w-0">
                <h2 id={`listing-${business.id}`}>{business.businessName}</h2>
                <p className="addr">
                  <MapPin aria-hidden="true" />
                  {business.address ? `${business.address}, ` : ''}
                  {business.city}
                </p>
              </div>
              <span className={cn('pill', chip.pill)}>
                <chip.Icon aria-hidden="true" />
                {chip.label}
              </span>
            </div>

            <div className="cbody biz-stack">
              <p className="biz-muted">
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
                <div className="biz-stack">
                  <div className="steps">
                    {[
                      { label: 'Verification', Icon: ShieldCheck, state: progress.identity },
                      { label: 'Listing fee', Icon: Banknote, state: progress.payment },
                    ].map((step) => (
                      <div key={step.label} className={cn('stepc', STEP_STATE[step.state].tone)}>
                        <span className="stepc__ico">
                          <step.Icon aria-hidden="true" />
                        </span>
                        <span>
                          {step.label}
                          <b>{STEP_STATE[step.state].label}</b>
                        </span>
                      </div>
                    ))}
                  </div>
                  {progress.paymentNote ? (
                    <p className="note note--bad">
                      <AlertTriangle aria-hidden="true" />
                      <span>{progress.paymentNote}</span>
                    </p>
                  ) : null}
                  {ownerTurn ? (
                    <div className="note note--act">
                      <AlertTriangle aria-hidden="true" />
                      <span className="biz-grow">
                        <b>Your turn</b>
                        The review starts as soon as your verification and payment are in.
                      </span>
                      <Link href={manage('/business/application')} className="btn btn--volt btn--sm">
                        Complete your application
                        <AdmIcon name="arrow" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {business.status === 'rejected' ? (
                <div role="note" className="note note--bad">
                  <XCircle aria-hidden="true" />
                  <span>
                    <b>Reason given by the reviewer</b>
                    <span className="biz-pre">{business.reviewNote ?? 'No reason was recorded.'}</span>
                    <span className="biz-block">
                      Fix what is described above and save, or write to{' '}
                      <a href={`mailto:${SUPPORT}?subject=${encodeURIComponent(`Listing: ${business.businessName}`)}`}>
                        {SUPPORT}
                      </a>{' '}
                      if you think this is wrong.
                    </span>
                  </span>
                </div>
              ) : null}

              {flagged && business.status !== 'rejected' ? (
                <p className="note note--bad">
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    A reviewer asked for a better photo of at least one charger.{' '}
                    <Link href={manage('/business/chargers')}>Replace it on the Chargers page</Link>.
                  </span>
                </p>
              ) : null}
            </div>

            <div className="sec">
              <dl className="dl">
                <div>
                  <dt>Map pin</dt>
                  <dd className="mono">
                    {business.lat !== null && business.lng !== null
                      ? `${business.lat.toFixed(5)}, ${business.lng.toFixed(5)}`
                      : 'Not set — cannot appear on the map'}
                  </dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {business.phone ? (
                      <span className="ic">
                        <Phone aria-hidden="true" />
                        {business.phone}
                      </span>
                    ) : null}
                    {/* safeHref, because a website stored before input was
                        checked could be a javascript: link. */}
                    {website ? (
                      <a href={website} target="_blank" rel="noreferrer noopener" className="link">
                        <Globe aria-hidden="true" />
                        Website
                      </a>
                    ) : null}
                    {!business.phone && !website ? '—' : null}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="sec">
              <p className="sec__lab">Chargers</p>
              {business.chargers.length === 0 ? (
                <p className="biz-muted">None listed.</p>
              ) : (
                <>
                  <span className="ctag">
                    <Zap aria-hidden="true" />
                    {business.chargers.length} charger{business.chargers.length === 1 ? '' : 's'} · {totalPorts} port
                    {totalPorts === 1 ? '' : 's'}
                  </span>
                  <ul className="crow">
                    {business.chargers.map((charger, index) => {
                      const primary = photoState(charger.photo, charger.photoStatus)
                      const port = charger.portPhoto ? photoState(charger.portPhoto, charger.portPhotoStatus) : null
                      return (
                        <li key={`${business.id}-c${index}`}>
                          <span className="crow__spec">
                            {charger.connectorType} · {charger.maxPowerKw}kW ×{charger.ports}
                          </span>
                          <span className={cn('pill', primary.tone)}>{primary.label}</span>
                          {port ? (
                            <span className={cn('pill', port.tone)}>Port: {port.label.replace(/^Photo /, '')}</span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>

            <div className="cfoot">
              <Link href={manage('/business/profile')} className="btn btn--ink btn--sm">
                <AdmIcon name="pen" />
                Edit details
              </Link>
              <Link href={manage('/business/chargers')} className="btn btn--line btn--sm">
                <AdmIcon name="bolt" />
                Manage chargers
              </Link>
              <span className="cfoot__meta">
                Submitted {formatRelativeTime(business.createdAt)}
                {business.reviewedAt && business.status !== 'pending'
                  ? ` · reviewed ${formatRelativeTime(business.reviewedAt)}`
                  : ''}
              </span>
            </div>
          </article>
        )
      })}
    </BusinessDashboardLayout>
  )
}

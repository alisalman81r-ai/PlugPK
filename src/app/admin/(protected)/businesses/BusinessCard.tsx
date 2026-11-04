// src/app/admin/(protected)/businesses/BusinessCard.tsx
import Link from 'next/link'

import { BusinessStatusControl, type BusinessStatus } from '@/components/admin/BusinessStatusControl'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { ListingApplicationPanel } from '@/components/admin/ListingApplicationPanel'
import { CARD, Ico, META, Note, PANEL, Pill, ReviewPill, btnClass, rise } from '@/components/admin/network-kit'
import type { AdminBusinessRow } from '@/lib/db/admin-queries'
import { deleteBusiness, setBusinessStatus } from '@/lib/db/business-actions'
import { validateForApproval, type ListingCharger } from '@/lib/db/business-listing'
import type { ApplicationDetail } from '@/lib/db/listing-application-queries'
import { applicationProblem, applicationProgress } from '@/lib/listing-application'
import { cn, formatRelativeTime } from '@/lib/utils'
import { safeHref } from '@/lib/validate'

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  mall: 'Shopping mall',
  office: 'Office',
  dealership: 'Dealership',
  'service-center': 'Service centre',
  home: 'Home charger',
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** A charger photo, or the dashed frame that says it is missing (.chg__pics). */
function Pic({
  src,
  alt,
  caption,
  missing,
  tone,
}: {
  src?: string | null
  alt: string
  caption: string
  missing: string
  tone?: 'bad'
}) {
  return (
    <figure className="m-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="block aspect-[4/3] w-full rounded-xl object-cover" />
      ) : (
        <span
          className={cn(
            'grid aspect-[4/3] w-full place-content-center place-items-center gap-1.5 rounded-xl border-[1.5px] border-dashed px-2 text-center text-[13px]',
            tone === 'bad'
              ? 'border-[rgba(255,90,31,.35)] bg-[rgba(255,90,31,.06)] text-[#b23b0d]'
              : 'border-ink/15 bg-chalk text-muted',
          )}
        >
          <Ico name="img" className={cn('h-[22px] w-[22px]', tone === 'bad' ? 'text-[#b23b0d]' : 'text-fog')} />
          {missing}
        </span>
      )}
      <figcaption className="mt-1.5 text-xs text-muted">{caption}</figcaption>
    </figure>
  )
}

/** One application on the businesses list (.card.biz): who, where, the chargers and the decision. */
export function BusinessCard({
  row,
  index,
  application,
}: {
  row: AdminBusinessRow
  index: number
  application?: ApplicationDetail
}) {
  const isPending = row.status === 'pending'
  const totalPorts = row.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)
  const website = safeHref(row.website)
  const approveBlocked = isPending
    ? (validateForApproval({ lat: row.lat, lng: row.lng, chargers: row.chargers as ListingCharger[] }) ??
      (application ? applicationProblem(application, row.businessType) : null))
    : null
  const ownerUnfinished = isPending && application ? applicationProgress(application, row.businessType).needsOwner : false

  const edit = (
    <Link href={`/admin/businesses/${row.id}`} className={btnClass('line', 'sm')}>
      <Ico name="pen" />
      Edit
    </Link>
  )

  return (
    <li key={row.id} {...rise(Math.min(index, 6) + 2)} className={cn(CARD, 'p-6 max-[640px]:p-[18px]')}>
      <div className="flex flex-wrap justify-between gap-5">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 className="m-0 flex flex-wrap items-center gap-3 font-display text-2xl font-normal leading-[1.2] text-ink">
            {row.businessName}
            <ReviewPill status={row.status} />
            {/* Started but not finished by the owner: nothing to
                    decide yet, and said so before anyone opens it. */}
            {ownerUnfinished ? (
              <Pill tone="unk" icon="clock">
                Waiting for owner
              </Pill>
            ) : null}
          </h2>
          <p className="mb-0 mt-1.5 text-sm text-muted">
            {row.ownerName} · {TYPE_LABEL[row.businessType] ?? row.businessType}
          </p>

          {/* Real links, so an operator can act without retyping. */}
          <div className={META}>
            <a
              href={`mailto:${row.email}`}
              className="inline-flex items-center gap-1.5 text-muted no-underline transition-colors hover:text-ink"
            >
              <Ico name="mail" />
              {row.email}
            </a>
            {row.phone ? (
              <a
                href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-muted no-underline transition-colors hover:text-ink"
              >
                <Ico name="phone" />
                {row.phone}
              </a>
            ) : null}
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-muted no-underline transition-colors hover:text-ink"
              >
                <Ico name="globe" />
                Website
              </a>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Ico name="pinl" />
              {row.address ? `${row.address}, ` : ''}
              {row.city}
              {/* Stated rather than implied. An approved listing with
                      no pin is invisible on the map. */}
              {row.lat !== null && row.lng !== null ? (
                <span className="font-mono text-xs text-fog">
                  · {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                </span>
              ) : null}
            </span>
          </div>

          {row.lat === null || row.lng === null ? (
            <p className="mb-0 mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8a5a00] [&_svg]:h-[15px] [&_svg]:w-[15px]">
              <Ico name="alert" />
              No coordinates — cannot appear on the map.
            </p>
          ) : null}

          {/* The reason it was turned down, so the next operator
                  does not have to guess or ask. */}
          {row.status === 'rejected' && row.reviewNote ? (
            <Note>
              <b className="font-semibold">Rejected{row.reviewedAt ? ` ${formatRelativeTime(row.reviewedAt)}` : ''}:</b>{' '}
              {row.reviewNote}
            </Note>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {isPending ? null : edit}
          <BusinessStatusControl
            status={row.status as BusinessStatus}
            approveBlockedReason={approveBlocked}
            action={async (next: BusinessStatus, note?: string) => {
              'use server'
              return setBusinessStatus(row.id, next, note)
            }}
          />
          {isPending ? edit : null}
          <DeleteButton
            label={`the application from ${row.businessName}`}
            consequence="its reviews, daily view statistics, photo reports, charger photos, verification documents and payment records"
            action={async () => {
              'use server'
              return deleteBusiness(row.id)
            }}
          />
        </div>
      </div>

      {row.chargers.length > 0 ? (
        <div className={cn(PANEL, 'mt-5')}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
            <b className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink [&_svg]:h-[17px] [&_svg]:w-[17px]">
              <Ico name="bolt" />
              Charger details
            </b>
            <span>
              {plural(row.chargers.length, 'charger')} · {plural(totalPorts, 'port')}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] gap-3.5">
            {row.chargers.map((charger, i) => (
              <div key={`${row.id}-c${i}`} className="rounded-2xl border border-ink/[.09] bg-white p-4">
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <b className="block font-semibold text-ink">Charger {i + 1}</b>
                    <span className="font-mono text-[13px] text-muted">
                      {charger.connectorType} · {charger.maxPowerKw} kW · {plural(charger.ports, 'port')}
                    </span>
                  </div>
                  {charger.photoStatus === 'approved' ? (
                    <Pill tone="ok">Photo approved</Pill>
                  ) : charger.photoStatus === 'needs-better-photo' ? (
                    <Pill tone="bad">Needs better photo</Pill>
                  ) : (
                    <Pill tone="warn">Photo pending</Pill>
                  )}
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                  <Pic
                    src={charger.photo}
                    alt={`Charger ${i + 1}`}
                    caption="Charger photo"
                    missing="Primary photo missing"
                    tone="bad"
                  />
                  <Pic
                    src={charger.portPhoto}
                    alt={`Port type for charger ${i + 1}`}
                    caption="Connector close-up"
                    missing="No port close-up"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mb-0 mt-4 text-[13px] text-fog">No chargers listed.</p>
      )}

      {application ? (
        <ListingApplicationPanel application={application} businessType={row.businessType} listingStatus={row.status} />
      ) : null}

      <p className="mb-0 mt-3.5 text-[13px] text-fog">Applied {formatRelativeTime(row.createdAt)}</p>
    </li>
  )
}

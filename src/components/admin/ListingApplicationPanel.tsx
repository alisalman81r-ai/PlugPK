// src/components/admin/ListingApplicationPanel.tsx
import type * as React from 'react'

import type { ApplicationDetail } from '@/lib/db/listing-application-queries'
import { reviewListingPayment } from '@/lib/db/listing-application-actions'
import {
  applicationProgress,
  DOCUMENT_LABEL,
  formatPkr,
  idTypeFor,
  licenceKindLabel,
  PAYMENT_METHOD_LABEL,
  REQUIRED_DOCUMENTS,
  type DocumentKind,
  type PaymentMethod,
} from '@/lib/listing-application'
import { cn, formatRelativeTime } from '@/lib/utils'

import { Ico, PANEL, Pill, type PillTone } from './network-kit'
import { PaymentReviewControl } from './PaymentReviewControl'

const PAYMENT_BADGE: Record<string, { label: string; tone: PillTone }> = {
  submitted: { label: 'To confirm', tone: 'warn' },
  verified: { label: 'Confirmed', tone: 'ok' },
  rejected: { label: 'Not received', tone: 'bad' },
}

function DocumentLink({ id, kind, mimeType }: { id: string; kind: string; mimeType: string }) {
  const isImage = mimeType.startsWith('image/')
  const label = DOCUMENT_LABEL[kind as DocumentKind] ?? kind
  return (
    <a
      href={`/api/business-documents/${id}`}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-xl border border-ink/[.09] bg-white no-underline transition-colors duration-200 hover:border-ink"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/business-documents/${id}`} alt={label} loading="lazy" className="block aspect-[16/10] w-full object-cover" />
      ) : (
        <span className="grid aspect-[16/10] w-full place-items-center bg-chalk font-mono text-sm font-semibold text-muted">PDF</span>
      )}
      <span className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-muted transition-colors group-hover:text-ink">
        {label}
        <Ico name="ext" className="h-3.5 w-3.5" />
      </span>
    </a>
  )
}

/** A label and its value, on one line (the panel's dl rows). */
function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-t border-ink/[.06] py-1.5 first:border-t-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={cn('m-0 text-right text-ink', mono ? 'font-mono font-semibold' : 'font-medium')}>{children}</dd>
    </div>
  )
}

const HEAD = 'inline-flex items-center gap-2 text-[15px] font-semibold text-ink [&_svg]:h-[17px] [&_svg]:w-[17px]'

/**
 * The private half of an application, for the reviewer: who the owner says
 * they are, the documents that prove it, and the listing-fee payment to match
 * against the account statement. Documents open through the authenticated
 * route; nothing here is a public URL.
 */
export function ListingApplicationPanel({
  application,
  businessType,
  listingStatus,
}: {
  application: ApplicationDetail
  businessType: string
  listingStatus: string
}) {
  const idType = idTypeFor(businessType)
  const progress = applicationProgress(application, businessType)
  const identityDocs = application.documentFiles.filter((doc) => REQUIRED_DOCUMENTS[idType].includes(doc.kind as DocumentKind))
  const receipt = application.documentFiles.find((doc) => doc.kind === 'payment-receipt')
  const [payment, ...earlier] = application.paymentRecords
  const badge = payment ? PAYMENT_BADGE[payment.status] ?? PAYMENT_BADGE.submitted : null

  return (
    <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
      {/* Verification */}
      <section className={PANEL}>
        <p className={cn(HEAD, 'mb-3 mt-0')}>
          <Ico name="shield" />
          {idType === 'cnic' ? 'Owner identity (CNIC)' : 'Business verification'}
        </p>
        {application.idNumber && application.idType === idType ? (
          <dl className="mb-3 mt-0 text-sm">
            {idType === 'licence' ? <Row label="Document">{licenceKindLabel(application.idDetail)}</Row> : null}
            <Row label="Number" mono>
              {application.idNumber}
            </Row>
            {/* To check against the scan. Not where the chargers are — that is
                the listing's own address above. */}
            <Row label={idType === 'cnic' ? 'Address on CNIC' : 'Registered address'}>{application.idAddress ?? '—'}</Row>
          </dl>
        ) : (
          <p className="mb-3 mt-0 text-sm font-medium text-[#8a5a00]">Not supplied yet.</p>
        )}
        {identityDocs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {identityDocs.map((doc) => (
              <DocumentLink key={doc.id} id={doc.id} kind={doc.kind} mimeType={doc.mimeType} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Payment */}
      <section className={PANEL}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className={cn(HEAD, 'm-0')}>
            <Ico name="cash" />
            Listing fee
          </p>
          {badge ? <Pill tone={badge.tone}>{badge.label}</Pill> : null}
        </div>

        {payment ? (
          <>
            <dl className="m-0 text-sm">
              <Row label="Amount" mono>
                {formatPkr(payment.amount)}
              </Row>
              <Row label="Method">{PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method}</Row>
              <Row label="Paid by">{payment.payerName}</Row>
              <Row label="Transaction ID" mono>
                {payment.reference}
              </Row>
              <Row label="Paid on">{payment.paidOn}</Row>
            </dl>
            {payment.status === 'rejected' && payment.reviewNote ? (
              <p className="mb-0 mt-2.5 rounded-xl border border-[rgba(255,90,31,.2)] bg-[rgba(255,90,31,.06)] px-3 py-2 text-[13px] text-[#8f2f0a]">
                <b className="font-semibold">Told the owner:</b> {payment.reviewNote}
              </p>
            ) : null}
            {receipt ? (
              <div className="mt-3 w-1/2">
                <DocumentLink id={receipt.id} kind={receipt.kind} mimeType={receipt.mimeType} />
              </div>
            ) : null}
            {listingStatus !== 'approved' ? (
              <div className="mt-3.5">
                <PaymentReviewControl
                  status={payment.status}
                  action={async (decision: 'verified' | 'rejected', note?: string) => {
                    'use server'
                    return reviewListingPayment(payment.id, decision, note)
                  }}
                />
              </div>
            ) : null}
            {earlier.length > 0 ? (
              <p className="mb-0 mt-3 text-xs text-fog">
                {earlier.length} earlier attempt{earlier.length === 1 ? '' : 's'}, last refused{' '}
                {earlier[0]?.reviewedAt ? formatRelativeTime(earlier[0].reviewedAt) : ''}.
              </p>
            ) : null}
          </>
        ) : (
          <p className="m-0 text-sm font-medium text-[#8a5a00]">
            {progress.identity === 'done' ? 'No payment submitted yet.' : 'Waiting for the owner to finish the application.'}
          </p>
        )}
      </section>
    </div>
  )
}

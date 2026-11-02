// src/components/admin/ListingApplicationPanel.tsx
import { Banknote, ExternalLink, ShieldCheck } from '@/components/ui/icons'

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

import { PaymentReviewControl } from './PaymentReviewControl'

const PAYMENT_BADGE: Record<string, { label: string; tone: string }> = {
  submitted: { label: 'To confirm', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  verified: { label: 'Confirmed', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Not received', tone: 'bg-red-50 text-red-800 border-red-200' },
}

function DocumentLink({ id, kind, mimeType }: { id: string; kind: string; mimeType: string }) {
  const isImage = mimeType.startsWith('image/')
  return (
    <a
      href={`/api/business-documents/${id}`}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-plug-blue-300"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/business-documents/${id}`} alt={DOCUMENT_LABEL[kind as DocumentKind] ?? kind} className="aspect-[16/10] w-full object-cover" />
      ) : (
        <span className="flex aspect-[16/10] w-full items-center justify-center bg-slate-50 text-ui-sm font-bold text-slate-500">PDF</span>
      )}
      <span className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 group-hover:text-plug-blue-700">
        {DOCUMENT_LABEL[kind as DocumentKind] ?? kind}
        <ExternalLink size={11} aria-hidden="true" />
      </span>
    </a>
  )
}

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
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {/* Verification */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="mb-3 inline-flex items-center gap-1.5 text-ui-sm font-bold text-slate-800">
          <ShieldCheck size={14} className="text-plug-blue-600" aria-hidden="true" />
          {idType === 'cnic' ? 'Owner identity (CNIC)' : 'Business verification'}
        </p>
        {application.idNumber && application.idType === idType ? (
          <dl className="mb-3 text-ui-sm">
            {idType === 'licence' ? (
              <div className="flex justify-between gap-3 py-0.5">
                <dt className="text-slate-500">Document</dt>
                <dd className="text-right font-medium text-slate-900">{licenceKindLabel(application.idDetail)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 py-0.5">
              <dt className="text-slate-500">Number</dt>
              <dd className="font-mono font-semibold text-slate-900">{application.idNumber}</dd>
            </div>
            {/* To check against the scan. Not where the chargers are — that is
                the listing's own address above. */}
            <div className="flex justify-between gap-3 py-0.5">
              <dt className="shrink-0 text-slate-500">{idType === 'cnic' ? 'Address on CNIC' : 'Registered address'}</dt>
              <dd className="text-right font-medium text-slate-900">{application.idAddress ?? '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="mb-3 text-ui-sm font-semibold text-amber-700">Not supplied yet.</p>
        )}
        {identityDocs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {identityDocs.map((doc) => (
              <DocumentLink key={doc.id} id={doc.id} kind={doc.kind} mimeType={doc.mimeType} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Payment */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-ui-sm font-bold text-slate-800">
            <Banknote size={14} className="text-plug-blue-600" aria-hidden="true" />
            Listing fee
          </p>
          {badge ? (
            <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', badge.tone)}>{badge.label}</span>
          ) : null}
        </div>

        {payment ? (
          <>
            <dl className="text-ui-sm">
              {[
                ['Amount', formatPkr(payment.amount)],
                ['Method', PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method],
                ['Paid by', payment.payerName],
                ['Transaction ID', payment.reference],
                ['Paid on', payment.paidOn],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-0.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className={cn('text-right text-slate-900', label === 'Transaction ID' ? 'font-mono font-semibold' : 'font-medium')}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {payment.status === 'rejected' && payment.reviewNote ? (
              <p className="mt-2 rounded-lg border border-red-100 bg-red-50/70 px-3 py-2 text-ui-xs text-red-900">
                <span className="font-semibold">Told the owner:</span> {payment.reviewNote}
              </p>
            ) : null}
            {receipt ? (
              <div className="mt-3 w-1/2">
                <DocumentLink id={receipt.id} kind={receipt.kind} mimeType={receipt.mimeType} />
              </div>
            ) : null}
            {listingStatus !== 'approved' ? (
              <div className="mt-3">
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
              <p className="mt-3 text-[11px] text-slate-400">
                {earlier.length} earlier attempt{earlier.length === 1 ? '' : 's'}, last refused{' '}
                {earlier[0]?.reviewedAt ? formatRelativeTime(earlier[0].reviewedAt) : ''}.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-ui-sm font-semibold text-amber-700">
            {progress.identity === 'done' ? 'No payment submitted yet.' : 'Waiting for the owner to finish the application.'}
          </p>
        )}
      </section>
    </div>
  )
}

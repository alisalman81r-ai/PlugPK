// src/components/business/application/ApplicationForm.tsx
'use client'

import { AlertTriangle, Check, CheckCircle2, Clock, ShieldCheck } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { AdmIcon } from '@/components/admin/admin-icons'
import type { ApplicationPayment } from '@/lib/db/listing-application-queries'
import {
  formatPkr,
  PAYMENT_METHOD_LABEL,
  type ApplicationProgress,
  type IdType,
  type PaymentMethod,
} from '@/lib/listing-application'
import { cn } from '@/lib/utils'

import { EMPTY_IDENTITY, IdentityFields, identityProblem, type IdentityDraft } from './IdentityFields'
import { emptyPayment, PaymentFields, paymentProblem, type PaymentAccountView, type PaymentDraft } from './PaymentFields'
import { sendApplication } from './send-application'

export interface ApplicationFormProps {
  businessId: string
  listingStatus: string
  idType: IdType
  progress: ApplicationProgress
  /** "CNIC •••••-••••567-1" or the licence, when one is on record. */
  identitySummary: string | null
  onFile: string[]
  payment: ApplicationPayment | null
  fee: number
  accounts: PaymentAccountView[]
}

const STEP_BADGE = {
  done: { label: 'Complete', pill: 'pill--ok', Icon: CheckCircle2 },
  waiting: { label: 'Being checked', pill: 'pill--warn', Icon: Clock },
  todo: { label: 'Action needed', pill: 'pill--warn', Icon: AlertTriangle },
  refused: { label: 'Not accepted', pill: 'pill--bad', Icon: AlertTriangle },
} as const

function StepHeader({
  id,
  number,
  title,
  state,
}: {
  id: string
  number: number
  title: string
  state: keyof typeof STEP_BADGE
}) {
  const badge = STEP_BADGE[state]
  return (
    <div className="chead">
      <h2 id={id}>
        <span className={cn('stepn', state === 'done' && 'is-done')} aria-hidden="true">
          {state === 'done' ? <Check size={15} /> : number}
        </span>
        {title}
      </h2>
      <span className={cn('pill', badge.pill)}>
        <badge.Icon aria-hidden="true" />
        {badge.label}
      </span>
    </div>
  )
}

/** The design's ink button, with the spinner it shows while sending. */
function SaveButton({
  busy,
  disabled,
  onClick,
  children,
}: {
  busy: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={cn('btn btn--ink', busy && 'is-busy')}
      disabled={disabled}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      {busy ? <AdmIcon name="loader" className="spin" /> : <AdmIcon name="check" />}
      {children}
    </button>
  )
}

/**
 * The two halves of a paid application, each saved on its own: an owner who
 * only needs to resend a payment is not made to re-upload their CNIC.
 */
export function ApplicationForm({
  businessId,
  listingStatus,
  idType,
  progress,
  identitySummary,
  onFile,
  payment,
  fee,
  accounts,
}: ApplicationFormProps) {
  const router = useRouter()
  const sent = React.useRef(new WeakSet<File>())
  const approved = listingStatus === 'approved'
  // A receipt on file only stands for a payment still waiting to be checked;
  // a new attempt after a refusal needs its own.
  const receiptReusable = onFile.includes('payment-receipt') && progress.payment === 'waiting'

  const [identity, setIdentity] = React.useState<IdentityDraft>(EMPTY_IDENTITY)
  const [editingIdentity, setEditingIdentity] = React.useState(progress.identity !== 'done')
  const [paymentDraft, setPaymentDraft] = React.useState<PaymentDraft>(emptyPayment)
  const [editingPayment, setEditingPayment] = React.useState(progress.payment === 'missing' || progress.payment === 'refused')

  const [busy, setBusy] = React.useState<'identity' | 'payment' | null>(null)
  const [message, setMessage] = React.useState<{ part: 'identity' | 'payment'; tone: 'error' | 'ok'; text: string } | null>(null)
  const [progressText, setProgressText] = React.useState<string | null>(null)

  const save = async (part: 'identity' | 'payment') => {
    const problem =
      part === 'identity' ? identityProblem(idType, identity, onFile) : paymentProblem(paymentDraft, receiptReusable)
    if (problem) {
      setMessage({ part, tone: 'error', text: problem })
      return
    }
    setBusy(part)
    setMessage(null)
    try {
      const result = await sendApplication(
        businessId,
        part === 'identity' ? { idType, identity } : { idType, payment: paymentDraft },
        sent.current,
        setProgressText,
      )
      if (!result.ok) {
        setMessage({ part, tone: 'error', text: result.message ?? 'Could not save. Please try again.' })
        return
      }
      setMessage({
        part,
        tone: 'ok',
        text: part === 'identity' ? 'Verification details saved.' : 'Payment sent for confirmation.',
      })
      if (part === 'identity') setEditingIdentity(false)
      else setEditingPayment(false)
      router.refresh()
    } catch {
      setMessage({ part, tone: 'error', text: 'Could not reach plugpk. Check your connection and try again.' })
    } finally {
      setBusy(null)
      setProgressText(null)
    }
  }

  const note = (part: 'identity' | 'payment') =>
    message?.part === part ? (
      <p role={message.tone === 'error' ? 'alert' : 'status'} className={cn('note', message.tone === 'error' ? 'note--bad' : 'note--ok')} style={{ marginTop: 16 }}>
        <AdmIcon name={message.tone === 'error' ? 'alert' : 'okc'} />
        <span>{message.text}</span>
      </p>
    ) : null

  const paymentState =
    progress.payment === 'done' ? 'done' : progress.payment === 'waiting' ? 'waiting' : progress.payment === 'refused' ? 'refused' : 'todo'

  return (
    <>
      {!progress.needsOwner ? (
        <p className="note note--ok narrow">
          <ShieldCheck aria-hidden="true" />
          <span>
            {progress.payment === 'done'
              ? approved
                ? 'Your application is complete and your listing is live.'
                : 'Your payment is confirmed. The review team is checking the rest of your listing.'
              : 'Everything is in. We are confirming your payment — nothing else is needed from you.'}
          </span>
        </p>
      ) : null}

      {/* ── 1. Verification ─────────────────────────── */}
      <section className="card narrow" aria-labelledby="step-identity">
        <StepHeader
          id="step-identity"
          number={1}
          title={idType === 'cnic' ? 'Identity' : 'Business verification'}
          state={progress.identity === 'done' ? 'done' : 'todo'}
        />
        <div className="cbody">
          {!editingIdentity && identitySummary ? (
            <dl className="kv">
              <div>
                <dt>On record</dt>
                <dd className="flex items-center gap-3">
                  {identitySummary}
                  {!approved ? (
                    <button type="button" onClick={() => setEditingIdentity(true)} className="link">
                      Replace
                    </button>
                  ) : null}
                </dd>
              </div>
            </dl>
          ) : (
            <>
              <IdentityFields idPrefix="application" idType={idType} value={identity} onChange={setIdentity} onFile={onFile} />
              <div className="formc__acts">
                {identitySummary ? (
                  <button type="button" className="btn btn--line" onClick={() => setEditingIdentity(false)}>
                    Cancel
                  </button>
                ) : null}
                <SaveButton busy={busy === 'identity'} disabled={busy !== null} onClick={() => save('identity')}>
                  Save verification
                </SaveButton>
              </div>
            </>
          )}
          {busy === 'identity' && progressText ? (
            <p aria-live="polite" className="fhint" style={{ marginTop: 12 }}>
              {progressText}
            </p>
          ) : null}
          {note('identity')}
        </div>
      </section>

      {/* ── 2. Payment ──────────────────────────────── */}
      <section className="card narrow" aria-labelledby="step-payment">
        <StepHeader id="step-payment" number={2} title="Listing fee" state={paymentState} />
        <div className="cbody">
          {progress.payment === 'refused' ? (
            <div role="note" className="note note--bad" style={{ marginBottom: 18 }}>
              <AlertTriangle aria-hidden="true" />
              <span>
                <b>Why the last payment was not accepted</b>
                <span className="biz-pre">{progress.paymentNote ?? 'No reason was recorded.'}</span>
                <span className="biz-block">Check the details and send them again below.</span>
              </span>
            </div>
          ) : null}

          {payment && !editingPayment ? (
            <>
              <dl className="kv">
                {[
                  ['Amount', formatPkr(payment.amount)],
                  ['Method', PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method],
                  ['Transaction ID', payment.reference],
                  ['Paid on', payment.paidOn],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {progress.payment === 'waiting' ? (
                <p className="fhint" style={{ marginTop: 14 }}>
                  Typed something wrong?{' '}
                  <button type="button" onClick={() => setEditingPayment(true)} className="link">
                    Correct the payment details
                  </button>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <PaymentFields
                idPrefix="application"
                fee={fee}
                accounts={accounts}
                value={paymentDraft}
                onChange={setPaymentDraft}
                receiptOnFile={receiptReusable}
              />
              {accounts.length > 0 ? (
                <div className="formc__acts">
                  {payment && progress.payment === 'waiting' ? (
                    <button type="button" className="btn btn--line" onClick={() => setEditingPayment(false)}>
                      Cancel
                    </button>
                  ) : null}
                  <SaveButton busy={busy === 'payment'} disabled={busy !== null} onClick={() => save('payment')}>
                    Send payment details
                  </SaveButton>
                </div>
              ) : null}
            </>
          )}
          {busy === 'payment' && progressText ? (
            <p aria-live="polite" className="fhint" style={{ marginTop: 12 }}>
              {progressText}
            </p>
          ) : null}
          {note('payment')}
        </div>
      </section>
    </>
  )
}

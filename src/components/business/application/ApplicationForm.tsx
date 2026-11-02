// src/components/business/application/ApplicationForm.tsx
'use client'

import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
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

function StepHeader({ number, title, state }: { number: number; title: string; state: 'done' | 'waiting' | 'todo' | 'refused' }) {
  const badge = {
    done: { label: 'Complete', tone: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
    waiting: { label: 'Being checked', tone: 'bg-amber-100 text-amber-800', Icon: Clock },
    todo: { label: 'Action needed', tone: 'bg-plug-blue-100 text-plug-blue-800', Icon: AlertTriangle },
    refused: { label: 'Not accepted', tone: 'bg-red-100 text-red-800', Icon: AlertTriangle },
  }[state]
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
          {number}
        </span>
        {title}
      </h2>
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-ui-xs font-semibold', badge.tone)}>
        <badge.Icon size={13} aria-hidden="true" />
        {badge.label}
      </span>
    </div>
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
      setMessage({ part, tone: 'error', text: 'Could not reach Plug.pk. Check your connection and try again.' })
    } finally {
      setBusy(null)
      setProgressText(null)
    }
  }

  const note = (part: 'identity' | 'payment') =>
    message?.part === part ? (
      <p role={message.tone === 'error' ? 'alert' : 'status'} className={cn('mt-4 text-sm', message.tone === 'error' ? 'text-red-600' : 'text-emerald-700')}>
        {message.text}
      </p>
    ) : null

  const paymentState =
    progress.payment === 'done' ? 'done' : progress.payment === 'waiting' ? 'waiting' : progress.payment === 'refused' ? 'refused' : 'todo'

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {!progress.needsOwner ? (
        <p className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-ui-sm text-emerald-900">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {progress.payment === 'done'
            ? approved
              ? 'Your application is complete and your listing is live.'
              : 'Your payment is confirmed. The review team is checking the rest of your listing.'
            : 'Everything is in. We are confirming your payment — nothing else is needed from you.'}
        </p>
      ) : null}

      {/* ── 1. Verification ─────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <StepHeader number={1} title={idType === 'cnic' ? 'Identity' : 'Business verification'} state={progress.identity === 'done' ? 'done' : 'todo'} />

        {!editingIdentity && identitySummary ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <p className="font-mono text-ui-sm text-slate-800">{identitySummary}</p>
            {!approved ? (
              <button type="button" onClick={() => setEditingIdentity(true)} className="text-ui-sm font-semibold text-plug-blue-600 hover:underline">
                Replace
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <IdentityFields idPrefix="application" idType={idType} value={identity} onChange={setIdentity} onFile={onFile} />
            <div className="mt-5 flex gap-3">
              {identitySummary ? (
                <Button variant="secondary" onClick={() => setEditingIdentity(false)}>
                  Cancel
                </Button>
              ) : null}
              <Button isLoading={busy === 'identity'} disabled={busy !== null} onClick={() => save('identity')}>
                Save verification
              </Button>
            </div>
          </>
        )}
        {busy === 'identity' && progressText ? <p aria-live="polite" className="mt-3 text-sm text-slate-500">{progressText}</p> : null}
        {note('identity')}
      </section>

      {/* ── 2. Payment ──────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <StepHeader number={2} title="Listing fee" state={paymentState} />

        {progress.payment === 'refused' ? (
          <div role="note" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-ui-sm font-semibold text-red-900">Why the last payment was not accepted</p>
            <p className="mt-1 whitespace-pre-line text-ui-sm text-red-800">{progress.paymentNote ?? 'No reason was recorded.'}</p>
            <p className="mt-2 text-ui-sm text-red-800">Check the details and send them again below.</p>
          </div>
        ) : null}

        {payment && !editingPayment ? (
          <>
            <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
              {[
                ['Amount', formatPkr(payment.amount)],
                ['Method', PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method],
                ['Transaction ID', payment.reference],
                ['Paid on', payment.paidOn],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ui-sm text-slate-500">{label}</dt>
                  <dd className="font-mono text-ui-sm font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            {progress.payment === 'waiting' ? (
              <p className="mt-4 text-ui-sm text-slate-500">
                Typed something wrong?{' '}
                <button type="button" onClick={() => setEditingPayment(true)} className="font-semibold text-plug-blue-600 hover:underline">
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
              <div className="mt-6 flex gap-3">
                {payment && progress.payment === 'waiting' ? (
                  <Button variant="secondary" onClick={() => setEditingPayment(false)}>
                    Cancel
                  </Button>
                ) : null}
                <Button isLoading={busy === 'payment'} disabled={busy !== null} onClick={() => save('payment')}>
                  Send payment details
                </Button>
              </div>
            ) : null}
          </>
        )}
        {busy === 'payment' && progressText ? <p aria-live="polite" className="mt-3 text-sm text-slate-500">{progressText}</p> : null}
        {note('payment')}
      </section>
    </div>
  )
}

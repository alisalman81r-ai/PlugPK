// src/lib/db/listing-application-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import {
  applicationProgress,
  DOCUMENT_KINDS,
  formatPkr,
  idTypeFor,
  LICENCE_KINDS,
  normalizeCnic,
  normalizeIdAddress,
  normalizeLicenceNumber,
  normalizeReference,
  checkPaidOn,
  DEMO_PAYMENT_CODE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  REQUIRED_DOCUMENTS,
  type DocumentKind,
  type PaymentMethod,
} from '@/lib/listing-application'
import { checkText } from '@/lib/validate'

import { getAdminActor } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'
import { readDocument } from './document-store'
import { getListingFee, getListingPaymentAccounts } from './listing-fee'
import { checkLimits, retryMessage } from './rate-limit'
import { getSessionUserId } from './session'
import { recordSiteEvent } from './site-events'

/**
 * The owner's half of a paid listing — proving who they are and paying — and
 * the operator's confirmation that the money arrived.
 *
 * Each export is a POST endpoint. Owner actions re-read the session and check
 * the listing is theirs; the review action re-checks the admin session. None
 * of them trust an amount, a status or a document type from the browser.
 */

export interface ApplicationResult {
  ok: boolean
  message?: string
}

const NOT_YOURS: ApplicationResult = { ok: false, message: 'That listing is not yours to edit.' }

/**
 * The signed-in owner's listing, with its application. Null when the caller
 * does not own it, so a stranger's id and a missing one look the same.
 */
async function loadOwnedApplication(businessId: unknown) {
  const userId = await getSessionUserId()
  if (!userId || typeof businessId !== 'string' || !businessId) return null

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      userId: true,
      status: true,
      businessName: true,
      businessType: true,
      application: true,
    },
  })
  if (!business || business.userId !== userId || !business.application) return null
  return { ...business, application: business.application, userId }
}

function refreshViews(): void {
  revalidatePath('/business/dashboard')
  revalidatePath('/business/application')
  revalidatePath('/admin/businesses')
  revalidatePath('/admin')
}

/**
 * Marks the application finished once identity and payment are both in. That
 * moment is what the review queue sorts and badges by.
 */
async function markSubmittedIfComplete(businessId: string, businessType: string): Promise<void> {
  const [app, documents, payments] = await Promise.all([
    prisma.listingApplication.findUnique({ where: { businessId } }),
    prisma.businessDocument.findMany({ where: { businessId }, select: { kind: true } }),
    prisma.listingPayment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: { status: true, reviewNote: true },
    }),
  ])
  if (!app) return
  const progress = applicationProgress(
    {
      idType: app.idType,
      idNumber: app.idNumber,
      idAddress: app.idAddress,
      submittedAt: null,
      documents: documents.map((doc) => doc.kind),
      payments,
    },
    businessType,
  )
  const complete = progress.identity === 'done' && progress.payment !== 'missing' && progress.payment !== 'refused'
  if (complete && !app.submittedAt) {
    await prisma.listingApplication.update({ where: { businessId }, data: { submittedAt: new Date() } })
  }
}

// ─── Owner: documents ───────────────────────────────────

/**
 * Stores one identity or payment document, replacing any earlier file of the
 * same kind on this listing. Retrying an upload is therefore harmless.
 */
export async function uploadListingDocument(
  businessId: string,
  kind: DocumentKind,
  form: FormData,
): Promise<ApplicationResult> {
  const business = await loadOwnedApplication(businessId)
  if (!business) return NOT_YOURS
  if (!DOCUMENT_KINDS.includes(kind)) return { ok: false, message: 'That kind of document is not needed.' }

  if (kind === 'payment-receipt') {
    const latest = await prisma.listingPayment.findFirst({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    })
    if (latest?.status === 'verified') return { ok: false, message: 'Your payment has already been confirmed.' }
  } else {
    if (business.status === 'approved') {
      return { ok: false, message: 'This listing is already approved. Write to hello@plug.pk to change its documents.' }
    }
    if (!REQUIRED_DOCUMENTS[idTypeFor(business.businessType)].includes(kind)) {
      return { ok: false, message: 'That document is not the one this kind of listing needs.' }
    }
  }

  const limit = await checkLimits([
    { key: `upload:user:${business.userId}`, limit: 60, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many uploads') }

  const read = await readDocument(kind, form)
  if (!read.ok) return { ok: false, message: read.message }

  await prisma.businessDocument.upsert({
    where: { businessId_kind: { businessId: business.id, kind } },
    create: {
      id: randomUUID(),
      businessId: business.id,
      kind,
      mimeType: read.mimeType,
      size: read.bytes.length,
      bytes: new Uint8Array(read.bytes),
    },
    // A new id on replacement, so a link to the old file stops working.
    update: {
      id: randomUUID(),
      mimeType: read.mimeType,
      size: read.bytes.length,
      bytes: new Uint8Array(read.bytes),
      createdAt: new Date(),
    },
  })

  refreshViews()
  return { ok: true }
}

// ─── Owner: identity ────────────────────────────────────

/**
 * Saves the CNIC (home charger) or licence number (business). The type is
 * decided by the listing, not the request: a hotel cannot answer with a CNIC.
 * The documents must already be uploaded, so a saved identity is always a
 * complete one.
 */
export async function saveListingIdentity(
  businessId: string,
  input: { idNumber: string; idDetail?: string; idAddress: string },
): Promise<ApplicationResult> {
  const business = await loadOwnedApplication(businessId)
  if (!business) return NOT_YOURS
  if (business.status === 'approved') {
    return { ok: false, message: 'This listing is already approved. Write to hello@plug.pk to change its details.' }
  }

  const idType = idTypeFor(business.businessType)
  let idNumber: string | null
  let idDetail: string | null = null

  if (idType === 'cnic') {
    idNumber = normalizeCnic(input?.idNumber)
    if (!idNumber) return { ok: false, message: 'Enter your 13-digit CNIC number, like 35202-1234567-1.' }
  } else {
    idNumber = normalizeLicenceNumber(input?.idNumber)
    if (!idNumber) return { ok: false, message: 'Enter the licence or registration number as printed on the certificate.' }
    const detail = LICENCE_KINDS.find((kind) => kind.value === input?.idDetail)
    if (!detail) return { ok: false, message: 'Choose what kind of licence or registration this is.' }
    idDetail = detail.value
  }

  // Where the owner lives or the business is registered, as on the document.
  // Not where the chargers are: that is the listing's own, public address.
  const idAddress = normalizeIdAddress(input?.idAddress)
  if (!idAddress) {
    return {
      ok: false,
      message:
        idType === 'cnic'
          ? 'Enter the address printed on your CNIC.'
          : 'Enter the registered address shown on the licence or certificate.',
    }
  }

  const required = REQUIRED_DOCUMENTS[idType]
  const present = await prisma.businessDocument.findMany({
    where: { businessId: business.id, kind: { in: required } },
    select: { kind: true },
  })
  if (present.length !== required.length) {
    return {
      ok: false,
      message: idType === 'cnic' ? 'Upload both sides of your CNIC.' : 'Upload a copy of the licence or certificate.',
    }
  }

  await prisma.listingApplication.update({
    where: { businessId: business.id },
    data: { idType, idNumber, idDetail, idAddress },
  })

  // The listing's type may have changed since documents were uploaded (a home
  // charger that turned out to be a shop). Files for the other kind of proof
  // are no longer needed and are not kept.
  const other = DOCUMENT_KINDS.filter((kind) => kind !== 'payment-receipt' && !required.includes(kind))
  await prisma.businessDocument.deleteMany({ where: { businessId: business.id, kind: { in: other } } })

  await markSubmittedIfComplete(business.id, business.businessType)
  refreshViews()
  return { ok: true }
}

// ─── Owner: payment ─────────────────────────────────────

/**
 * Records a listing-fee payment for an operator to confirm.
 *
 * The amount is the fee in force on the server, never a figure from the form.
 * While the latest payment is still waiting, sending again corrects it rather
 * than adding a second; once one was refused, a new attempt is a new row so
 * the refused one stays on record.
 */
export async function submitListingPayment(
  businessId: string,
  input: { method: string; payerName: string; reference: string; paidOn: string },
): Promise<ApplicationResult> {
  const business = await loadOwnedApplication(businessId)
  if (!business) return NOT_YOURS

  const method = input?.method as PaymentMethod
  if (!PAYMENT_METHODS.includes(method)) return { ok: false, message: 'Choose how you paid.' }
  if (!getListingPaymentAccounts().some((account) => account.method === method)) {
    return { ok: false, message: `${PAYMENT_METHOD_LABEL[method]} is not available. Choose another way to pay.` }
  }
  if (method === 'demo') return submitDemoPayment(business, input?.reference)

  const payerName = checkText(input?.payerName, 'the name on the account you paid from', { max: 120, required: true })
  if (!payerName.ok) return { ok: false, message: payerName.message }
  const reference = normalizeReference(input?.reference)
  if (!reference) return { ok: false, message: 'Enter the transaction ID exactly as it appears on your receipt.' }
  const paidOn = checkPaidOn(input?.paidOn)
  if (!paidOn) return { ok: false, message: 'Enter the date you paid. It cannot be in the future.' }

  const receipt = await prisma.businessDocument.findUnique({
    where: { businessId_kind: { businessId: business.id, kind: 'payment-receipt' } },
    select: { createdAt: true },
  })
  if (!receipt) return { ok: false, message: 'Upload a screenshot or photo of your payment receipt.' }

  // One transaction cannot pay for two listings.
  const reused = await prisma.listingPayment.findFirst({
    where: {
      businessId: { not: business.id },
      method,
      reference: { equals: reference, mode: 'insensitive' },
      status: { not: 'rejected' },
    },
    select: { id: true },
  })
  if (reused) {
    return { ok: false, message: 'That transaction ID is already attached to another listing. Check it and try again.' }
  }

  const limit = await checkLimits([
    { key: `listing-payment:user:${business.userId}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many attempts') }

  const latest = await prisma.listingPayment.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  })
  if (latest?.status === 'verified') return { ok: false, message: 'Your payment has already been confirmed.' }
  // The receipt behind a refused payment proves nothing about the next one.
  if (latest?.status === 'rejected' && latest.reviewedAt && receipt.createdAt <= latest.reviewedAt) {
    return { ok: false, message: 'Upload the receipt for this new payment.' }
  }

  const amount = getListingFee()
  const fields = { amount, currency: 'PKR', method, payerName: payerName.value, reference, paidOn }

  if (latest?.status === 'submitted') {
    await prisma.listingPayment.update({ where: { id: latest.id }, data: fields })
  } else {
    await prisma.listingPayment.create({ data: { id: randomUUID(), businessId: business.id, ...fields } })
  }

  await markSubmittedIfComplete(business.id, business.businessType)
  await recordSiteEvent({
    userId: business.userId,
    type: 'business.payment',
    targetType: 'business',
    targetId: business.id,
    summary: (who) =>
      `${who} sent ${formatPkr(amount)} by ${PAYMENT_METHOD_LABEL[method]} for ${business.businessName}`,
  })
  refreshViews()
  return { ok: true }
}

/**
 * The test-only payment: the code 0000 stands in for a real transfer. No
 * receipt is needed and it is confirmed at once, marked as a test so an
 * operator can never mistake it for money. Reachable only while
 * DEMO_PAYMENT_ENABLED=true (checked by the caller via the account list).
 */
async function submitDemoPayment(
  business: NonNullable<Awaited<ReturnType<typeof loadOwnedApplication>>>,
  code: unknown,
): Promise<ApplicationResult> {
  if (String(code ?? '').trim() !== DEMO_PAYMENT_CODE) {
    return { ok: false, message: 'Wrong test code. Enter 0000 to continue.' }
  }
  const latest = await prisma.listingPayment.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  })
  if (latest?.status === 'verified') return { ok: true }

  const fields = {
    amount: getListingFee(),
    currency: 'PKR',
    method: 'demo',
    payerName: 'Test payment',
    reference: `DEMO-${DEMO_PAYMENT_CODE}`,
    paidOn: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date()),
    status: 'verified',
    reviewNote: 'Test payment (code 0000) — no money was received.',
    reviewedAt: new Date(),
    reviewedBy: 'demo',
  }
  if (latest?.status === 'submitted') {
    await prisma.listingPayment.update({ where: { id: latest.id }, data: fields })
  } else {
    await prisma.listingPayment.create({ data: { id: randomUUID(), businessId: business.id, ...fields } })
  }
  await markSubmittedIfComplete(business.id, business.businessType)
  refreshViews()
  return { ok: true }
}

// ─── Operator: confirming the money arrived ─────────────

/**
 * Confirms or refuses a payment. Only the newest payment on a listing can be
 * decided — an older one has been superseded by the owner's next attempt.
 * A refusal needs a reason, because the owner reads it on their dashboard and
 * has to know what to fix.
 */
export async function reviewListingPayment(
  paymentId: string,
  decision: 'verified' | 'rejected',
  note?: string,
): Promise<ApplicationResult> {
  const actor = await getAdminActor()
  if (!actor) return { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
  if (decision !== 'verified' && decision !== 'rejected') return { ok: false, message: 'Choose a valid decision.' }

  const payment = await prisma.listingPayment.findUnique({
    where: { id: String(paymentId ?? '') },
    include: { business: { select: { id: true, businessName: true, status: true } } },
  })
  if (!payment) return { ok: false, message: 'That payment no longer exists.' }

  const latest = await prisma.listingPayment.findFirst({
    where: { businessId: payment.businessId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  if (latest?.id !== payment.id) {
    return { ok: false, message: 'The owner has sent a newer payment. Reload and review that one.' }
  }
  if (payment.business.status === 'approved') {
    return { ok: false, message: 'This listing is already live. Reopen it before changing its payment.' }
  }

  const reviewNote = decision === 'rejected' ? (typeof note === 'string' ? note.trim().slice(0, 500) : '') : ''
  if (decision === 'rejected' && !reviewNote) {
    return { ok: false, message: 'Say why the payment was not accepted, so the owner knows what to fix.' }
  }

  await prisma.listingPayment.update({
    where: { id: payment.id },
    data: {
      status: decision,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
      reviewedBy: actor.email,
    },
  })

  await logAdminAction(
    actor,
    decision === 'verified' ? 'business.payment.verify' : 'business.payment.reject',
    'business',
    payment.businessId,
    `${payment.business.businessName} — ${formatPkr(payment.amount)} ${PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method}, ref ${payment.reference}${reviewNote ? ` — ${reviewNote}` : ''}`,
  )

  refreshViews()
  return { ok: true }
}

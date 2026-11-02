// src/lib/listing-application.ts

/**
 * The rules of a paid listing application, in one place.
 *
 * Read by the sign-up form (to say what is needed), by the server actions (to
 * enforce it), and by the admin and owner screens (to explain why a listing
 * cannot be approved yet). Plain synchronous code with no imports from the
 * server, so a Client Component can use it too.
 *
 * What an owner proves depends on what they are listing:
 *
 *   a home charger  →  the owner's CNIC, front and back
 *   anything else   →  a business licence or registration certificate
 *
 * and every application carries one listing-fee payment that an operator
 * confirms arrived before the listing can go live.
 */

export type IdType = 'cnic' | 'licence'
export type DocumentKind = 'cnic-front' | 'cnic-back' | 'licence' | 'payment-receipt'
export type PaymentMethod = 'bank' | 'jazzcash' | 'easypaisa'
export type PaymentStatus = 'submitted' | 'verified' | 'rejected'

export const DOCUMENT_KINDS: DocumentKind[] = ['cnic-front', 'cnic-back', 'licence', 'payment-receipt']
export const PAYMENT_METHODS: PaymentMethod[] = ['bank', 'jazzcash', 'easypaisa']

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  'cnic-front': 'CNIC — front',
  'cnic-back': 'CNIC — back',
  licence: 'Licence / registration',
  'payment-receipt': 'Payment receipt',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bank: 'Bank transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
}

/** What a business can show as proof that it exists. */
export const LICENCE_KINDS = [
  { value: 'ntn', label: 'NTN certificate (FBR)' },
  { value: 'secp', label: 'SECP certificate of incorporation' },
  { value: 'trade-licence', label: 'Trade / municipal licence' },
  { value: 'other', label: 'Other registration' },
] as const

export type LicenceKind = (typeof LICENCE_KINDS)[number]['value']

export function licenceKindLabel(value: string | null | undefined): string {
  return LICENCE_KINDS.find((kind) => kind.value === value)?.label ?? 'Licence / registration'
}

/** A home charger is listed by a person; everything else by a business. */
export function idTypeFor(businessType: string): IdType {
  return businessType === 'home' ? 'cnic' : 'licence'
}

export const REQUIRED_DOCUMENTS: Record<IdType, DocumentKind[]> = {
  cnic: ['cnic-front', 'cnic-back'],
  licence: ['licence'],
}

/** PDFs only where a certificate is likely to arrive as one. */
export function acceptsPdf(kind: DocumentKind): boolean {
  return kind === 'licence' || kind === 'payment-receipt'
}

export const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024

/**
 * A CNIC as NADRA prints it, 12345-1234567-1, from however it was typed.
 * Thirteen digits and nothing else; null when it is not that.
 */
export function normalizeCnic(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/[\s-]/g, '')
  if (!/^\d{13}$/.test(digits)) return null
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}

/** Shows only the last four digits — enough to match a scan, no more. */
export function maskCnic(cnic: string): string {
  return `•••••-••••${cnic.slice(10, 13)}-${cnic.slice(14)}`
}

/** A licence or registration number: letters, digits and the usual separators. */
export function normalizeLicenceNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim().replace(/\s+/g, ' ').toUpperCase()
  if (value.length < 3 || value.length > 40) return null
  if (!/^[A-Z0-9][A-Z0-9 ./-]*$/.test(value)) return null
  return value
}

/**
 * The address on the CNIC or licence, as typed: trimmed, single-spaced, and
 * long enough to be an address rather than a city name.
 */
export function normalizeIdAddress(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim().replace(/\s+/g, ' ')
  if (value.length < 10 || value.length > 300) return null
  return value
}

/** A transaction ID as printed on a receipt. */
export function normalizeReference(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim().replace(/\s+/g, ' ')
  if (value.length < 4 || value.length > 60) return null
  if (!/^[A-Za-z0-9][A-Za-z0-9 ./#:-]*$/.test(value)) return null
  return value
}

/** YYYY-MM-DD, not in the future and not older than 60 days. */
export function checkPaidOn(raw: unknown, today = new Date()): string | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const day = new Date(`${raw}T00:00:00Z`)
  if (Number.isNaN(day.getTime())) return null
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  // A day of slack either side: Pakistan is ahead of UTC.
  if (day.getTime() > now + 24 * 60 * 60 * 1000) return null
  if (day.getTime() < now - 60 * 24 * 60 * 60 * 1000) return null
  return raw
}

export function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

// ─── Where an application stands ────────────────────────

export interface ApplicationSnapshot {
  idType: string | null
  idNumber: string | null
  /** The address on the CNIC or licence. */
  idAddress: string | null
  submittedAt: string | null
  /** Kinds of document on file. */
  documents: string[]
  /** Newest first. */
  payments: { status: string; reviewNote: string | null }[]
}

export type StepState = 'missing' | 'done' | 'waiting' | 'refused'

export interface ApplicationProgress {
  identity: StepState
  payment: StepState
  /** The reviewer's reason when the latest payment was not accepted. */
  paymentNote: string | null
  /** The owner has something to do. */
  needsOwner: boolean
}

export function applicationProgress(app: ApplicationSnapshot, businessType: string): ApplicationProgress {
  const idType = idTypeFor(businessType)
  const identityComplete =
    app.idType === idType &&
    Boolean(app.idNumber) &&
    Boolean(app.idAddress) &&
    REQUIRED_DOCUMENTS[idType].every((kind) => app.documents.includes(kind))

  const latest = app.payments[0]
  const payment: StepState = !latest
    ? 'missing'
    : latest.status === 'verified'
      ? 'done'
      : latest.status === 'rejected'
        ? 'refused'
        : 'waiting'

  return {
    identity: identityComplete ? 'done' : 'missing',
    payment,
    paymentNote: latest?.status === 'rejected' ? latest.reviewNote : null,
    needsOwner: !identityComplete || payment === 'missing' || payment === 'refused',
  }
}

/**
 * Why an application cannot be approved yet, or null when it can. The status
 * button, the admin edit form and the review screen all ask this one function.
 */
export function applicationProblem(app: ApplicationSnapshot, businessType: string): string | null {
  const progress = applicationProgress(app, businessType)
  if (progress.identity !== 'done') {
    return idTypeFor(businessType) === 'cnic'
      ? 'The owner has not supplied their CNIC number, the address on it, and both sides of the card yet.'
      : 'The owner has not supplied a licence or registration number, its registered address and the certificate yet.'
  }
  if (progress.payment === 'missing') return 'No listing-fee payment has been submitted yet.'
  if (progress.payment === 'refused') return 'The last payment was not accepted. Waiting for the owner to pay again.'
  if (progress.payment === 'waiting') return 'Confirm the listing-fee payment arrived before approving.'
  return null
}

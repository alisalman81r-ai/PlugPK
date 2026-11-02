// src/components/business/application/send-application.ts
'use client'

import {
  saveListingIdentity,
  submitListingPayment,
  uploadListingDocument,
} from '@/lib/db/listing-application-actions'
import { REQUIRED_DOCUMENTS, type DocumentKind, type IdType } from '@/lib/listing-application'

import type { IdentityDraft } from './IdentityFields'
import type { PaymentDraft } from './PaymentFields'

/**
 * Sends the identity and payment parts of an application, in the order the
 * server needs them: files first, then the details that refer to them.
 *
 * `sent` remembers which files already reached the server, so pressing Submit
 * again after a dropped connection carries on instead of uploading every scan
 * twice. Each upload replaces the file of its kind, so a repeat is harmless
 * anyway — this only saves the owner's data allowance.
 */
export async function sendApplication(
  businessId: string,
  parts: { idType: IdType; identity?: IdentityDraft; payment?: PaymentDraft },
  sent: WeakSet<File>,
  onProgress: (message: string) => void,
): Promise<{ ok: boolean; message?: string }> {
  const upload = async (kind: DocumentKind, file: File | undefined, label: string) => {
    if (!file || sent.has(file)) return { ok: true }
    onProgress(`Uploading ${label}…`)
    const form = new FormData()
    form.set('file', file)
    const result = await uploadListingDocument(businessId, kind, form)
    if (result.ok) sent.add(file)
    return result
  }

  if (parts.identity) {
    for (const kind of REQUIRED_DOCUMENTS[parts.idType]) {
      const label = kind === 'cnic-front' ? 'CNIC (front)' : kind === 'cnic-back' ? 'CNIC (back)' : 'your licence'
      const result = await upload(kind, parts.identity.files[kind], label)
      if (!result.ok) return result
    }
    onProgress('Saving your verification details…')
    const saved = await saveListingIdentity(businessId, {
      idNumber: parts.identity.idNumber,
      idDetail: parts.identity.idDetail,
      idAddress: parts.identity.address,
    })
    if (!saved.ok) return saved
  }

  if (parts.payment) {
    const receipt = await upload('payment-receipt', parts.payment.receipt, 'your payment receipt')
    if (!receipt.ok) return receipt
    onProgress('Recording your payment…')
    const paid = await submitListingPayment(businessId, {
      method: parts.payment.method,
      payerName: parts.payment.payerName,
      reference: parts.payment.reference,
      paidOn: parts.payment.paidOn,
    })
    if (!paid.ok) return paid
  }

  return { ok: true }
}

// src/lib/db/listing-application-queries.ts
import 'server-only'

import type { ApplicationSnapshot } from '@/lib/listing-application'

import { prisma } from './client'

/**
 * Paid-listing applications, for the owner's portal and the review screen.
 *
 * Document bytes are never selected here — only what a screen needs to list
 * them. The file itself is fetched through /api/business-documents/[id], which
 * checks who is asking.
 */

export interface ApplicationDocument {
  id: string
  kind: string
  mimeType: string
  size: number
  createdAt: string
}

export interface ApplicationPayment {
  id: string
  amount: number
  currency: string
  method: string
  payerName: string
  reference: string
  paidOn: string
  status: string
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface ApplicationDetail extends ApplicationSnapshot {
  businessId: string
  idDetail: string | null
  documentFiles: ApplicationDocument[]
  paymentRecords: ApplicationPayment[]
}

/**
 * The application behind each listing that has one. A listing missing from
 * the map predates paid listing (or was entered by an operator) and is
 * reviewed under the old rules.
 */
export async function getApplications(businessIds: string[]): Promise<Map<string, ApplicationDetail>> {
  const result = new Map<string, ApplicationDetail>()
  if (businessIds.length === 0) return result

  const [applications, documents, payments] = await Promise.all([
    prisma.listingApplication.findMany({ where: { businessId: { in: businessIds } } }),
    prisma.businessDocument.findMany({
      where: { businessId: { in: businessIds } },
      select: { id: true, businessId: true, kind: true, mimeType: true, size: true, createdAt: true },
    }),
    prisma.listingPayment.findMany({
      where: { businessId: { in: businessIds } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  for (const app of applications) {
    const files = documents
      .filter((doc) => doc.businessId === app.businessId)
      .map((doc) => ({
        id: doc.id,
        kind: doc.kind,
        mimeType: doc.mimeType,
        size: doc.size,
        createdAt: doc.createdAt.toISOString(),
      }))
    const records = payments
      .filter((payment) => payment.businessId === app.businessId)
      .map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        payerName: payment.payerName,
        reference: payment.reference,
        paidOn: payment.paidOn,
        status: payment.status,
        reviewNote: payment.reviewNote,
        reviewedAt: payment.reviewedAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
      }))

    result.set(app.businessId, {
      businessId: app.businessId,
      idType: app.idType,
      idNumber: app.idNumber,
      idAddress: app.idAddress,
      idDetail: app.idDetail,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      documents: files.map((file) => file.kind),
      payments: records.map((record) => ({ status: record.status, reviewNote: record.reviewNote })),
      documentFiles: files,
      paymentRecords: records,
    })
  }

  return result
}

export async function getApplication(businessId: string): Promise<ApplicationDetail | null> {
  return (await getApplications([businessId])).get(businessId) ?? null
}

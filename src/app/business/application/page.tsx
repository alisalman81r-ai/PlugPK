// src/app/business/application/page.tsx
import { CheckCircle2 } from '@/components/ui/icons'
import type { Metadata } from 'next'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { ApplicationForm } from '@/components/business/application/ApplicationForm'
import { portalListings, requireOwnerPortal } from '@/lib/db/business-queries'
import { getApplication } from '@/lib/db/listing-application-queries'
import { getListingFee, getListingPaymentAccounts } from '@/lib/db/listing-fee'
import { applicationProgress, idTypeFor, licenceKindLabel, maskCnic } from '@/lib/listing-application'

/**
 * Where an owner finishes or fixes their paid application: the verification
 * documents and the listing-fee payment.
 *
 * The sign-up form sends both in one go, so most owners only read this page.
 * It is where they act when a listing was started in the app (which collects
 * neither), or when a payment could not be found and has to be sent again.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Verification and payment' }

export default async function BusinessApplicationPage({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireOwnerPortal('/business/application', searchParams.listing)
  const { listing } = portal
  const application = await getApplication(listing.id)

  return (
    <BusinessDashboardLayout
      title="Verification and payment"
      subtitle={listing.businessName}
      {...portalListings(portal)}
    >
      {application ? (
        <ApplicationForm
          businessId={listing.id}
          listingStatus={listing.status}
          idType={idTypeFor(listing.businessType)}
          progress={applicationProgress(application, listing.businessType)}
          identitySummary={
            application.idType === 'cnic' && application.idNumber
              ? `CNIC ${maskCnic(application.idNumber)}`
              : application.idType === 'licence' && application.idNumber
                ? `${licenceKindLabel(application.idDetail)} · ${application.idNumber}`
                : null
          }
          onFile={application.documents}
          payment={application.paymentRecords[0] ?? null}
          fee={getListingFee()}
          accounts={getListingPaymentAccounts()}
        />
      ) : (
        <section className="card narrow">
          <div className="empty">
            <span className="empty__ico">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <b>Nothing to do here</b>
            <p>
              {listing.businessName} was listed before verification and payment were introduced, so it does not need
              either.
            </p>
          </div>
        </section>
      )}
    </BusinessDashboardLayout>
  )
}

// src/app/admin/(protected)/stations/[id]/page.tsx
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { FORM_COL, FormCard, Ico, Note, StatusPill } from '@/components/admin/network-kit'
import { StationForm } from '@/components/admin/StationForm'
import { HostSettingsForm } from '@/components/business/host/HostSettingsForm'
import { saveStation } from '@/lib/db/actions'
import { getStationBookingSettings } from '@/lib/db/host-queries'
import { getPaymentAccounts } from '@/lib/db/listing-fee'
import { getStationById } from '@/lib/db/queries'
import { isSampleListing } from '@/lib/sample-listings'

export const dynamic = 'force-dynamic'

export default async function EditStationPage({ params }: { params: { id: string } }) {
  const station = await getStationById(params.id)
  if (!station) notFound()
  const bookingSettings = await getStationBookingSettings(station.id)

  async function update(form: FormData) {
    'use server'
    return saveStation(params.id, form)
  }

  return (
    <>
      <AdminHeader
        title={station.name}
        backHref="/admin/stations"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
            Editing a published station.
            <StatusPill status={station.status} />
          </span>
        }
        action={
          <a
            href={`/station/${station.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[46px] items-center gap-2.5 whitespace-nowrap rounded-full border border-ink/[.09] bg-white px-5 text-sm font-semibold text-ink no-underline transition-colors duration-200 hover:border-ink [&_svg]:h-[18px] [&_svg]:w-[18px]"
          >
            <Ico name="ext" />
            View on the live site
          </a>
        }
      />

      <div className="grid gap-3.5">
        <StationForm station={station} action={update} />

        {/* The team hosts its own stations: this is where one starts taking
            bookings. Drivers book exactly as at a partner's charger. */}
        <div className={FORM_COL}>
          <FormCard
            id="station-bookings"
            title="Bookings"
            sub="Let drivers book this station by car and charge level. Each booking lasts as long as the charge needs, and no charger takes more cars at once than it has ports."
          >
            <div className="mt-[22px]">
              {isSampleListing(station.id) ? (
                <Note tone="warn">This is a sample listing, not a real site, so it cannot take bookings.</Note>
              ) : (
                <HostSettingsForm
                  stationId={station.id}
                  initial={bookingSettings}
                  hasPayoutAccount={getPaymentAccounts().length > 0}
                />
              )}
            </div>
          </FormCard>

          <ActivityPanel targetType="station" targetId={station.id} />
        </div>
      </div>
    </>
  )
}

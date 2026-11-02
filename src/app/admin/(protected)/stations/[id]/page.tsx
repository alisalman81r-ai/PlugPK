// src/app/admin/(protected)/stations/[id]/page.tsx
import { notFound } from 'next/navigation'

import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { AdminHeader } from '@/components/admin/AdminHeader'
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
      <AdminHeader title={station.name} description="Editing a published station." backHref="/admin/stations" />
      <StationForm station={station} action={update} />

      {/* The team hosts its own stations: this is where one starts taking
          bookings. Drivers book exactly as at a partner's charger. */}
      <section aria-labelledby="station-bookings" className="max-w-3xl px-4 pb-8 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 id="station-bookings" className="text-lg font-bold text-slate-900">
            Bookings
          </h2>
          <p className="mb-5 mt-1 text-ui-sm text-slate-500">
            Let drivers book this station by car and charge level. Each booking lasts as long as the charge needs, and no
            charger takes more cars at once than it has ports.
          </p>
          {isSampleListing(station.id) ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-ui-sm text-amber-800">
              This is a sample listing, not a real site, so it cannot take bookings.
            </p>
          ) : (
            <HostSettingsForm
              stationId={station.id}
              initial={bookingSettings}
              hasPayoutAccount={getPaymentAccounts().length > 0}
            />
          )}
        </div>
      </section>

      <div className="max-w-3xl px-4 pb-8 sm:px-8">
        <ActivityPanel targetType="station" targetId={station.id} />
      </div>
    </>
  )
}

// src/app/admin/(protected)/businesses/page.tsx
import { Building2, Globe, Mail, MapPin, Pencil, Phone, Plus, Zap } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessStatusControl, type BusinessStatus } from '@/components/admin/BusinessStatusControl'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { BusinessPhotoReview } from '@/components/admin/BusinessPhotoReview'
import { deleteBusiness, setBusinessStatus } from '@/lib/db/business-actions'
import { getBusinesses, getBusinessPhotoReports } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  mall: 'Shopping Mall',
  office: 'Office',
  dealership: 'Dealership',
  'service-center': 'Service Center',
  home: 'Home Charger',
}

const STATUS_CHIP: Record<string, string> = {
  pending: 'bg-plug-blue-600 text-white',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-slate-500 text-white',
}

export default async function AdminBusinessesPage() {
  const rows = await getBusinesses()
  const reports = await getBusinessPhotoReports()
  const pending = rows.filter((row) => row.status === 'pending').length

  return (
    <>
      <AdminHeader
        title="Business applications"
        help={
          <>
            <b>Hotels, malls and cafés that applied to be listed</b> through the public
            form. Approving one publishes it to the site; until then only you can see
            it. Anything still pending is a real business waiting on a reply from you.
          </>
        }
        description={
          rows.length === 0
            ? 'Businesses applying to list their chargers will appear here.'
            : `${pending} pending of ${rows.length} total.`
        }
        action={
          <Link
            href="/admin/businesses/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={15} className="shrink-0" aria-hidden="true" />
            Add business
          </Link>
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <BusinessPhotoReview reports={reports} />
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Building2 size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No applications yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              The form at /business/signup posts straight here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const isPending = row.status === 'pending'
              const totalPorts = row.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)

              return (
                <li
                  key={row.id}
                  className={
                    isPending
                      ? 'rounded-xl border-y border-r border-l-4 border-slate-200 border-l-plug-blue-600 bg-white p-5'
                      : 'rounded-xl border border-slate-200 bg-slate-50/60 p-5'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {row.businessName}
                        <span
                          className={`ml-2.5 rounded-md px-1.5 py-0.5 text-ui-xs font-bold uppercase tracking-wide ${
                            STATUS_CHIP[row.status] ?? 'bg-slate-500 text-white'
                          }`}
                        >
                          {row.status}
                        </span>
                      </p>

                      <p className="mt-0.5 text-ui-sm text-slate-600">
                        {row.ownerName} · {TYPE_LABEL[row.businessType] ?? row.businessType}
                      </p>

                      {/* Real links, so an operator can act without retyping. */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1.5 text-ui-sm text-plug-blue-600 hover:underline"
                        >
                          <Mail size={13} className="shrink-0" aria-hidden="true" />
                          {row.email}
                        </a>

                        {row.phone ? (
                          <a
                            href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-ui-sm text-plug-blue-600 hover:underline"
                          >
                            <Phone size={13} className="shrink-0" aria-hidden="true" />
                            {row.phone}
                          </a>
                        ) : null}

                        {row.website ? (
                          <a
                            href={row.website}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-ui-sm text-plug-blue-600 hover:underline"
                          >
                            <Globe size={13} className="shrink-0" aria-hidden="true" />
                            Website
                          </a>
                        ) : null}
                      </div>

                      <p className="mt-2.5 inline-flex items-center gap-1.5 text-ui-sm text-slate-600">
                        <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        {row.address ? `${row.address}, ` : ''}
                        {row.city}
                      </p>

                      {/* Stated rather than implied. An approved listing with
                          no pin is invisible on the map, and that is worth
                          seeing at a glance from the review screen. */}
                      {row.lat !== null && row.lng !== null ? (
                        <p className="mt-1 font-mono text-ui-xs text-slate-500">
                          {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                        </p>
                      ) : (
                        <p className="mt-1 text-ui-xs font-semibold text-amber-700">
                          No coordinates — cannot appear on the map.
                        </p>
                      )}

                      {row.chargers.length > 0 ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="inline-flex items-center gap-1.5 text-ui-sm font-bold text-slate-800">
                              <Zap size={14} className="text-plug-blue-600" aria-hidden="true" />
                              Charger details
                            </p>
                            <span className="text-ui-xs text-slate-500">
                              {row.chargers.length} charger{row.chargers.length === 1 ? '' : 's'} · {totalPorts} port{totalPorts === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {row.chargers.map((charger, index) => (
                              <div
                                key={`${row.id}-c${index}`}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-ui-sm font-bold text-slate-900">
                                      Charger {index + 1}
                                    </p>
                                    <p className="mt-1 text-ui-xs text-slate-500">
                                      {charger.connectorType} · {charger.maxPowerKw} kW · {charger.ports} port{charger.ports === 1 ? '' : 's'}
                                    </p>
                                  </div>
                                  <span
                                    className={
                                      charger.photoStatus === 'approved'
                                        ? 'rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700'
                                        : charger.photoStatus === 'needs-better-photo'
                                          ? 'rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700'
                                          : 'rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700'
                                    }
                                  >
                                    {charger.photoStatus === 'approved'
                                      ? 'Photo approved'
                                      : charger.photoStatus === 'needs-better-photo'
                                        ? 'Needs better photo'
                                        : 'Photo pending'}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {charger.photo ? (
                                    <figure>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={charger.photo}
                                        alt={`Charger ${index + 1}`}
                                        className="aspect-[4/3] w-full rounded-lg border border-slate-200 object-cover"
                                      />
                                      <figcaption className="mt-1 text-[11px] font-medium text-slate-500">
                                        Charger photo
                                      </figcaption>
                                    </figure>
                                  ) : (
                                    <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50 px-2 text-center text-[11px] font-semibold text-red-600">
                                      Primary photo missing
                                    </div>
                                  )}

                                  {charger.portPhoto ? (
                                    <figure>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={charger.portPhoto}
                                        alt={`Port type for charger ${index + 1}`}
                                        className="aspect-[4/3] w-full rounded-lg border border-slate-200 object-cover"
                                      />
                                      <figcaption className="mt-1 text-[11px] font-medium text-slate-500">
                                        Port close-up
                                      </figcaption>
                                    </figure>
                                  ) : (
                                    <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-[11px] text-slate-400">
                                      No port close-up
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-ui-xs text-slate-400">No chargers listed.</p>
                      )}

                      <p className="mt-3 text-ui-xs text-slate-400">
                        Applied {formatRelativeTime(row.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/admin/businesses/${row.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                      >
                        <Pencil size={14} className="shrink-0" aria-hidden="true" />
                        Edit
                      </Link>
                      <BusinessStatusControl
                        status={row.status as BusinessStatus}
                        action={async (next: BusinessStatus) => {
                          'use server'
                          return setBusinessStatus(row.id, next)
                        }}
                      />
                      <DeleteButton
                        label={`the application from ${row.businessName}`}
                        action={async () => {
                          'use server'
                          return deleteBusiness(row.id)
                        }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

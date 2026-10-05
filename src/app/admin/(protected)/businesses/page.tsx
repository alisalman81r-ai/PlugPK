// src/app/admin/(protected)/businesses/page.tsx
import { Building2, Globe, Mail, MapPin, Pencil, Phone, Plus, Zap } from '@/components/ui/icons'
import Link from 'next/link'

import { AdminFilterChips } from '@/components/admin/AdminFilterChips'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { BusinessStatusControl, type BusinessStatus } from '@/components/admin/BusinessStatusControl'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { BusinessPhotoReview } from '@/components/admin/BusinessPhotoReview'
import { ReviewStatusBadge } from '@/components/admin/ReviewStatusBadge'
import { flattenParams, pick } from '@/components/admin/list-params'
import { listBusinessesPage, toPage, toQuery } from '@/lib/db/admin-queries'
import { deleteBusiness, setBusinessStatus } from '@/lib/db/business-actions'
import { validateForApproval, type ListingCharger } from '@/lib/db/business-listing'
import { getBusinessPhotoReports } from '@/lib/db/queries'
import { formatRelativeTime } from '@/lib/utils'
import { safeHref } from '@/lib/validate'

export const dynamic = 'force-dynamic'

const PATH = '/admin/businesses'

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  mall: 'Shopping Mall',
  office: 'Office',
  dealership: 'Dealership',
  'service-center': 'Service Center',
  home: 'Home Charger',
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = flattenParams(searchParams)
  const q = toQuery(params.q)
  const status = pick(params.status, ['all', 'pending', 'approved', 'rejected'] as const, 'all')
  const page = toPage(params.page)

  const [listing, reports] = await Promise.all([
    listBusinessesPage({ q, status, page }),
    getBusinessPhotoReports(),
  ])
  const rows = listing.rows
  const { counts } = listing

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
          counts.all === 0
            ? 'Businesses applying to list their chargers will appear here.'
            : `${counts.pending} pending of ${counts.all} total.`
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

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <BusinessPhotoReview reports={reports} />

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
          <AdminSearch placeholder="Search business, owner, email or city" label="Search businesses" />
          <AdminFilterChips
            label="Filter by status"
            param="status"
            current={status}
            path={PATH}
            params={params}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'pending', label: 'Pending', count: counts.pending },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Building2 size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">
              {counts.all === 0 ? 'No applications yet' : 'No business matches that'}
            </p>
            <p className="mt-1 text-ui-sm text-slate-500">
              {counts.all === 0 ? 'The form at /business/signup posts straight here.' : 'Try another search or status.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const isPending = row.status === 'pending'
              const totalPorts = row.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)
              const website = safeHref(row.website)
              const approveBlocked = isPending
                ? validateForApproval({ lat: row.lat, lng: row.lng, chargers: row.chargers as ListingCharger[] })
                : null

              return (
                <li
                  key={row.id}
                  className={
                    isPending
                      ? 'rounded-xl border-y border-r border-l-4 border-slate-200 border-l-amber-500 bg-white p-5'
                      : 'rounded-xl border border-slate-200 bg-slate-50/60 p-5'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2.5 font-semibold text-slate-900">
                        {row.businessName}
                        <ReviewStatusBadge status={row.status} />
                      </p>

                      {/* The reason it was turned down, so the next operator
                          does not have to guess or ask. */}
                      {row.status === 'rejected' && row.reviewNote ? (
                        <p className="mt-2 max-w-2xl rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-ui-sm text-red-900">
                          <span className="font-semibold">
                            Rejected{row.reviewedAt ? ` ${formatRelativeTime(row.reviewedAt)}` : ''}:
                          </span>{' '}
                          {row.reviewNote}
                        </p>
                      ) : null}

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

                        {website ? (
                          <a
                            href={website}
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

                    <div className="flex shrink-0 flex-wrap items-start gap-2">
                      <Link
                        href={`/admin/businesses/${row.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                      >
                        <Pencil size={14} className="shrink-0" aria-hidden="true" />
                        Edit
                      </Link>
                      <BusinessStatusControl
                        status={row.status as BusinessStatus}
                        approveBlockedReason={approveBlocked}
                        action={async (next: BusinessStatus, note?: string) => {
                          'use server'
                          return setBusinessStatus(row.id, next, note)
                        }}
                      />
                      <DeleteButton
                        label={`the application from ${row.businessName}`}
                        consequence="its reviews, daily view statistics, photo reports and charger photos"
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

        <AdminPagination
          path={PATH}
          params={params}
          page={page}
          pageSize={listing.pageSize}
          total={listing.total}
          noun={['business', 'businesses']}
        />
      </div>
    </>
  )
}

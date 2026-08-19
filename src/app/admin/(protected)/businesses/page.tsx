// src/app/admin/(protected)/businesses/page.tsx
import { Building2, Globe, Mail, MapPin, Pencil, Phone, Plus, Zap } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { BusinessStatusControl, type BusinessStatus } from '@/components/admin/BusinessStatusControl'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deleteBusiness, setBusinessStatus } from '@/lib/db/business-actions'
import { getBusinesses } from '@/lib/db/queries'
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
  const pending = rows.filter((row) => row.status === 'pending').length

  return (
    <>
      <AdminHeader
        title="Business applications"
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
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-ui-xs font-semibold text-slate-700">
                            <Zap size={12} className="shrink-0" aria-hidden="true" />
                            {row.chargers.length} charger{row.chargers.length === 1 ? '' : 's'} ·{' '}
                            {totalPorts} port{totalPorts === 1 ? '' : 's'}
                          </span>

                          {row.chargers.map((charger, index) => (
                            <span
                              key={`${row.id}-c${index}`}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-ui-xs text-slate-600"
                            >
                              {charger.connectorType} · {charger.maxPowerKw}kW ×{charger.ports}
                            </span>
                          ))}
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

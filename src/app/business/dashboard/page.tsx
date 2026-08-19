// src/app/business/dashboard/page.tsx
import { Building2, CheckCircle2, Clock, Globe, MapPin, Phone, XCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { getBusinessesForUser } from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/db/session-actions'
import { formatRelativeTime } from '@/lib/utils'

/**
 * The owner's own listings.
 *
 * This page used to render MOCK_BUSINESS with invented view counts, click
 * counts, conversion rates and growth percentages — numbers no part of this
 * application measures. It now shows what is actually stored against the
 * signed-in account, and nothing else. When view tracking exists, the figures
 * can come back with something behind them.
 */

export const dynamic = 'force-dynamic'

const STATUS = {
  pending: {
    label: 'Under review',
    note: 'Submitted and waiting to be checked. It is not on the map yet.',
    chip: 'bg-amber-100 text-amber-800',
    Icon: Clock,
  },
  approved: {
    label: 'Live on the map',
    note: 'Approved and visible to drivers at the coordinates below.',
    chip: 'bg-emerald-100 text-emerald-800',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Not approved',
    note: 'This listing was not approved. Get in touch if you think that is wrong.',
    chip: 'bg-slate-200 text-slate-700',
    Icon: XCircle,
  },
} as const

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser()
  // Gated on the server. A client-side check would render the page first and
  // hide it after, which is not a gate.
  if (!user) redirect('/login?redirect=/business/dashboard')

  const businesses = await getBusinessesForUser(user.id)
  const primary = businesses[0]

  return (
    <BusinessDashboardLayout
      title="Your listings"
      subtitle={user.email}
      listing={
        primary
          ? {
              id: primary.id,
              name: primary.businessName,
              type: primary.businessType,
              city: primary.city,
              status: primary.status,
            }
          : undefined
      }
    >
      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Building2 size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <p className="text-ui-lg font-semibold text-slate-900">No listings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            Nothing has been submitted from this account.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            List your business
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {businesses.map((business) => {
            const state = STATUS[business.status as keyof typeof STATUS] ?? STATUS.pending
            const totalPorts = business.chargers.reduce((sum, c) => sum + (c.ports || 0), 0)

            return (
              <li
                key={business.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900">{business.businessName}</h2>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-ui-sm text-slate-600">
                      <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                      {business.address ? `${business.address}, ` : ''}
                      {business.city}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-ui-sm font-semibold ${state.chip}`}
                  >
                    <state.Icon size={14} className="shrink-0" aria-hidden="true" />
                    {state.label}
                  </span>
                </div>

                <p className="mt-3 text-ui-sm text-slate-500">{state.note}</p>

                <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">
                      Map pin
                    </dt>
                    <dd className="mt-1 font-mono text-ui-sm text-slate-700">
                      {business.lat !== null && business.lng !== null
                        ? `${business.lat.toFixed(5)}, ${business.lng.toFixed(5)}`
                        : 'Not set — cannot appear on the map'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contact
                    </dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-slate-700">
                      {business.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                          {business.phone}
                        </span>
                      ) : null}
                      {business.website ? (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-plug-blue-600 hover:underline"
                        >
                          <Globe size={13} className="shrink-0" aria-hidden="true" />
                          Website
                        </a>
                      ) : null}
                      {!business.phone && !business.website ? '—' : null}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-2.5 text-ui-xs font-semibold uppercase tracking-wide text-slate-400">
                    Chargers
                  </p>

                  {business.chargers.length === 0 ? (
                    <p className="text-ui-sm text-slate-500">None listed.</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-ui-xs font-semibold text-slate-700">
                        <Zap size={12} className="shrink-0" aria-hidden="true" />
                        {business.chargers.length} charger
                        {business.chargers.length === 1 ? '' : 's'} · {totalPorts} port
                        {totalPorts === 1 ? '' : 's'}
                      </span>

                      {business.chargers.map((charger, index) => (
                        <span
                          key={`${business.id}-c${index}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 font-mono text-ui-xs text-slate-600"
                        >
                          {charger.connectorType} · {charger.maxPowerKw}kW ×{charger.ports}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-5 text-ui-xs text-slate-400">
                  Submitted {formatRelativeTime(business.createdAt)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </BusinessDashboardLayout>
  )
}

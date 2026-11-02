// src/app/business/services/page.tsx
import { CheckCircle2, Clock, ExternalLink, Globe, Mail, MapPin, MessageCircle, Phone, XCircle } from '@/components/ui/icons'
import type { Metadata } from 'next'
import Link from 'next/link'

import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { listingHref } from '@/components/business/listing-state'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import { requireServicePortal, type OwnerService } from '@/lib/db/service-owner-queries'
import type { ServiceCategory } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { safeHref } from '@/lib/validate'

/**
 * The service side of the business portal: where each service application
 * stands, the reviewer's reason when it was not approved, and what drivers see
 * once it is live. The charger side's Overview, for services.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Your services' }

const SUPPORT = 'hello@plug.pk'

const STATUS = {
  pending: {
    label: 'Under review',
    note: 'Submitted and waiting to be checked by a person. It is not in the directory yet — the outcome will appear here.',
    chip: 'bg-amber-100 text-amber-800',
    Icon: Clock,
  },
  approved: {
    label: 'Live in the directory',
    note: 'Approved and listed under your category, where drivers searching for what you do can find you.',
    chip: 'bg-emerald-100 text-emerald-800',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Not approved',
    note: 'This listing was not approved. Editing it sends it back for another review.',
    chip: 'bg-red-100 text-red-800',
    Icon: XCircle,
  },
} as const

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

/** Opening hours as one line. */
function describeHours(hours: OwnerService['operatingHours']): string {
  if (!hours) return 'Not given'
  if (hours.is24Hours) return 'Open 24 hours'
  const open = DAYS.filter((day) => hours[day] && !hours[day]?.isClosed)
  if (open.length === 0) return 'Not given'
  const first = hours[open[0]!]!
  const same = open.every((day) => hours[day]?.open === first.open && hours[day]?.close === first.close)
  const days = open.length === 7 ? 'Every day' : `${open.length} days a week`
  return same ? `${days}, ${first.open}–${first.close}` : `${days}, hours vary by day`
}

function categoryLabel(category: string): string {
  return SERVICE_CATEGORY_META[category as ServiceCategory]?.label ?? category
}

export default async function ServicePortalOverview({
  searchParams,
}: {
  searchParams: { listing?: string | string[] }
}) {
  const portal = await requireServicePortal('/business/services', searchParams.listing)
  const { services, service: selected } = portal
  const ordered = [selected, ...services.filter((item) => item.id !== selected.id)]

  return (
    <BusinessDashboardLayout
      title="Your services"
      subtitle={portal.user.email}
      mode="services"
      canSwitch={portal.hasChargers}
      listing={{ id: selected.id, name: selected.name, type: categoryLabel(selected.category), city: selected.city, status: selected.status }}
      listings={services.map((item) => ({ id: item.id, name: item.name, status: item.status }))}
      publicHref={selected.status === 'approved' ? `/services/${selected.category}/${selected.slug}` : undefined}
    >
      <ul className="flex flex-col gap-4">
        {ordered.map((service) => {
          const state = STATUS[service.status as keyof typeof STATUS] ?? STATUS.pending
          const edit = listingHref('/business/services/profile', service.id, services.length)
          const website = safeHref(service.website)
          const social = safeHref(service.socialUrl)
          const address = [service.street, service.area, service.city].filter(Boolean).join(', ')

          return (
            <li
              key={service.id}
              className={cn(
                'rounded-2xl border bg-white p-6',
                service.id === selected.id && services.length > 1 ? 'border-plug-blue-200' : 'border-slate-200',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-ui-xs font-semibold uppercase tracking-wide text-plug-blue-700">{categoryLabel(service.category)}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{service.name}</h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-ui-sm text-slate-600">
                    <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {address}
                  </p>
                </div>
                <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-ui-sm font-semibold', state.chip)}>
                  <state.Icon size={14} className="shrink-0" aria-hidden="true" />
                  {state.label}
                </span>
              </div>

              <p className="mt-3 text-ui-sm text-slate-500">{state.note}</p>

              {service.status === 'rejected' ? (
                <div role="note" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-ui-sm font-semibold text-red-900">Reason given by the reviewer</p>
                  <p className="mt-1 whitespace-pre-line text-ui-sm leading-relaxed text-red-800">
                    {service.reviewNote ?? 'No reason was recorded.'}
                  </p>
                  <p className="mt-3 text-ui-sm text-red-800">
                    <Link href={edit} className="font-semibold underline">
                      Fix the details
                    </Link>{' '}
                    and save, or write to{' '}
                    <a
                      href={`mailto:${SUPPORT}?subject=${encodeURIComponent(`Service: ${service.name}`)}`}
                      className="inline-flex items-center gap-1 font-semibold underline"
                    >
                      <Mail size={13} aria-hidden="true" />
                      {SUPPORT}
                    </a>{' '}
                    if you think this is wrong.
                  </p>
                </div>
              ) : null}

              <p className="mt-5 border-t border-slate-100 pt-5 text-ui-sm leading-relaxed text-slate-700">{service.description}</p>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Contact</dt>
                  <dd className="mt-1 flex flex-col gap-1 text-ui-sm text-slate-700">
                    {service.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        {service.phone}
                      </span>
                    ) : null}
                    {service.whatsapp ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        {service.whatsapp}
                      </span>
                    ) : null}
                    {service.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                        {service.email}
                      </span>
                    ) : null}
                    {website || social ? (
                      <span className="flex flex-wrap gap-x-3">
                        {website ? (
                          <a href={website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-plug-blue-600 hover:underline">
                            <Globe size={13} className="shrink-0" aria-hidden="true" />
                            Website
                          </a>
                        ) : null}
                        {social ? (
                          <a href={social} target="_blank" rel="noreferrer noopener" className="text-plug-blue-600 hover:underline">
                            Social page
                          </a>
                        ) : null}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Opening hours</dt>
                  <dd className="mt-1 text-ui-sm text-slate-700">{describeHours(service.operatingHours)}</dd>
                  {service.pricing ? (
                    <>
                      <dt className="mt-3 text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Prices</dt>
                      <dd className="mt-1 whitespace-pre-line text-ui-sm text-slate-700">{service.pricing}</dd>
                    </>
                  ) : null}
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-ui-sm">
                <Link href={edit} className="font-semibold text-plug-blue-600 hover:underline">
                  Edit details
                </Link>
                {service.status === 'approved' ? (
                  <Link
                    href={`/services/${service.category}/${service.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-plug-blue-600 hover:underline"
                  >
                    View in the directory
                    <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                ) : null}
                <span className="ml-auto text-ui-xs text-slate-400">Applied {formatRelativeTime(service.createdAt)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </BusinessDashboardLayout>
  )
}

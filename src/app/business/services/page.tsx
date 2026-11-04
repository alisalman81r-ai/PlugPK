// src/app/business/services/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { btnClass, CARD, Ico, META, Pill } from '@/components/admin/network-kit'
import { BusinessDashboardLayout } from '@/components/business/BusinessDashboardLayout'
import { BizMotion, BizStat, BizStrip, LIFT } from '@/components/business/host/biz-kit'
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
    tone: 'warn',
    icon: 'clock',
  },
  approved: {
    label: 'Live in the directory',
    note: 'Approved and listed under your category, where drivers searching for what you do can find you.',
    tone: 'ok',
    icon: 'okc',
  },
  rejected: {
    label: 'Not approved',
    note: 'This listing was not approved. Editing it sends it back for another review.',
    tone: 'bad',
    icon: 'x',
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

  const live = services.filter((item) => item.status === 'approved').length
  const review = services.filter((item) => item.status === 'pending').length
  const refused = services.filter((item) => item.status === 'rejected').length

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
      <BizMotion className="max-w-[1100px]">
        <BizStrip label="Your services at a glance" cells={4}>
          <BizStat label="Listings" value={services.length} sub="On this account" lit />
          <BizStat label="Live" dot="ok" value={live} sub="In the directory" />
          <BizStat label="Under review" dot={review ? 'warn' : 'none'} value={review} sub="Checked by a person" />
          <BizStat label="Not approved" dot={refused ? 'bad' : 'none'} value={refused} sub={refused ? 'Edit to resubmit' : 'Nothing refused'} />
        </BizStrip>

        <ul className="m-0 grid list-none gap-3.5 p-0">
          {ordered.map((service) => {
            const state = STATUS[service.status as keyof typeof STATUS] ?? STATUS.pending
            const edit = listingHref('/business/services/profile', service.id, services.length)
            const website = safeHref(service.website)
            const social = safeHref(service.socialUrl)
            const address = [service.street, service.area, service.city].filter(Boolean).join(', ')
            const current = service.id === selected.id && services.length > 1

            return (
              <li key={service.id} data-biz-in="" className={cn(CARD, LIFT, 'p-6 max-[640px]:p-[18px]', current && 'border-ink/30')}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {categoryLabel(service.category)}
                      {current ? <span className="ml-2 rounded-md bg-volt px-1.5 py-0.5 text-ink">Selected</span> : null}
                    </span>
                    <h2 className="m-0 mt-1.5 font-display text-2xl font-normal leading-[1.2] text-ink">{service.name}</h2>
                    <div className={META}>
                      <span className="inline-flex items-center gap-1.5">
                        <Ico name="pinl" />
                        {address}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Ico name="clock" />
                        Applied {formatRelativeTime(service.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Pill tone={state.tone} icon={state.icon}>
                    {state.label}
                  </Pill>
                </div>

                <p className="mb-0 mt-3 text-sm text-muted">{state.note}</p>

                {service.status === 'rejected' ? (
                  <div role="note" className="mt-4 rounded-2xl border border-[rgba(255,90,31,.25)] bg-[rgba(255,90,31,.06)] p-4">
                    <p className="m-0 flex items-center gap-2 text-sm font-semibold text-[#8f2f0a] [&_svg]:h-4 [&_svg]:w-4">
                      <Ico name="alert" />
                      Reason given by the reviewer
                    </p>
                    <p className="mb-0 mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#8f2f0a]">
                      {service.reviewNote ?? 'No reason was recorded.'}
                    </p>
                    <p className="mb-0 mt-3 text-sm text-[#8f2f0a]">
                      <Link href={edit} className="font-semibold underline">
                        Fix the details
                      </Link>{' '}
                      and save, or write to{' '}
                      <a href={`mailto:${SUPPORT}?subject=${encodeURIComponent(`Service: ${service.name}`)}`} className="font-semibold underline">
                        {SUPPORT}
                      </a>{' '}
                      if you think this is wrong.
                    </p>
                  </div>
                ) : null}

                <p className="mb-0 mt-5 border-t border-ink/[.09] pt-5 text-[15px] leading-relaxed text-[#2c2f34]">{service.description}</p>

                <dl className="m-0 mt-5 grid gap-3.5 rounded-[18px] border border-ink/[.09] bg-paper p-[18px] sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">Contact</dt>
                    <dd className="m-0 mt-2 flex flex-col gap-1.5 text-sm text-ink [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-fog">
                      {service.phone ? (
                        <span className="inline-flex items-center gap-2 font-mono">
                          <Ico name="phone" />
                          {service.phone}
                        </span>
                      ) : null}
                      {service.whatsapp ? (
                        <span className="inline-flex items-center gap-2 font-mono">
                          <Ico name="phone" />
                          {service.whatsapp} <span className="font-sans text-xs text-muted">WhatsApp</span>
                        </span>
                      ) : null}
                      {service.email ? (
                        <span className="inline-flex min-w-0 items-center gap-2 break-all">
                          <Ico name="mail" />
                          {service.email}
                        </span>
                      ) : null}
                      {website || social ? (
                        <span className="flex flex-wrap gap-x-4">
                          {website ? (
                            <a href={website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 font-semibold text-ink underline-offset-2 hover:underline">
                              <Ico name="globe" />
                              Website
                            </a>
                          ) : null}
                          {social ? (
                            <a href={social} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 font-semibold text-ink underline-offset-2 hover:underline">
                              <Ico name="ext" />
                              Social page
                            </a>
                          ) : null}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">Opening hours</dt>
                    <dd className="m-0 mt-2 text-sm text-ink">{describeHours(service.operatingHours)}</dd>
                    {service.pricing ? (
                      <>
                        <dt className="mt-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">Prices</dt>
                        <dd className="m-0 mt-2 whitespace-pre-line text-sm text-ink">{service.pricing}</dd>
                      </>
                    ) : null}
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link href={edit} className={btnClass('ink', 'sm')}>
                    <Ico name="pen" />
                    Edit details
                  </Link>
                  {service.status === 'approved' ? (
                    <Link href={`/services/${service.category}/${service.slug}`} className={btnClass('line', 'sm')}>
                      <Ico name="ext" />
                      View in the directory
                    </Link>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </BizMotion>
    </BusinessDashboardLayout>
  )
}

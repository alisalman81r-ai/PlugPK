'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { DeleteButton } from '@/components/admin/DeleteButton'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import type { AdminServiceListRow } from '@/lib/db/admin-queries'
import { cn } from '@/lib/utils'

import { AdminSearch } from './AdminSearch'
import { buildHref, flattenParams } from './list-params'
import { ACT, CARD, EmptyCard, Ico, type IcoName, Pill, SNAME, SSUB, Select, TOOLS, TOOLS_ROW, rise } from './network-kit'

/** Each service type's colour (.sgroup --accent) and the icon its rows carry. */
const CATEGORY_STYLE: Record<string, { accent: string; icon: IcoName }> = {
  dealership: { accent: '#4C8DFF', icon: 'building' },
  'home-charger-installer': { accent: '#FFB020', icon: 'plug' },
  'roadside-assistance': { accent: '#FF5A1F', icon: 'alert' },
  'service-center': { accent: '#35D07F', icon: 'wrench' },
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * The decided services, one page at a time, grouped by type.
 *
 * The filters write to the URL and the server reads one filtered page, so the
 * selects below only navigate.
 */
export function AdminServicesDirectory({
  services,
  cities,
  category,
  city,
  total,
  onDelete,
}: {
  services: AdminServiceListRow[]
  cities: string[]
  category: string
  city: string
  /** Matches across every page. */
  total: number
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const go = (patch: Record<string, string>) =>
    router.push(buildHref(pathname, flattenParams(Object.fromEntries(searchParams.entries())), patch), { scroll: false })

  const grouped = React.useMemo(() => {
    const groups = new Map<string, AdminServiceListRow[]>()
    for (const service of services) {
      const group = groups.get(service.category)
      if (group) group.push(service)
      else groups.set(service.category, [service])
    }
    return Array.from(groups.entries()).sort(([first], [second]) => {
      const firstLabel = SERVICE_CATEGORY_META[first as keyof typeof SERVICE_CATEGORY_META]?.label ?? first
      const secondLabel = SERVICE_CATEGORY_META[second as keyof typeof SERVICE_CATEGORY_META]?.label ?? second
      return firstLabel.localeCompare(secondLabel)
    })
  }, [services])

  return (
    <div>
      <div {...rise(1)} className={TOOLS}>
        <div className={TOOLS_ROW}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink max-[640px]:hidden [&_svg]:h-[18px] [&_svg]:w-[18px]">
            <Ico name="filter" />
            Browse directory
          </span>
          <Select
            value={category}
            onChange={(event) => go({ category: event.target.value })}
            aria-label="Filter by service type"
            wrapClassName="max-[640px]:w-full"
          >
            <option value="all">All service types</option>
            {Object.entries(SERVICE_CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Select
            value={city}
            onChange={(event) => go({ city: event.target.value })}
            aria-label="Filter by city"
            wrapClassName="max-[640px]:w-full"
          >
            <option value="all">All cities</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <AdminSearch placeholder="Search name, slug, city or contact" label="Search the services directory" />
          <span
            aria-live="polite"
            className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/[.09] bg-white px-3 text-[13px] text-muted"
          >
            <b className="font-semibold text-ink">{total}</b> {total === 1 ? 'service matches' : 'services match'}
          </span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyCard title="No service matches." text="Try another search, or clear the filters." />
      ) : (
        <div className="grid content-start gap-3.5">
          {grouped.map(([categoryKey, rows], index) => {
            const label = SERVICE_CATEGORY_META[categoryKey as keyof typeof SERVICE_CATEGORY_META]?.label ?? categoryKey
            const style = CATEGORY_STYLE[categoryKey] ?? { accent: '#A3A7AE', icon: 'wrench' as IcoName }
            return (
              <section key={categoryKey} {...rise(index + 2)} aria-label={label} className={cn(CARD, 'overflow-hidden')}>
                <header
                  className="flex items-center justify-between gap-3 border-b border-l-4 border-b-ink/[.09] bg-paper px-6 py-[18px] max-[760px]:px-4"
                  style={{ borderLeftColor: style.accent }}
                >
                  <div>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Service type</span>
                    <h2 className="m-0 mt-1 font-display text-2xl font-normal leading-[1.1] text-ink">{label}</h2>
                  </div>
                  <span className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-ink/[.09] bg-white px-3 font-mono text-[13px] text-muted">
                    {plural(rows.length, 'service')}
                  </span>
                </header>
                <ul className="m-0 list-none p-0">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-[64px_minmax(0,1fr)_140px_110px_auto] items-center gap-4 border-t border-ink/[.09] px-6 py-3.5 transition-colors duration-200 first:border-t-0 hover:bg-paper max-[760px]:grid-cols-[56px_minmax(0,1fr)_auto] max-[760px]:px-4"
                    >
                      {/* The row's type, where the design shows a photo: the list
                          query carries no cover image, and a stock one would be
                          a picture of somebody else's business. */}
                      <span
                        aria-hidden="true"
                        className="grid h-11 w-16 place-items-center rounded-[10px] max-[760px]:w-14 [&_svg]:h-5 [&_svg]:w-5"
                        style={{ backgroundColor: `${style.accent}1f`, color: style.accent }}
                      >
                        <Ico name={style.icon} />
                      </span>
                      <div className="min-w-0">
                        <div className={cn(SNAME, 'whitespace-normal')}>
                          {row.name}
                          {row.isVerified ? (
                            <span title="Verified" className="inline-grid text-[#12804a]">
                              <Ico name="shield" label="Verified" className="h-[17px] w-[17px]" />
                            </span>
                          ) : null}
                        </div>
                        <div className={SSUB}>{row.slug}</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted max-[760px]:col-start-2 [&_svg]:h-[15px] [&_svg]:w-[15px]">
                        <Ico name="pinl" />
                        {row.city}
                      </span>
                      <span className="max-[760px]:col-start-2">
                        {row.status === 'approved' ? (
                          <Pill tone="ok">Approved</Pill>
                        ) : row.status === 'rejected' ? (
                          <Pill tone="bad">Rejected</Pill>
                        ) : (
                          <Pill tone="warn">Pending</Pill>
                        )}
                      </span>
                      <div className="flex min-w-[116px] items-start justify-end gap-1 max-[760px]:col-start-3 max-[760px]:row-start-1">
                        {row.status === 'approved' ? (
                          <Link
                            href={`/services/${row.category}/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${row.name} on the live site`}
                            className={ACT}
                          >
                            <Ico name="ext" />
                          </Link>
                        ) : null}
                        <Link href={`/admin/services/${row.id}`} aria-label={`Edit ${row.name}`} className={ACT}>
                          <Ico name="pen" />
                        </Link>
                        <DeleteButton label={row.name} action={() => onDelete(row.id)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { ExternalLink, Filter, Pencil, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { DeleteButton } from '@/components/admin/DeleteButton'
import { SERVICE_CATEGORY_META } from '@/lib/constants'
import type { AdminServiceRow } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

const STATUS_CHIP: Record<string, string> = {
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-300 bg-slate-50 text-slate-500',
}

const CATEGORY_ACCENT: Record<string, string> = {
  dealership: 'from-blue-500 to-cyan-400',
  'service-center': 'from-emerald-500 to-teal-400',
  'home-charger-installer': 'from-amber-500 to-orange-400',
  accessories: 'from-violet-500 to-fuchsia-400',
  insurance: 'from-slate-700 to-slate-500',
  'roadside-assistance': 'from-rose-500 to-red-400',
}

export function AdminServicesDirectory({
  services,
  onDelete,
}: {
  services: AdminServiceRow[]
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>
}) {
  const [category, setCategory] = React.useState('all')
  const [city, setCity] = React.useState('all')

  const cities = React.useMemo(
    () => Array.from(new Set(services.map((service) => service.city))).sort((a, b) => a.localeCompare(b)),
    [services],
  )

  const filtered = React.useMemo(
    () =>
      services.filter(
        (service) =>
          (category === 'all' || service.category === category) &&
          (city === 'all' || service.city === city),
      ),
    [services, category, city],
  )

  const grouped = React.useMemo(() => {
    const groups = new Map<string, AdminServiceRow[]>()
    for (const service of filtered) {
      const group = groups.get(service.category)
      if (group) group.push(service)
      else groups.set(service.category, [service])
    }
    return Array.from(groups.entries()).sort(([first], [second]) => {
      const firstLabel = SERVICE_CATEGORY_META[first as keyof typeof SERVICE_CATEGORY_META]?.label ?? first
      const secondLabel = SERVICE_CATEGORY_META[second as keyof typeof SERVICE_CATEGORY_META]?.label ?? second
      return firstLabel.localeCompare(secondLabel)
    })
  }, [filtered])

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_-20px_rgba(5,36,30,0.35)]">
        <div className="flex flex-wrap items-center gap-2.5 p-1.5">
          <span className="mr-1 inline-flex items-center gap-2 px-2 text-ui-sm font-bold text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-plug-blue-50 text-plug-blue-600">
              <Filter size={15} aria-hidden="true" />
            </span>
            Browse directory
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by service type"
            className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 text-ui-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-plug-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-plug-blue-500/30"
          >
            <option value="all">All service types</option>
            {Object.entries(SERVICE_CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Filter by city"
            className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 text-ui-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-plug-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-plug-blue-500/30"
          >
            <option value="all">All cities</option>
            {cities.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <span className="ml-auto rounded-lg bg-slate-50 px-3 py-2 text-ui-sm text-slate-500">
            <strong className="text-slate-900">{filtered.length}</strong> service{filtered.length === 1 ? '' : 's'} shown
          </span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-ui-sm text-slate-500">
          No services match these filters.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(([categoryKey, rows]) => {
            const label = SERVICE_CATEGORY_META[categoryKey as keyof typeof SERVICE_CATEGORY_META]?.label ?? categoryKey
            return (
              <section key={categoryKey} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-26px_rgba(5,36,30,0.55)]">
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-8 w-1 rounded-full bg-gradient-to-b ${CATEGORY_ACCENT[categoryKey] ?? 'from-plug-blue-500 to-cyan-400'}`} aria-hidden="true" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Service type</p>
                      <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900">{label}</h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 font-mono text-ui-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {rows.length} service{rows.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-ui-xs uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3 font-semibold">Business</th>
                        <th className="px-5 py-3 font-semibold">City</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                          <td className="px-5 py-4">
                            <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                              {row.name}
                              {row.isVerified ? <ShieldCheck size={14} className="text-plug-blue-600" aria-label="Verified" /> : null}
                            </p>
                            <p className="mt-0.5 font-mono text-ui-xs text-slate-400">{row.slug}</p>
                          </td>
                          <td className="px-5 py-4 text-ui-sm text-slate-600">{row.city}</td>
                          <td className="px-5 py-4">
                            <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-ui-xs font-semibold capitalize', STATUS_CHIP[row.status] ?? STATUS_CHIP.rejected)}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {row.status === 'approved' ? (
                                <Link href={`/services/${row.category}/${row.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${row.name} on the live site`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-700">
                                  <ExternalLink size={15} />
                                </Link>
                              ) : null}
                              <Link href={`/admin/services/${row.id}`} aria-label={`Edit ${row.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-plug-blue-100 hover:bg-plug-blue-50 hover:text-plug-blue-600">
                                <Pencil size={15} />
                              </Link>
                              <DeleteButton label={row.name} action={() => onDelete(row.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

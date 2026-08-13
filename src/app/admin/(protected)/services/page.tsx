// src/app/admin/(protected)/services/page.tsx
import { ExternalLink, Pencil, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deleteService } from '@/lib/db/actions'
import { getServices } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const services = await getServices()

  return (
    <>
      <AdminHeader
        title="Services"
        description={`${services.length} listed across the directory.`}
        action={
          <Link
            href="/admin/services/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Add service
          </Link>
        }
      />

      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-3 font-semibold">Business</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">City</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Rating</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                        {service.name}
                        {service.isVerified ? (
                          <ShieldCheck
                            size={14}
                            className="shrink-0 text-plug-blue-600"
                            aria-label="Verified"
                          />
                        ) : null}
                      </p>
                      <p className="mt-0.5 font-mono text-ui-xs text-slate-400">{service.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-ui-sm capitalize text-slate-600">
                      {service.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-ui-sm text-slate-600">{service.address.city}</td>
                    <td className="px-5 py-4 font-mono text-ui-sm text-slate-600">
                      {service.rating.toFixed(1)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/services/${service.category}/${service.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${service.name} on the live site`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <Link
                          href={`/admin/services/${service.id}`}
                          aria-label={`Edit ${service.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                        >
                          <Pencil size={15} />
                        </Link>
                        <DeleteButton
                          label={service.name}
                          action={async () => {
                            'use server'
                            return deleteService(service.id)
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

// src/app/(main)/partners/page.tsx
import type { Metadata } from 'next'
import { Building2, Handshake, MapPin, Zap } from 'lucide-react'
import Link from 'next/link'

import { PartnerList } from '@/components/partners/PartnerList'
import { SectionHeader } from '@/components/ui'
import { getPartners } from '@/lib/db/queries'

/**
 * The venues and homes sharing their chargers.
 *
 * These are the same records the map draws as "Partner business" pins — read
 * from the same place, under the same two conditions, so a partner listed here
 * is a partner a driver can actually navigate to. Nothing on this page is a
 * logo wall: every card links to a real listing with a real pin behind it.
 */

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'Hotels, restaurants, malls, offices and homes across Pakistan sharing their EV chargers on Plug.pk.',
}

export default async function PartnersPage() {
  const partners = await getPartners()

  const cities = new Set(partners.map((partner) => partner.city))
  const ports = partners.reduce((total, partner) => total + partner.portCount, 0)
  const homes = partners.filter((partner) => partner.type === 'home').length

  const stats = [
    { icon: Handshake, value: partners.length, label: partners.length === 1 ? 'Partner' : 'Partners' },
    { icon: MapPin, value: cities.size, label: cities.size === 1 ? 'City' : 'Cities' },
    { icon: Zap, value: ports, label: ports === 1 ? 'Charging port' : 'Charging ports' },
  ]

  return (
    <div className="container-plug py-14 lg:py-20">
      <SectionHeader
        eyebrow="Partners"
        title="The places that share their chargers"
        subtitle={
          partners.length === 0
            ? 'Approved listings appear here as businesses and home owners join.'
            : `${partners.length} listing${partners.length === 1 ? '' : 's'} across ${cities.size} ${cities.size === 1 ? 'city' : 'cities'}${homes > 0 ? `, including ${homes} home charger${homes === 1 ? '' : 's'}` : ''}.`
        }
        align="center"
      />

      {partners.length === 0 ? (
        // An honest empty state. Inventing partner logos here would be the
        // easiest lie on the site to tell and the hardest to walk back.
        <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Building2 size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <p className="text-ui-lg font-semibold text-slate-900">No partners yet</p>
          <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
            Once a listing is submitted and approved it appears here, on the map, and in the
            homepage count.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            List your business
          </Link>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-12 mt-10 grid max-w-2xl grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center"
              >
                <stat.icon
                  size={18}
                  className="mx-auto mb-2 text-plug-blue-600"
                  aria-hidden="true"
                />
                <p className="font-mono text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-ui-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <PartnerList partners={partners} />

          <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Have a charger to share?</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              List your venue or your home charger and drivers will find you on the map.
            </p>
            <Link
              href="/business/signup"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-gradient-brand px-7 text-ui font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.25)] transition-transform hover:-translate-y-0.5"
            >
              List your charger
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

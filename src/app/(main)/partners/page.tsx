// src/app/(main)/partners/page.tsx
import type { Metadata } from 'next'
import { ArrowRight, Building2 } from 'lucide-react'
import Link from 'next/link'

import { PartnerHero } from '@/components/partners/PartnerHero'
import { PartnerList } from '@/components/partners/PartnerList'
import { PartnerPricing } from '@/components/partners/PartnerPricing'
import { PartnerSteps } from '@/components/partners/PartnerSteps'
import { getPartners, getPlatformStats } from '@/lib/db/queries'

/**
 * Partner Up — the page that asks people to share their charger.
 *
 * Composed rather than written inline: hero, how it works, what you get,
 * plans, then the partners who have already joined. That last section is the
 * social proof, and it is real — the same records the map draws, so nobody is
 * being shown a wall of logos that leads nowhere. When there are none it says
 * so instead.
 */

export const metadata: Metadata = {
  title: 'Partner Up',
  description:
    'List your charger on Plug.pk — hotels, restaurants, offices and homes across Pakistan. Free to list, you set your own rates.',
}

export default async function PartnersPage() {
  const [partners, platform] = await Promise.all([getPartners(), getPlatformStats()])

  const cities = new Set(partners.map((partner) => partner.city))
  const ports = partners.reduce((total, partner) => total + partner.portCount, 0)
  const homes = partners.filter((partner) => partner.type === 'home').length

  return (
    <>
      <PartnerHero
        stats={{
          // Every charging point on the map, not just partner ones — it is the
          // honest answer to "is anything here yet".
          listings: platform.stations,
          cities: platform.cities,
          ports,
          partners: partners.length,
        }}
      />

      <PartnerSteps />
      <PartnerPricing />

      {/* ── Who has already joined ─────────────────────────────── */}
      <section id="directory" className="scroll-mt-24 bg-slate-50 py-20 lg:py-28">
        <div className="container-plug">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
              The directory
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Places already sharing their chargers
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              {partners.length === 0
                ? 'Approved listings appear here, on the map, and in the homepage count.'
                : `${partners.length} listing${partners.length === 1 ? '' : 's'} across ${cities.size} ${cities.size === 1 ? 'city' : 'cities'}, ${ports} charging port${ports === 1 ? '' : 's'}${homes > 0 ? `, including ${homes} home charger${homes === 1 ? '' : 's'}` : ''}.`}
            </p>
          </div>

          {partners.length === 0 ? (
            // An honest empty state. Inventing partner logos here would be the
            // easiest lie on this page to tell and the hardest to walk back.
            <div className="mx-auto max-w-lg rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Building2 size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
              <p className="text-ui-lg font-semibold text-slate-900">No partners yet</p>
              <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
                Be the first. Early listings are the ones drivers see when they open the map.
              </p>
              <Link
                href="/business/signup"
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
              >
                List your charger
              </Link>
            </div>
          ) : (
            <PartnerList partners={partners} />
          )}
        </div>
      </section>

      {/* ── Close ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-center lg:py-24">
        <div className="container-plug relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
            Have a charger sitting idle?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
            It takes a few minutes to list, costs nothing, and you decide what to charge.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="group inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 text-ui font-bold text-plug-blue-700 transition-transform duration-200 hover:-translate-y-0.5"
            >
              List your charger
              <ArrowRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/for-businesses#meeting"
              className="inline-flex h-13 items-center rounded-xl border border-white/20 bg-white/5 px-8 text-ui font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Ask a question first
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// src/app/(main)/partners/page.tsx
import type { Metadata } from 'next'
import { Building2, Plug } from 'lucide-react'
import Link from 'next/link'

import { PartnerDashboardPreview } from '@/components/partners/PartnerDashboardPreview'
import { PartnerHero } from '@/components/partners/PartnerHero'
import { PartnerList } from '@/components/partners/PartnerList'
import { PartnerPricing } from '@/components/partners/PartnerPricing'
import { PartnerSteps } from '@/components/partners/PartnerSteps'
import { PartnerVenueTypes } from '@/components/partners/PartnerVenueTypes'
import { FaqSection } from '@/components/shared/FaqSection'
import { SectionIntro } from '@/components/shared/SectionIntro'
import { PillButton } from '@/components/ui'
import { getPartners, getPlatformStats } from '@/lib/db/queries'
import { PARTNER_FAQS } from '@/lib/faqs'

/**
 * Partner Up — the page that asks people to share their charger.
 *
 * It reads: the pitch, what you get to see, how it works, what it costs, who has
 * already joined, the questions, then the ask again.
 *
 * Brought onto the shape the rest of the site settled on. It was the last
 * marketing page still on `bg-gradient-hero` and `container-plug`, while /map,
 * /routes and /community had all moved to one dark band, one 1400px measure, and
 * the first card lifted up into the band. Walking from the map to Partner Up
 * narrowed the page and changed the palette for no reason a visitor could see.
 *
 * The lifted card here is the dashboard preview. On a page asking somebody to
 * hand over their charger, the most persuasive thing is not the pitch — it is
 * seeing exactly what they get back, before the plans and before the form.
 *
 * The directory at the bottom is the social proof, and it is real: the same
 * records the map draws, so nobody is shown a wall of logos leading nowhere.
 * When there are none it says so.
 */

export const metadata: Metadata = {
  title: 'Partner Up',
  description:
    'List your charger on Plug.pk — hotels, restaurants, offices and homes across Pakistan. Free to list, you set your own rates.',
}

/** One measure, matching /map, /routes and /community. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * How far the preview card is pulled up into the dark band above it.
 *
 * The band's bottom padding is set against this, so about 3rem of dark always
 * shows between the last line of the pitch and the card's top edge — the same
 * gap /map and /community leave.
 */
const CARD_LIFT = '-mt-24 sm:-mt-28 lg:-mt-32'

export default async function PartnersPage() {
  const [partners, platform] = await Promise.all([getPartners(), getPlatformStats()])

  const cities = new Set(partners.map((partner) => partner.city))
  const ports = partners.reduce((total, partner) => total + partner.portCount, 0)
  const homes = partners.filter((partner) => partner.type === 'home').length

  /*
    Live listings per venue type, for the "who lists here" section.

    Counted here rather than inside the component so the component stays a pure
    render of numbers it was handed — the same reason CarDetails takes its pool as
    a prop instead of importing the catalogue.
  */
  const countsByType = partners.reduce<Record<string, number>>((counts, partner) => {
    counts[partner.type] = (counts[partner.type] ?? 0) + 1
    return counts
  }, {})

  return (
    <>
      <div className="min-h-below-nav bg-slate-50">
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

        {/* ── What a host gets, lifted into the band ───────────────── */}
        <div className={`relative z-10 ${CARD_LIFT} ${STAGE}`}>
          <PartnerDashboardPreview />
        </div>

        {/*
          Who lists here, before how it works.

          The marketplace pattern puts categories immediately after the hero, and
          the reason holds: the page used to answer "what happens next" before it
          had answered "is this for a place like mine?", which is the question
          somebody actually arrives with.
        */}
        <PartnerVenueTypes counts={countsByType} />

        <PartnerSteps />
        <PartnerPricing />

        {/* ── Who has already joined ───────────────────────────────── */}
        <section id="directory" className="scroll-mt-24 bg-slate-50 pb-20 pt-16 lg:pb-28 lg:pt-20">
          <div className={STAGE}>
            <SectionIntro
              eyebrow="The directory"
              icon={<Building2 size={13} aria-hidden="true" />}
              title="Places already sharing their chargers"
              lead={
                partners.length === 0
                  ? 'Approved listings appear here, on the map, and in the homepage count.'
                  : `${partners.length} listing${partners.length === 1 ? '' : 's'} across ${cities.size} ${cities.size === 1 ? 'city' : 'cities'}, ${ports} charging port${ports === 1 ? '' : 's'}${homes > 0 ? `, including ${homes} home charger${homes === 1 ? '' : 's'}` : ''}.`
              }
              className="mb-12"
            />

            {partners.length === 0 ? (
              // An honest empty state. Inventing partner logos here would be the
              // easiest lie on this page to tell and the hardest to walk back.
              <div className="mx-auto max-w-lg rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Building2 size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
                <p className="font-display text-ui-lg font-bold text-slate-900">No partners yet</p>
                <p className="mx-auto mt-1 max-w-sm text-ui-sm text-slate-500">
                  Be the first. Early listings are the ones drivers see when they open the map.
                </p>
                <Link
                  href="/business/signup"
                  className="mt-6 inline-flex h-11 items-center rounded-full bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors duration-150 hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
                >
                  List your charger
                </Link>
              </div>
            ) : (
              <PartnerList partners={partners} />
            )}
          </div>
        </section>
      </div>

      <FaqSection items={PARTNER_FAQS} tone="white" />

      {/* ── The ask, again ───────────────────────────────────────────
          A dark panel on the light page, not a full-bleed band.

          The footer directly below is already slate-950 and already carries a
          call to action — "Ready to find your next charge?", aimed at drivers.
          A second full-width slate-950 band immediately above it fused into one
          dark mass holding two different asks, with nothing to say where the
          page ended and the site chrome began. Bounded to the measure and set on
          the light ground, this reads as the page's closing panel and the footer
          reads as the footer. */}
      <section className="bg-slate-50 py-16 lg:py-20">
        <div className={STAGE}>
          <div className="relative overflow-hidden rounded-[2rem] bg-plug-navy-950 px-6 py-16 shadow-e4 sm:px-10 lg:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-plug-blue-600/30 blur-[120px]" />
              <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-plug-cyan-500/20 blur-[110px]" />
            </div>

            <div className="relative">
              <SectionIntro
                tone="dark"
                eyebrow="Partner Up"
                icon={<Plug size={13} aria-hidden="true" />}
                title="Have a charger sitting idle?"
                lead="It takes a few minutes to list, costs nothing, and you decide what to charge."
              />

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/business/signup"
                  className="inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-plug-cyan-400 to-plug-blue-500 px-7 text-ui font-bold text-slate-950 shadow-cyan transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <Plug size={17} aria-hidden="true" />
                  List your charger
                </Link>

                <PillButton href="/for-businesses#meeting" tone="light">
                  Ask a question first
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// src/app/(main)/partners/page.tsx
import type { Metadata } from 'next'
import { ArrowUpRight, Building2, Plug } from '@/components/ui/icons'

import { PartnerDashboardPreview } from '@/components/partners/PartnerDashboardPreview'
import { PartnerHero } from '@/components/partners/PartnerHero'
import { PartnerList } from '@/components/partners/PartnerList'
import { PartnerMeeting } from '@/components/partners/PartnerMeeting'
import { PartnerPricing } from '@/components/partners/PartnerPricing'
import { PartnerSteps } from '@/components/partners/PartnerSteps'
import { PartnerVenueTypes } from '@/components/partners/PartnerVenueTypes'
import { FaqSection } from '@/components/shared/FaqSection'
import { Reveal } from '@/components/v2/Reveal'
import { Btn, BtnEnd, CtaBand, Eyebrow, H2_CLASS, Hl, LEAD_CLASS, Section, SectionHead, WRAP } from '@/components/v2/ui'
import { getPartners, getPlatformStats } from '@/lib/db/queries'
import { PARTNER_FAQS } from '@/lib/faqs'
import { cn } from '@/lib/utils'

/**
 * Partner Up — the page that asks people to share their charger, in the
 * landing-v2 layout (partner.html).
 *
 * It reads: the pitch, what you get to see (the dashboard sheet lifted into the
 * hero), who lists here, how it works, what you get, what it costs, who has
 * already joined, a meeting request, the questions, then the ask again.
 *
 * The directory is the social proof, and it is real: the same records the map
 * draws, so nobody is shown a wall of logos leading nowhere. When there are
 * none it says so.
 */

export const metadata: Metadata = {
  title: 'Partner Up',
  description:
    'List your charger on plugpk — hotels, restaurants, offices and homes across Pakistan. PKR 4,999 a month to list, and you set your own rates.',
  // The one business landing page: /for-businesses redirects here.
  alternates: { canonical: '/partners' },
}

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many)

export default async function PartnersPage() {
  const [partners, platform] = await Promise.all([getPartners(), getPlatformStats()])

  const cities = new Set(partners.map((partner) => partner.city))
  const ports = partners.reduce((total, partner) => total + partner.portCount, 0)
  const homes = partners.filter((partner) => partner.type === 'home').length

  /* Live listings per venue type, for the "who lists here" section. */
  const countsByType = partners.reduce<Record<string, number>>((counts, partner) => {
    counts[partner.type] = (counts[partner.type] ?? 0) + 1
    return counts
  }, {})

  const mono = (n: number) => <span className="font-mono text-ink">{n.toLocaleString('en-PK')}</span>

  return (
    <>
      <PartnerHero
        stats={{
          // Every charging point on the map, not just partner ones — the honest
          // answer to "is anything here yet".
          listings: platform.stations,
          cities: platform.cities,
          ports,
          partners: partners.length,
        }}
      />

      <PartnerDashboardPreview />

      <PartnerVenueTypes counts={countsByType} />

      <PartnerSteps />
      <PartnerPricing />

      {/* ── Who has already joined ─────────────────────────────────── */}
      <Section tone="chalk" id="directory" className="scroll-mt-[var(--nav-h)]">
        <div className={WRAP}>
          <SectionHead
            eyebrow="The directory"
            title={
              <>
                Places already <Hl>sharing their chargers</Hl>
              </>
            }
            lead={
              partners.length === 0 ? (
                'Approved listings appear here, on the map, and in the homepage count.'
              ) : (
                <>
                  {mono(partners.length)} {plural(partners.length, 'listing')} across {mono(cities.size)}{' '}
                  {plural(cities.size, 'city', 'cities')}, {mono(ports)} charging {plural(ports, 'port')}
                  {homes > 0 ? (
                    <>
                      , including {mono(homes)} home {plural(homes, 'charger')}
                    </>
                  ) : null}
                  .
                </>
              )
            }
          />

          {partners.length === 0 ? (
            // An honest empty state. Inventing partner logos here would be the
            // easiest lie on this page to tell and the hardest to walk back.
            <div className="mx-auto grid max-w-xl justify-items-center gap-2 rounded-[28px] border-[1.5px] border-dashed border-ink/20 bg-paper px-6 py-14 text-center">
              <span aria-hidden="true" className="mb-1.5 grid h-14 w-14 place-items-center rounded-full bg-stone text-ink">
                <Building2 size={22} />
              </span>
              <h3 className="font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium">No partners yet</h3>
              <p className="max-w-[30rem] text-muted">
                Be the first. Early listings are the ones drivers see when they open the map.
              </p>
              <Btn href="/business/signup" variant="ink" size="sm" className="mt-3">
                List your charger
              </Btn>
            </div>
          ) : (
            <Reveal>
              <PartnerList partners={partners} />
            </Reveal>
          )}
        </div>
      </Section>

      <PartnerMeeting />

      <FaqSection items={PARTNER_FAQS} tone="muted" className="pb-[clamp(56px,7vw,96px)]" />

      {/* ── The ask, again ───────────────────────────────────────────── */}
      <section data-theme="light" className="bg-chalk pb-[clamp(80px,9vw,128px)]">
        <div className={WRAP}>
          <Reveal>
            <CtaBand className="grid justify-items-center py-[clamp(64px,8vw,104px)] text-center">
              <svg
                viewBox="0 0 600 600"
                aria-hidden="true"
                className="absolute -bottom-[320px] -left-[220px] -z-[1] w-[640px] fill-none stroke-volt/[0.12]"
              >
                <circle cx="300" cy="300" r="120" />
                <circle cx="300" cy="300" r="200" />
                <circle cx="300" cy="300" r="280" />
              </svg>
              <Eyebrow tone="volt">Partner up</Eyebrow>
              <h2 className={cn(H2_CLASS, 'text-white')}>
                Have a charger <Hl dark>sitting idle?</Hl>
              </h2>
              <p className={cn(LEAD_CLASS, 'mx-auto text-white/70')}>
                Applying takes a few minutes and costs nothing. A listing is PKR 4,999 a month, and you decide what to
                charge.
              </p>
              <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Btn href="/business/signup" variant="volt" size="xl" className="w-full sm:w-auto">
                  <Plug aria-hidden="true" />
                  List your charger
                  <BtnEnd />
                </Btn>
                <Btn href="#meeting" variant="ghostDark" size="lg" className="w-full sm:w-auto">
                  Ask a question first
                  <ArrowUpRight aria-hidden="true" />
                </Btn>
              </div>
            </CtaBand>
          </Reveal>
        </div>
      </section>
    </>
  )
}

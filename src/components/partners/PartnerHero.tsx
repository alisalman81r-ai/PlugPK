// src/components/partners/PartnerHero.tsx
import { ArrowUpRight, Check, Plug } from '@/components/ui/icons'

import { CountUp } from '@/components/v2/Reveal'
import { Btn, BtnArrow, HeroStats, Hl, PageHero } from '@/components/v2/ui'

/**
 * The pitch at the top of Partner Up — landing-v2's .phero with the page's
 * .pt-checks row, two actions and the .pstats strip.
 *
 * ── Still no invented metrics ─────────────────────────────────────────
 *
 * Reference designs for this kind of page lean on "2,000+ active drivers" and
 * "15,000 views a month", and on a young product every one of those is made up.
 * The counts here come from the database, and any that are still zero are left
 * out rather than dressed up. Below two figures the strip is dropped entirely
 * and a sentence does the work instead: "0 partners" turns the honest thing
 * into the discouraging thing.
 *
 * The lifted dashboard preview overlaps this band (see PartnerDashboardPreview),
 * so PageHero keeps its `lift` padding.
 */

export interface PartnerHeroProps {
  stats: {
    listings: number
    cities: number
    ports: number
    partners: number
  }
}

const PROMISES = ['PKR 4,999 a month', 'You set your rates', 'Verified before it goes live']

export function PartnerHero({ stats }: PartnerHeroProps) {
  const figures = [
    { value: stats.listings, label: 'Charging points' },
    { value: stats.cities, label: stats.cities === 1 ? 'City' : 'Cities' },
    { value: stats.partners, label: stats.partners === 1 ? 'Partner' : 'Partners' },
  ].filter((figure) => figure.value > 0)

  return (
    <PageHero
      title={
        <>
          Your charger, <Hl dark>on the map</Hl>
        </>
      }
      sub="A bank of chargers at your hotel or the single unit on your driveway. Listing it puts you on the map drivers search when they need a charge — and gives you a dashboard showing who found you."
    >
      <ul className="mt-[26px] flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-[22px] sm:gap-y-2.5">
        {PROMISES.map((promise) => (
          <li key={promise} className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
            <span aria-hidden="true" className="grid h-[18px] w-[18px] place-items-center rounded-full bg-volt/[0.12] text-volt">
              <Check size={12} />
            </span>
            {promise}
          </li>
        ))}
      </ul>

      <div className="mt-[34px] flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
        <Btn href="/business/signup" variant="volt" size="lg">
          <Plug aria-hidden="true" />
          List your charger
          <BtnArrow />
        </Btn>
        <Btn href="#pricing" variant="ghostDark" size="lg">
          See the plans
          <ArrowUpRight aria-hidden="true" />
        </Btn>
      </div>

      {figures.length >= 2 ? (
        <HeroStats
          items={figures.map((figure) => ({ value: <CountUp value={figure.value} />, label: figure.label }))}
        />
      ) : (
        <p className="mx-auto mt-11 max-w-sm text-sm leading-relaxed text-white/70">
          We are building the map now — early listings are the first drivers see.
        </p>
      )}
    </PageHero>
  )
}

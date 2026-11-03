// src/components/partners/PartnerHero.tsx
import { ArrowUpRight, Check, Plug } from '@/components/ui/icons'

import { CountUp } from '@/components/v2/Reveal'
import { Btn, BtnArrow, HeroStats, Hl } from '@/components/v2/ui'

/**
 * The pitch at the top of Partner Up — landing-v2's .phero with the page's
 * .pt-checks row, two actions and the .pstats strip.
 *
 * PageHero's markup, written out here so that the sub, the checks, the actions
 * and the stats each enter on their own beat, as partner.html's do (pages.js
 * staggers .phero__sub, .phero [data-hero], .phero__actions and .pstats one
 * after another). PageHero would wrap the last three in a single item.
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
 * so the band keeps PageHero's `lift` padding.
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
    <section
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]"
      />
      <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        <h1 data-hero-title="" className="m-0 text-balance font-display text-[clamp(42px,5.6vw,88px)] leading-none">
          Your charger, <Hl dark>on the map</Hl>
        </h1>
        <p
          data-hero-item=""
          className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70"
        >
          A bank of chargers at your hotel or the single unit on your driveway. Listing it puts you on the map drivers
          search when they need a charge — and gives you a dashboard showing who found you.
        </p>

        <ul
          data-hero-item=""
          className="mt-[26px] flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-[22px] sm:gap-y-2.5"
        >
          {PROMISES.map((promise) => (
            <li key={promise} className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
              <span aria-hidden="true" className="grid h-[18px] w-[18px] place-items-center rounded-full bg-volt/[0.12] text-volt">
                <Check size={12} />
              </span>
              {promise}
            </li>
          ))}
        </ul>

        <div
          data-hero-item=""
          className="mt-[34px] flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap"
        >
          <Btn href="/business/signup" variant="volt" size="lg">
            <Plug aria-hidden="true" />
            List your charger
            <BtnArrow />
          </Btn>
          <Btn href="#pricing" variant="ghostDark" size="lg" magnetic={false}>
            See the plans
            <ArrowUpRight aria-hidden="true" />
          </Btn>
        </div>

        {figures.length >= 2 ? (
          <div data-hero-item="" className="grid w-full justify-items-center">
            <HeroStats
              items={figures.map((figure) => ({ value: <CountUp value={figure.value} />, label: figure.label }))}
            />
          </div>
        ) : (
          <p data-hero-item="" className="mx-auto mt-11 max-w-sm text-sm leading-relaxed text-white/70">
            We are building the map now — early listings are the first drivers see.
          </p>
        )}
      </div>
    </section>
  )
}

// src/components/services/ServiceHero.tsx
import { CountUp } from '@/components/v2/Reveal'
import { Btn, BtnArrow, HeroStats, Hl } from '@/components/v2/ui'
import { SERVICE_CATEGORY_KEYS } from '@/lib/constants'

import { ServiceHeroSearch } from './ServiceHeroSearch'

export interface ServiceHeroProps {
  totalServices: number
  /**
   * Cities that have at least one listed service.
   *
   * This used to be PAKISTAN_CITIES.length — the length of the dropdown people
   * choose from, presented as coverage. Those are different numbers, and only
   * this one is a claim the listings below can support.
   */
  citiesCovered: number
}

/**
 * The directory's ink hero (landing-v2 .phero on services.html): the title,
 * a white search pill, the figures strip, and the way in for providers.
 *
 * PageHero's frame, written out here because the design brings each part in
 * on its own beat — the title's letters rise, then the sub, the search, the
 * figures, the offer and the note follow 0.07s apart, each a data-hero-item
 * (pages.js `.phero__sub, .psearch, .pstats, .phero [data-hero], .phero__note`).
 * The figures count up from 0 (data-count).
 */
export function ServiceHero({ totalServices, citiesCovered }: ServiceHeroProps) {
  const stats = [
    { value: <CountUp value={totalServices} />, label: 'Services' },
    { value: <CountUp value={SERVICE_CATEGORY_KEYS.length} />, label: 'Categories' },
    { value: <CountUp value={citiesCovered} />, label: 'Cities' },
  ]

  return (
    <section
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(120px,11vw,150px)] pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px]"
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
          Everything your EV needs in <Hl dark>one place</Hl>
        </h1>
        <p data-hero-item="" className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70">
          From dealerships to home charger installation — find every EV service across Pakistan.
        </p>

        <ServiceHeroSearch />

        <div data-hero-item="">
          <HeroStats items={stats} />
        </div>

        {/*
          The way in for the other side of this directory. Under the figures
          rather than beside the search: a driver looking for a mechanic is the
          common case and keeps the top of the page, and a provider looking to
          be listed will read this far.
        */}
        <div
          data-hero-item=""
          className="mt-[34px] flex flex-wrap items-center justify-center gap-x-3.5 gap-y-3 text-sm text-white/60"
        >
          <span>Offer an EV service?</span>
          <Btn href="/services/list" variant="ghostDark" size="sm" className="h-11">
            Apply to be listed
            <BtnArrow />
          </Btn>
        </div>
        <p data-hero-item="" className="mt-2.5 text-[13px] text-white/45">
          Checked by our team before it goes live.
        </p>
      </div>
    </section>
  )
}

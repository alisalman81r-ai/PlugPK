// src/components/services/ServiceHero.tsx
import { Search } from '@/components/ui/icons'

import { SearchSelect } from '@/components/ui/SearchSelect'
import { Btn, BtnArrow, HeroStats, Hl, PageHero, btnClass } from '@/components/v2/ui'
import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS } from '@/lib/constants'

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
 * The directory's ink hero (landing-v2 .phero): the title, a white search
 * pill, the figures strip, and the way in for providers.
 *
 * The search is a plain GET back to /services. The page reads q and city
 * from the URL and seeds the filter state, so this stays a server component.
 * On a phone the pill wraps into a card — input, then city and the button —
 * rather than hiding the city picker and the submit, which are the two
 * controls that make it a search rather than a text box.
 */
export function ServiceHero({ totalServices, citiesCovered }: ServiceHeroProps) {
  const stats = [
    { value: totalServices.toLocaleString('en-PK'), label: 'Services' },
    { value: String(SERVICE_CATEGORY_KEYS.length), label: 'Categories' },
    { value: String(citiesCovered), label: 'Cities' },
  ]

  return (
    <PageHero
      className="pb-[clamp(120px,11vw,150px)]"
      title={
        <>
          Everything your EV needs in <Hl dark>one place</Hl>
        </>
      }
      sub="From dealerships to home charger installation — find every EV service across Pakistan."
    >
      <form
        action="/services"
        method="get"
        role="search"
        className="relative mt-[34px] flex w-full max-w-[660px] flex-wrap items-center gap-2 rounded-[26px] bg-white p-2 text-left shadow-[0_24px_60px_-24px_rgba(212,255,58,.35)] sm:h-16 sm:flex-nowrap sm:rounded-full sm:py-[7px] sm:pl-[52px] sm:pr-[7px]"
      >
        <Search
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-[23px] text-fog sm:top-1/2 sm:-translate-y-1/2"
        />
        <input
          type="search"
          name="q"
          placeholder="Search services, dealers, installers..."
          aria-label="Search services"
          autoComplete="off"
          className="h-[50px] min-w-0 flex-1 basis-full border-0 bg-transparent pl-10 text-base text-ink outline-none placeholder:text-fog sm:h-full sm:basis-auto sm:pl-0 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {/* Not a native select: with 103 cities the browser drew its list
            the full height of the screen. This one opens within the window
            and scrolls; its hidden input keeps the form's ?city=. */}
        <SearchSelect
          name="city"
          ariaLabel="Filter by city"
          options={PAKISTAN_CITIES}
          searchPlaceholder="Type a city"
          className="h-[46px] min-w-0 flex-1 rounded-full border-0 bg-chalk px-4 text-sm text-ink hover:border-0 focus-visible:ring-volt/60 sm:w-40 sm:flex-none sm:rounded-none sm:border-l sm:border-ink/10 sm:bg-transparent sm:px-3.5"
        />
        <button type="submit" className={btnClass('volt', 'md', 'h-[50px] shrink-0 shadow-none hover:bg-ink hover:text-white')}>
          Search
        </button>
      </form>

      <HeroStats items={stats} />

      {/*
        The way in for the other side of this directory. Under the figures
        rather than beside the search: a driver looking for a mechanic is the
        common case and keeps the top of the page, and a provider looking to
        be listed will read this far.
      */}
      <div className="mt-[34px] flex flex-wrap items-center justify-center gap-x-3.5 gap-y-3 text-sm text-white/60">
        <span>Offer an EV service?</span>
        <Btn href="/services/list" variant="ghostDark" size="sm" className="h-11">
          Apply to be listed
          <BtnArrow />
        </Btn>
      </div>
      <p className="mt-2.5 text-[13px] text-white/45">Checked by our team before it goes live.</p>
    </PageHero>
  )
}

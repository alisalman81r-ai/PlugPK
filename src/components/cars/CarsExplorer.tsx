// src/components/cars/CarsExplorer.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { useFavouriteCars } from '@/hooks/useFavouriteCars'
import {
  EMPTY_FILTERS,
  filterCars,
  filtersToParams,
  paramsToFilters,
  searchCars,
  type CarFilterState,
  type CarSort,
} from '@/lib/cars'

import { BrandRail } from './BrandRail'
import { CarHero } from './CarHero'
import { CarsBrowser } from './CarsBrowser'

/**
 * The whole discovery experience, and the single owner of its state.
 *
 * Search, filters and sort live here because three separate surfaces read them
 * — the hero's search box and brand select, the brand rail, and the sidebar and
 * sort in the results — and any of those holding its own copy is how two
 * controls end up disagreeing about what is being shown.
 *
 * State is mirrored into the URL. Without that a filtered view cannot be sent
 * to anybody, bookmarked, or returned to with the back button, which are the
 * three things somebody does after finding a car they like. The URL is the
 * source on first load and a reflection afterwards:
 *
 *   - Initial state is read from the query string, so a shared link opens the
 *     view it describes.
 *   - Changes are written with replace(), not push(), so typing five characters
 *     leaves one history entry rather than five — the back button should exit
 *     the page, not walk backwards through a search.
 *   - scroll: false, because Next scrolls to the top on navigation by default
 *     and the results are below the fold; without it every keystroke would
 *     yank the page upward.
 */

/**
 * The masthead over the grid, one per powertrain.
 *
 * ── Why the heading says what the powertrain IS ───────────────────────
 *
 * The segmented control is the first cut almost every buyer makes, and it is
 * made out of four acronyms that are routinely confused with each other — a
 * plug-in hybrid and a range extender both have a plug and an engine, and a
 * "hybrid" has neither socket nor any way to charge it. A visitor who picks the
 * wrong segment does not get an error; they get a grid of cars that cannot do
 * what they assumed, and nothing on the page tells them so.
 *
 * So the heading for each segment states the mechanical distinction rather than
 * restating its own label. "Plug-in hybrid: 9 cars" is a count. "A plug and an
 * engine — both can drive the wheels" is the answer to the question the segment
 * was being used to ask. It costs two lines that were going to be filled with
 * something anyway.
 *
 * Every claim here is a fact about the drivetrain, not a sales line: an EV has
 * no engine, a REEV's engine never turns the wheels, an HEV has no socket. None
 * of it is derived from the rows, because none of it varies by row.
 */
interface Masthead {
  /** Distinguishes the block for React's key, so the entrance replays. */
  id: string
  eyebrow: string
  /** Set in ink. */
  title: string
  /** Set in navy, on its own line. */
  emphasis: string
  blurb: string
}

const ALL_CARS_MASTHEAD: Masthead = {
  id: 'all',
  eyebrow: 'The catalogue',
  title: 'Every figure,',
  emphasis: 'as published',
  blurb:
    'Nothing estimated and nothing averaged — filter, sort and compare on the numbers the manufacturer actually stated.',
}

const CATEGORY_MASTHEAD: Record<CarCategory, Masthead> = {
  EV: {
    id: 'EV',
    eyebrow: 'Fully electric',
    title: 'Battery only,',
    emphasis: 'no engine at all',
    blurb:
      'Driven entirely by its motor and charged from a plug. There is no engine, no fuel tank and no exhaust — the range below is the whole range.',
  },
  PHEV: {
    id: 'PHEV',
    eyebrow: 'Plug-in hybrid',
    title: 'A plug',
    emphasis: 'and an engine',
    blurb:
      'Charge it for the daily run and the engine covers everything past that. Both the motor and the engine can drive the wheels, so the electric range is the shorter of two numbers.',
  },
  REEV: {
    id: 'REEV',
    eyebrow: 'Range extender',
    title: 'The motor drives,',
    emphasis: 'the engine generates',
    blurb:
      'The wheels are turned by the motor at all times. The engine on board never drives them — it runs as a generator once the battery is low.',
  },
  Hybrid: {
    id: 'Hybrid',
    eyebrow: 'Hybrid',
    title: 'No plug,',
    emphasis: 'nothing to charge',
    blurb:
      'Petrol driven, with a small battery the car fills itself while braking. There is no socket, so no charger and no electric-only range worth quoting.',
  },
}

export interface CarsExplorerProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  /**
   * Rendered between the hero and the catalogue.
   *
   * A slot rather than an import, because what goes here is computed on the
   * server from the full dataset and never changes with the filters — passing
   * the finished element keeps that work out of the client bundle.
   *
   * Named for the position rather than the contents. It was `insights`, after
   * the "At a glance" panel it carried; that panel is gone and the prop now
   * holds the brand strip, so a name describing one of its former occupants
   * would send the next reader looking for something that is not there.
   */
  beforeResults?: React.ReactNode
}

export function CarsExplorer({
  cars,
  brands,
  categories,
  connectors,
  beforeResults,
}: CarsExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Seeded from the URL exactly once.
   *
   * A useState initialiser rather than an effect that syncs both ways: two-way
   * binding between state and the address bar fights itself, and the only
   * moment the URL needs to win is the first render.
   */
  const initial = React.useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [query, setQuery] = React.useState(initial.query)
  const [filters, setFilters] = React.useState<CarFilterState>(initial.filters)
  const [sort, setSort] = React.useState<CarSort>(initial.sort)
  const [savedOnly, setSavedOnly] = React.useState(false)

  const favourites = useFavouriteCars()
  const resultsRef = React.useRef<HTMLDivElement>(null)

  /**
   * Write the state back to the address bar.
   *
   * Deferred rather than immediate: on a long filter interaction this fires on
   * every keystroke, and router.replace is not free. A short timeout collapses
   * a burst of typing into one navigation.
   */
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = filtersToParams(query, filters, sort)
      const next = params.toString()
      if (next === window.location.search.replace(/^\?/, '')) return
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, filters, sort, pathname, router])

  /** Brand counts for the rail, computed with the brand facet itself removed. */
  const brandCounts = React.useMemo(() => {
    const base = filterCars(searchCars(cars, query), {
      ...filters,
      brands: [],
    })
    const out: Record<string, number> = {}
    for (const brand of brands) out[brand] = base.filter((car) => car.brand === brand).length
    return out
  }, [cars, query, filters, brands])

  /**
   * The masthead follows the segmented control and nothing else.
   *
   * The segments are single-select — one category or none — so anything other
   * than exactly one selected category is the catalogue as a whole. That covers
   * the empty case and also the state the sidebar can still produce, where two
   * powertrains are ticked at once: there is no single heading that honestly
   * describes "PHEVs and hybrids", so it falls back rather than picking one.
   */
  const activeCategory =
    filters.categories.length === 1 ? (filters.categories[0] ?? null) : null

  const masthead =
    activeCategory === null ? ALL_CARS_MASTHEAD : CATEGORY_MASTHEAD[activeCategory]

  /*
    Brands within the heading's own subject.

    Counted off the category alone, not off the full filter state — the heading
    names a powertrain, so its index line should answer "how many brands make
    one of these", which does not change when somebody also ticks 60+ kWh. The
    number that responds to every filter is the aria-live count below the
    segments, and these two are deliberately measuring different things.
  */
  const mastheadBrands = React.useMemo(() => {
    const scope =
      activeCategory === null ? cars : cars.filter((car) => car.category === activeCategory)
    return new Set(scope.map((car) => car.brand)).size
  }, [cars, activeCategory])

  /**
   * The hero select shows a brand only when exactly one is chosen — with two
   * ticked there is no single value a `<select>` could honestly display, so it
   * falls back to "All brands" rather than implying the other is off.
   */
  const heroBrand = filters.brands.length === 1 ? (filters.brands[0] ?? null) : null

  const shown = React.useMemo(() => {
    const matched = filterCars(searchCars(cars, query), filters)
    return savedOnly ? matched.filter((car) => favourites.ids.includes(car.id)) : matched
  }, [cars, query, filters, savedOnly, favourites.ids])

  const stats = React.useMemo(
    () => [
      {
        value: String(shown.length),
        label: shown.length === cars.length ? 'Cars' : 'Matches',
      },
      {
        value: String(new Set(shown.map((car) => car.brand)).size),
        label: 'Brands',
      },
      {
        value: String(shown.filter((car) => car.category === 'EV').length),
        label: 'Full EV',
      },
    ],
    [shown, cars.length],
  )

  const scrollToResults = () =>
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <CarHero
        query={query}
        onQueryChange={setQuery}
        brand={heroBrand}
        onBrandChange={(brand) =>
          setFilters((current) => ({
            ...current,
            brands: brand ? [brand] : [],
          }))
        }
        brands={brands}
        stats={stats}
        onSubmit={scrollToResults}
      />

      {beforeResults}

      {/*
        A grey ground under the catalogue, where this used to be white.

        The cards are flat now — a hairline border and no shadow at rest — and a
        white card on a white page needs a shadow to exist at all. Thirty-six of
        those shadows is a grey haze, and a card already lifted off the page has
        nowhere left to go on hover. Moving the separation into the ground gets
        it for free, gives the hover somewhere to go, and makes the white
        surfaces that should read as controls — the filter panel, the brand
        tiles, the segments, the sort — read as controls.

        slate-100 rather than slate-50: at #F8FAFC the cards were not reliably
        distinguishable from the page on a dim laptop screen, which defeats the
        point of the change.
      */}
      {/*
        The ground, and why it is no longer one flat grey.

        slate-100 stays — the note above is right that the cards need something
        to sit on and that slate-50 was too close to white to do it. What it was
        missing is that a single flat fill is the one surface a photograph of a
        showroom never has. Three layers, none of which change the value enough
        to affect the card separation the note is protecting:

          a wash    light falling from the top of the section, so the ground is
                    brightest where the heading is and settles as the grid runs
                    on. This is what stops eight rows of cards reading as eight
                    rows of the same thing.
          a grain   the site's own .grain, already tuned to 0.035 — visible as
                    texture, never as noise. It is what makes the white cards
                    read as paper on a surface rather than as holes cut in grey.
          an edge   a hairline that fades out at both ends, so the section
                    starts on a drawn line rather than a colour change.

        All three are decoration and all three are aria-hidden. None of them
        moves, so the section costs a paint and nothing after it.
      */}
      <section ref={resultsRef} className="relative scroll-mt-4 bg-slate-100 py-12 lg:py-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_55%_at_50%_0%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.45)_30%,transparent_64%)]"
        />
        <span aria-hidden="true" className="grain" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent_0%,rgba(148,163,184,0.55)_18%,rgba(148,163,184,0.55)_82%,transparent_100%)]"
        />
        <div className="container-plug relative">
          <BrandRail
            brands={brands}
            counts={brandCounts}
            selected={filters.brands}
            /**
             * One brand at a time, and tapping the active one clears it.
             *
             * It used to accumulate, which made the rail and the hero's brand
             * select contradict each other: the select can only hold one value,
             * so picking a second brand in the rail left it showing "All
             * brands" while two were active. Single-select makes the two
             * controls the same control.
             *
             * The sidebar checkboxes still allow several — that is a filter
             * panel, where combining is the point. The rail is a shortcut, and
             * a shortcut that needs a second tap to undo the first is not one.
             */
            onToggle={(brand) =>
              setFilters((current) => ({
                ...current,
                brands: current.brands.length === 1 && current.brands[0] === brand ? [] : [brand],
              }))
            }
            onClear={() => setFilters((current) => ({ ...current, brands: [] }))}
          />

          {/*
            A heading for the grid.

            The results block used to open on a row of segments and a count,
            which meant the largest section on the page — the one everything else
            is a way into — was the only one nobody had named. A reader arriving
            by anchor or scroll had to infer what they were looking at from a
            number.

            Now the largest heading on the page, and stepped above "Browse by
            brand" rather than level with it. It used to share a size with that
            rail and with "At a glance" above them both, which was right when
            three sections were competing for the first screen. With the
            insights panel gone this is the page's subject and the brand rail is
            a control leading into it, so a flat hierarchy would leave the
            catalogue announced no more loudly than one of its own filters. The
            subtitle steps up with it, on its own line, so the pair reads as a
            section opening rather than a label with a caption beside it.
          */}
          <div className="mt-14 border-t border-slate-300/70 pt-10">
            {/*
              An index line above the heading rather than a count beside it.

              The catalogue is a reference document and this is its title page,
              so it opens the way the rest of the site opens one — a mono label
              on the left, the extent of the thing on the right, both on the
              rule.

              Brands rather than cars, deliberately. The car count already sits
              three hundred pixels below in the results header, where it is an
              aria-live region that changes as filters are applied — the one
              number on this page that is meant to move. Printing it here too
              would put "48 cars" on screen twice and then have the two
              contradict each other the moment anybody filtered. The brand count
              is the fact this line can state and the other one cannot, and it
              counts the brands in the selected powertrain rather than all of
              them, so it answers a question about what is on screen.

              The `key` is what makes the block change rather than mutate: React
              replaces the subtree when the powertrain changes, so the entrance
              animation below replays. Without it the text would swap in place
              and a reader who tapped a segment would not be certain anything
              had happened.
            */}
            <div key={masthead.id} className="masthead-enter motion-reduce:animate-none">
              <p className="flex items-baseline justify-between gap-4 font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.18em] text-slate-500">
                <span>{masthead.eyebrow}</span>
                <span className="tabular-nums text-slate-400">
                  {mastheadBrands} {mastheadBrands === 1 ? 'brand' : 'brands'}
                </span>
              </p>
              <h2
                aria-live="polite"
                className="mt-5 font-display text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.02em] text-slate-900 lg:text-[3.25rem]"
              >
                {masthead.title}
                <br />
                <span className="text-plug-navy-700">{masthead.emphasis}</span>
              </h2>
              <p className="mt-4 max-w-xl text-ui leading-relaxed text-slate-600">
                {masthead.blurb}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <CarsBrowser
              cars={cars}
              categories={categories}
              connectors={connectors}
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              favouriteIds={favourites.ids}
              onToggleFavourite={(car) => favourites.toggle(car.id)}
              savedOnly={savedOnly}
              onSavedOnlyChange={setSavedOnly}
            />
          </div>
        </div>
      </section>
    </>
  )
}

export { EMPTY_FILTERS }

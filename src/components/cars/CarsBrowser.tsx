// src/components/cars/CarsBrowser.tsx
'use client'

import { Car as CarIcon, GitCompareArrows, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { AnimatedIcon } from '@/components/ui'
import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import {
  EMPTY_FILTERS,
  SORT_LABELS,
  filterCars,
  hasActiveFilters,
  searchCars,
  sortCars,
  type CarFilterState,
  type CarSort,
} from '@/lib/cars'
import { cn } from '@/lib/utils'

import { CarCard } from './CarCard'
import { CarFilters } from './CarFilters'

/**
 * Filters, sorting and the comparison tray, over one list.
 *
 * The search query and the filter object are owned by CarsExplorer above,
 * because the hero holds the only search box on the page. Sort, the drawer and
 * the comparison tray are local — nothing outside needs them, and lifting state
 * nobody else reads only makes the parent harder to follow.
 *
 * The filter panel, the sort select and the cards are all controlled, which is
 * what lets the mobile drawer and the desktop sidebar be the same component:
 * they read the same object, so opening the drawer never shows a different set
 * of choices than the sidebar had.
 *
 * The order of operations matters and is deliberate: search, then filter, then
 * sort. Sorting first would be wasted work, and filtering before searching
 * would make the brand counts describe a list the user cannot see.
 */

export interface CarsBrowserProps {
  cars: Car[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  /** Owned by CarsExplorer, because the hero's input is the search box. */
  query: string
  onQueryChange: (query: string) => void
  filters: CarFilterState
  onFiltersChange: (filters: CarFilterState) => void
  sort: CarSort
  onSortChange: (sort: CarSort) => void
  favouriteIds: string[]
  onToggleFavourite: (car: Car) => void
  /** Restricts the grid to saved cars. Owned above so the URL can carry it. */
  savedOnly: boolean
  onSavedOnlyChange: (value: boolean) => void
}

/** Four columns of specs is already dense on a phone; more would not read. */
const MAX_COMPARE = 4

export function CarsBrowser({
  cars,
  categories,
  connectors,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  favouriteIds,
  onToggleFavourite,
  savedOnly,
  onSavedOnlyChange,
}: CarsBrowserProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [compared, setCompared] = React.useState<string[]>([])

  const searched = React.useMemo(() => searchCars(cars, query), [cars, query])
  const results = React.useMemo(() => {
    const matched = filterCars(searched, filters)
    // Applied after the filters rather than inside them: saving is a property
    // of the visitor, not of the car, and folding it into CarFilterState would
    // put browser state into the object the URL and the sidebar share.
    const scoped = savedOnly ? matched.filter((car) => favouriteIds.includes(car.id)) : matched
    return sortCars(scoped, sort)
  }, [searched, filters, sort, savedOnly, favouriteIds])

  /**
   * The count beside each powertrain segment.
   *
   * Computed with the category selection removed, which is what makes it
   * useful: with EV selected, the count on PHEV has to mean "how many if you
   * switched to PHEV", not zero.
   *
   * There was a matching brandCounts here for the panel's brand checkboxes.
   * Those are gone (the rail above the grid is the only brand control now, and
   * it computes its own counts in CarsExplorer), so this is the only facet left
   * that needs counting.
   */
  const categoryCounts = React.useMemo(() => {
    const base = filterCars(searched, { ...filters, categories: [] })
    const out: Record<string, number> = {}
    for (const category of categories) {
      out[category] = base.filter((car) => car.category === category).length
    }
    return out
  }, [searched, filters, categories])

  const isFiltered = hasActiveFilters(filters) || query.trim().length > 0 || savedOnly

  const toggleCompare = (car: Car) => {
    setCompared((current) =>
      current.includes(car.id)
        ? current.filter((id) => id !== car.id)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, car.id],
    )
  }

  const reset = () => {
    onQueryChange('')
    onFiltersChange(EMPTY_FILTERS)
    onSavedOnlyChange(false)
  }

  /*
    The drawer is a fixed overlay, so the page behind it must not scroll —
    otherwise a swipe on the backdrop moves the list instead of the drawer.

    Escape closes it, which it did not until an interaction audit went looking.
    This is a modal: it has a backdrop, it locks the body scroll, and it covers
    the page. Escape is the keyboard convention for dismissing exactly that, and
    without it the only ways out were a 30px X and a backdrop tap — both pointer
    gestures. A keyboard user could open the filters and then have no key that
    closed them.

    Bound on the document rather than the panel, because the panel does not hold
    focus when it opens: a keydown listener on the sheet only fires once
    something inside it has been tabbed to, which is the case where the user
    least needs the escape hatch.
  */
  React.useEffect(() => {
    if (!drawerOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen])

  const panel = <CarFilters filters={filters} onChange={onFiltersChange} connectors={connectors} />

  return (
    /*
      The comparison tray is fixed to the bottom of the viewport, so without
      this the last row of cards sits underneath it and the final card's buttons
      cannot be reached. Reserved only while the tray is up.

      More of it below lg, because the tray now clears the mobile tab bar rather
      than hiding under it — see the tray itself. 10rem covers the tray's own
      ~4.75rem plus the bar's 4rem; 6rem is enough from lg up, where there is no
      bar and the tray sits on the viewport edge.
    */
    <div className={cn(compared.length > 0 && 'pb-40 lg:pb-24')}>
      {/*
        ── Category segments ──────────────────────────────────────
        A segmented control above the results, not just checkboxes in the
        sidebar. Powertrain is the first cut almost every buyer makes, and
        making it a one-tap switch at the top of the grid is faster than
        opening a panel — on a phone the sidebar is behind a drawer, so
        without this the primary filter is two taps away.

        It is also the only powertrain control now: the sidebar used to carry a
        second copy as checkboxes, which meant two places to look for one choice.
      */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Segment
          active={filters.categories.length === 0}
          onClick={() => onFiltersChange({ ...filters, categories: [] })}
          count={searched.length}
        >
          All cars
        </Segment>

        {categories.map((category) => (
          <Segment
            key={category}
            active={filters.categories.length === 1 && filters.categories[0] === category}
            onClick={() => onFiltersChange({ ...filters, categories: [category] })}
            count={categoryCounts[category] ?? 0}
          >
            {CATEGORY_LABEL[category]}
          </Segment>
        ))}

        {/* Absent until there is something in it — an always-visible Saved tab
            reading zero is an empty promise on a first visit. */}
        {favouriteIds.length > 0 ? (
          <Segment
            active={savedOnly}
            onClick={() => onSavedOnlyChange(!savedOnly)}
            count={favouriteIds.length}
          >
            Saved
          </Segment>
        ) : null}
      </div>

      {/* ── Results header ─────────────────────────────────────── */}
      {/* slate-200, not slate-100 — the ground under this section is slate-100
          now, and a divider the colour of the page is not a divider. */}
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p aria-live="polite" className="text-ui-sm text-slate-500">
            <span className="font-bold text-slate-900">{results.length}</span>{' '}
            {results.length === 1 ? 'car' : 'cars'}
            {results.length !== cars.length ? (
              <span className="text-slate-400"> of {cars.length}</span>
            ) : null}
          </p>

          {/*
            What is being searched for, echoed as a removable chip rather than
            a second input. The hero holds the field; repeating it here would
            give the page two boxes that could disagree.
          */}
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2 text-ui-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              <span className="truncate">&ldquo;{query}&rdquo;</span>
              <X size={12} aria-hidden="true" className="shrink-0 text-slate-500" />
            </button>
          ) : null}

          {hasActiveFilters(filters) ? (
            <button
              type="button"
              onClick={() => onFiltersChange(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2 text-ui-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              Filters
              <X size={12} aria-hidden="true" className="shrink-0 text-slate-500" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-3">
          {/* Only on small screens — the sidebar is always visible above lg. */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-slate-300 px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 lg:hidden"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
            {hasActiveFilters(filters) ? (
              <span className="rounded-full bg-plug-navy-900 px-1.5 py-0.5 font-mono text-[10px] text-white">
                on
              </span>
            ) : null}
          </button>

          <label className="relative flex h-12 items-center">
            <span className="sr-only">Sort cars</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CarSort)}
              className="h-12 w-full appearance-none rounded-xl border-[1.5px] border-slate-200 bg-white pl-4 pr-9 text-ui-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-500"
            >
              {(Object.keys(SORT_LABELS) as CarSort[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
            <SlidersHorizontal
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 text-slate-400"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[17.5rem_1fr] lg:gap-8 xl:gap-10">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          {/*
            A card, not a bare column. The controls previously floated against
            the page with nothing bounding them, so the sidebar and the results
            grid read as one undifferentiated field of small type. Sticky below
            the navbar so the filters stay reachable while a long grid scrolls.
          */}
          <div className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-e1">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-ui font-bold tracking-tight text-slate-900">
                <SlidersHorizontal size={15} className="text-slate-400" aria-hidden="true" />
                Filters
              </h2>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={reset}
                  className="text-ui-xs font-semibold text-plug-blue-600 transition-colors hover:text-plug-blue-800"
                >
                  Reset all
                </button>
              ) : null}
            </div>

            <div className="px-5 py-4">{panel}</div>
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────── */}
        <div>
          {/*
            One, two, three — and the two-to-three step is at xl, not lg.

            The card no longer competes with itself for horizontal room. The
            previous one put the model name and the price on one baseline and the
            figures in a divided three-cell strip, which needed about 390px to
            hold together and is why this grid was capped at two columns with an
            lg:grid-cols-1 dip in the middle. Figures read down the card now, so
            the only things that need width are the model name and a 44px button
            pair, and the card works from about 240px.

            Measured, at the container's real widths rather than the viewport's:

              390   1 column,  358px per card
              768   2 columns, 342px  (no filter rail below lg)
              1024  2 columns, 262px  (rail takes 17.5rem + a 2rem gap)
              1280  3 columns, 256px
              1440  3 columns, 256px  (the container caps at 1280)

            256px is the tightest case and the one to watch: it holds the four
            figure rows without wrapping a label, and a model name up to about
            eighteen characters on one line. Longer names wrap to a second line
            and are clamped there — which is why the actions are pushed down with
            mt-auto rather than sitting under the price.
          */}
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {results.map((car, index) => (
                <CarCard
                  key={car.id}
                  car={car}
                  isCompared={compared.includes(car.id)}
                  onToggleCompare={toggleCompare}
                  compareDisabled={compared.length >= MAX_COMPARE}
                  isFavourite={favouriteIds.includes(car.id)}
                  onToggleFavourite={onToggleFavourite}
                  /* The first row only. Three at xl, two below it — asking for
                     three is harmless at two columns (the third is the start of
                     row two, still near the fold) and getting it wrong the other
                     way leaves a hole above the fold. */
                  priority={index < 3}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <AnimatedIcon motion="pop" standalone>
                <CarIcon size={40} className="text-slate-200" aria-hidden="true" />
              </AnimatedIcon>
              <p className="mt-4 text-ui font-semibold text-slate-600">
                {savedOnly && favouriteIds.length === 0
                  ? 'Nothing saved yet'
                  : 'No cars match that'}
              </p>
              <p className="mt-1.5 max-w-xs text-ui-sm leading-relaxed text-slate-400">
                {savedOnly && favouriteIds.length === 0
                  ? 'Tap the heart on a car to keep it here while you browse.'
                  : 'Try a different brand, or loosen one of the minimums.'}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-full border-[1.5px] border-slate-300 px-5 py-2 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900"
              >
                Clear everything
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      {drawerOpen ? (
        /*
          z-[60], above the mobile tab bar.

          The bar is z-50 fixed to the bottom of the viewport and renders after
          <main> in src/app/(main)/layout.tsx, so at an equal z-index it painted
          over the bottom 4rem of this sheet — which is exactly where the
          "Show N cars" button is. Measured with a pointer-events test: the tap
          landed on the bar's Community tab and navigated away instead of
          applying the filters, so on a phone the drawer could only be dismissed
          by the backdrop. A full-screen modal belongs above primary navigation.
        */
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* A sheet: header and the apply button pinned, only the controls
              between them scrolling — so the count and the way out stay on
              screen however far down the panel you are. */}
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-e4">
            <div className="shrink-0 px-6 pt-3">
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-10 rounded-full bg-slate-200"
              />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Filters</h2>
              <div className="flex items-center gap-3">
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-ui-sm font-semibold text-plug-blue-600"
                  >
                    Reset
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border-y border-slate-100 px-6 py-4">
              {panel}
            </div>

            <div className="shrink-0 p-6">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-full rounded-xl bg-plug-navy-900 text-ui font-semibold text-white transition-colors hover:bg-plug-navy-800"
              >
                Show {results.length} {results.length === 1 ? 'car' : 'cars'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Comparison tray ────────────────────────────────────── */}
      {compared.length > 0 ? (
        /*
          Above the mobile tab bar rather than under it.

          This was bottom-0 z-40 against a z-50 tab bar, so below lg the whole
          tray — the count, Clear, and the Compare button it exists to offer —
          sat behind 4rem of navigation and could not be seen or tapped. Raising
          the z-index instead would have hidden the site's primary navigation
          behind a transient bar, so it sits on top of the bar and both stay
          reachable. The safe-area inset is added because the bar carries it too;
          without it the tray overlaps the bar by the home indicator's height on
          an iPhone.
        */
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-y border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.25)] backdrop-blur lg:bottom-0 lg:border-b-0">
          <div className="container-plug flex flex-wrap items-center justify-between gap-3">
            {/* nowrap, and the cap hidden on the narrowest screens. The tray
                only became visible on a phone once it cleared the tab bar, and
                at 390px the three items measured 340px of the 358px available —
                so "Compare 2" broke onto a second line inside its own button.
                The cap is a nicety; the count and the button are not. */}
            <p className="whitespace-nowrap text-ui-sm text-slate-600">
              <span className="font-bold text-slate-900">{compared.length}</span> selected
              <span className="hidden text-slate-400 xs:inline"> · up to {MAX_COMPARE}</span>
            </p>

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompared([])}
                className="text-ui-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Clear
              </button>

              {/*
                The comparison lives at its own URL, carrying the ids in the
                query string. That makes a comparison shareable and survivable
                across a refresh, which a modal holding it in state would not be.
                Two cars minimum — comparing one car with nothing is just the
                detail page.
              */}
              <Link
                href={`/cars/compare?ids=${compared.join(',')}`}
                aria-disabled={compared.length < 2}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-5 text-ui-sm font-semibold transition-colors',
                  compared.length < 2
                    ? 'pointer-events-none bg-slate-200 text-slate-400'
                    : 'bg-plug-navy-900 text-white hover:bg-plug-navy-800',
                )}
              >
                <GitCompareArrows size={15} aria-hidden="true" />
                {compared.length < 2 ? 'Pick one more' : `Compare ${compared.length}`}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const CATEGORY_LABEL: Record<CarCategory, string> = {
  EV: 'Electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
  Hybrid: 'Hybrid',
}

/**
 * One tab of the segmented control.
 *
 * A count on every segment, including zero — a tab that would return nothing
 * says so before it is tapped, which is kinder than an empty grid and a
 * "nothing matches" message.
 */
function Segment({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLButtonElement>(null)

  /*
    Bring the active segment fully into the rail.

    The rail scrolls horizontally on a phone and five segments do not fit, so
    the selected one is regularly half off the right edge — including on first
    load, where a category arriving in the URL can select a segment that is not
    on screen at all. The masthead then describes a powertrain whose tab the
    reader cannot see, which reads as the page having decided something on its
    own.

    `block: 'nearest'` was chosen to keep this horizontal, and it is not
    enough. "Nearest" means the smallest scroll that brings the element into
    view — which is zero only when it is already visible. On mount this rail is
    about a thousand pixels down the page, so the element is not visible at
    all, and the browser scrolls the document to it: measured landing the
    reader at scrollY 518 on /cars, below the masthead they came to read.

    So the rail is scrolled directly instead of asking the browser to reveal
    the element. Only scrollLeft is written, on the one element that overflows,
    so the document's own scroll position is never a party to it. The segment
    is centred where there is room, which also reads better than flush-left.
  */
  React.useEffect(() => {
    if (!active) return
    const el = ref.current
    const rail = el?.parentElement
    if (!el || !rail) return

    // Nothing to do when the rail does not overflow — every segment is visible.
    if (rail.scrollWidth <= rail.clientWidth) return

    const target = el.offsetLeft - (rail.clientWidth - el.clientWidth) / 2
    const left = Math.max(0, Math.min(target, rail.scrollWidth - rail.clientWidth))
    rail.scrollTo({ left, behavior: 'smooth' })
  }, [active])

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-ui-sm font-semibold transition-all duration-200',
        active
          ? 'border-slate-900 bg-plug-navy-900 text-white shadow-[0_4px_14px_-6px_rgba(15,23,42,0.5)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900',
        count === 0 && !active && 'opacity-45',
      )}
    >
      {children}
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums',
          active ? 'text-white/60' : 'text-slate-400',
        )}
      >
        {count}
      </span>
    </button>
  )
}

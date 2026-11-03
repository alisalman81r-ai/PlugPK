// src/components/cars/CarsExplorer.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { WRAP } from '@/components/v2/ui'
import type { Car, CarCategory, ConnectorStandard } from '@/data/cars'
import { useFavouriteCars } from '@/hooks/useFavouriteCars'
import { prefersReduced } from '@/lib/gsap'
import { filtersToParams, paramsToFilters, type CarFilterState, type CarSort } from '@/lib/cars'

import { BrandMarquee } from './BrandMarquee'
import { CarHero } from './CarHero'
import { CarsBrowser } from './CarsBrowser'

/**
 * The cars page, and the single owner of its state.
 *
 * The ink hero with the search and the brand, the brand strip lifted into it,
 * then the toolbar and the grid. Search, filters and sort live here, because
 * the hero, the strip and the toolbar all write them, and are mirrored into the
 * URL so a filtered view can be sent to somebody, bookmarked, or returned to
 * with the back button:
 *
 *   - Initial state is read from the query string, so a shared link opens the
 *     view it describes.
 *   - Changes are written with replace(), not push(), so typing five characters
 *     leaves one history entry rather than five.
 *   - scroll: false, because Next scrolls to the top on navigation by default
 *     and every keystroke would otherwise move the page.
 */

export interface CarsExplorerProps {
  cars: Car[]
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
}

export function CarsExplorer({ cars, brands, categories, connectors }: CarsExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /* Seeded from the URL exactly once. Two-way binding between state and the
     address bar fights itself; the URL only needs to win on the first render. */
  const initial = React.useMemo(
    () => paramsToFilters(new URLSearchParams(searchParams.toString()), cars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /* Two queries, as in the design (page-cars.js): what is in the search box,
     and what the grid is showing. Typing reaches the grid 220ms after the last
     keystroke, so a burst of typing redraws the cards once rather than per
     letter; a submit, a removed tag or "clear" applies at once. */
  const [typed, setTyped] = React.useState(initial.query)
  const [query, setAppliedQuery] = React.useState(initial.query.trim())
  const typing = React.useRef<number>()
  const typeQuery = (next: string) => {
    setTyped(next)
    window.clearTimeout(typing.current)
    typing.current = window.setTimeout(() => setAppliedQuery(next.trim()), 220)
  }
  const setQuery = (next: string) => {
    window.clearTimeout(typing.current)
    setTyped(next)
    setAppliedQuery(next.trim())
  }
  React.useEffect(() => () => window.clearTimeout(typing.current), [])
  const [filters, setFilters] = React.useState<CarFilterState>(initial.filters)
  const [sort, setSort] = React.useState<CarSort>(initial.sort)
  const [savedOnly, setSavedOnly] = React.useState(false)

  const favourites = useFavouriteCars()

  /* Written back after a short pause, so a burst of typing is one navigation. */
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = filtersToParams(query, filters, sort).toString()
      if (next === window.location.search.replace(/^\?/, '')) return
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, filters, sort, pathname, router])

  const resultsRef = React.useRef<HTMLElement>(null)
  const heroBrand = filters.brands.length === 1 ? (filters.brands[0] ?? null) : null
  const setBrand = (brand: string | null) =>
    setFilters((current) => ({ ...current, brands: brand ? [brand] : [] }))

  /* Down to the catalogue, unless it is already comfortably in view
     (scrollToCat): a 1.1s Lenis glide while smooth scroll runs. */
  const scrollToResults = React.useCallback(() => {
    const node = resultsRef.current
    if (!node) return
    const top = node.getBoundingClientRect().top
    if (top > 120 && top < window.innerHeight * 0.5) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(node, { offset: -80, duration: 1.1 })
    else node.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
  }, [])

  /* A link that arrives filtered (/cars?brand=BYD) lands on the cars, as the
     design's boot does. A frame late, so the smooth scroll exists and has made
     its own top-of-page reset first. */
  React.useEffect(() => {
    if (!window.location.search) return
    const frame = window.requestAnimationFrame(() => scrollToResults())
    return () => window.cancelAnimationFrame(frame)
  }, [scrollToResults])

  /* The hero's figures describe the catalogue as a whole, not the filtered
     grid: the grid has its own live count right above it. */
  const stats = React.useMemo(
    () => [
      { value: cars.length, label: 'Cars' },
      { value: brands.length, label: 'Brands' },
      { value: cars.filter((car) => car.category === 'EV').length, label: 'Full EV' },
    ],
    [cars, brands],
  )

  return (
    <>
      <CarHero
        query={typed}
        onQueryChange={typeQuery}
        brand={heroBrand}
        onBrandChange={setBrand}
        brands={brands}
        stats={stats}
        onSubmit={() => {
          setQuery(typed)
          scrollToResults()
        }}
      />

      <BrandMarquee
        brands={brands}
        active={heroBrand}
        onSelect={(brand) => {
          setBrand(brand)
          scrollToResults()
        }}
      />

      <section
        ref={resultsRef}
        id="catalogue"
        data-theme="light"
        className="scroll-mt-[calc(var(--nav-h)+8px)] bg-chalk pb-[clamp(80px,9vw,128px)] pt-[clamp(48px,5vw,72px)]"
      >
        <div className={WRAP}>
          <CarsBrowser
            cars={cars}
            brands={brands}
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
      </section>
    </>
  )
}

// src/components/services/ServicesDirectory.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Package } from '@/components/ui/icons'

import { ServiceCategoryTabs } from '@/components/services/ServiceCategoryTabs'
import { ServiceFilters, type ServiceSortOption } from '@/components/services/ServiceFilters'
import { GROUP_MIN, ServiceGrid } from '@/components/services/ServiceGrid'
import { Btn, WRAP } from '@/components/v2/ui'
import { useServices } from '@/hooks/useServices'
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_META } from '@/lib/constants'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
import type { EVService, ServiceCategory } from '@/lib/types'

import { CATEGORY_ICON } from './ServiceCategoryTabs'
import {
  cardsIn,
  DIRECTORY_SYNC_EVENT,
  Flip,
  HERO_SEARCH_EVENT,
  type ServicesSearchDetail,
  useCardIntro,
  useIsoLayoutEffect,
} from './services-motion'

/** page-services.js `sorter`: A to Z, Z to A, or by city then name. */
const SORTERS: Record<ServiceSortOption, (a: EVService, b: EVService) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }),
  za: (a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }),
  city: (a, b) => a.address.city.localeCompare(b.address.city) || a.name.localeCompare(b.name, 'en', { numeric: true }),
}

/** useServices' city and text match, without the category — for the chip counts. */
function matchesIgnoringCategory(service: EVService, city: string, query: string) {
  if (city !== 'all' && service.address.city !== city) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [service.name, service.description, service.address.city, service.address.area].join(' ').toLowerCase().includes(q)
}

/**
 * The filterable directory: tabs, filter bar and grid over one shared state,
 * moving the way landing-v2's js/page-services.js moves it.
 *
 * Lifted out of the page so the page itself can be a server component and
 * read the services from the database; it sits inside the Suspense boundary
 * useSearchParams requires.
 *
 * Every change of category, city, search, sort or view goes through `change`,
 * which records where every card is (Flip.getState) and how tall the grid is
 * before React touches the DOM. Once React has committed, the layout effect
 * eases the grid's height across and Flips the cards from the recorded
 * places: leavers shrink and fade, newcomers spring in, the rest glide.
 */
export function ServicesDirectory({ services }: { services: EVService[] }) {
  const searchParams = useSearchParams()

  const {
    filteredServices,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
  } = useServices({
    services,
    initialQuery: searchParams.get('q') ?? '',
    initialCity: searchParams.get('city') ?? 'all',
  })

  const [sortBy, setSortBy] = useState<ServiceSortOption>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  /* ── What is on show ─────────────────────────────────────────────── */
  const sorted = useMemo(() => [...services].sort(SORTERS[sortBy]), [services, sortBy])
  const visible = useMemo(() => new Set(filteredServices.map((s) => s.id)), [filteredServices])
  const shown = visible.size
  const total = services.length

  // page-services.js: each chip counts what the city and search leave in it.
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    for (const service of services) {
      if (!matchesIgnoringCategory(service, selectedCity, searchQuery)) continue
      counts.all = (counts.all ?? 0) + 1
      counts[service.category] = (counts[service.category] ?? 0) + 1
    }
    return counts
  }, [services, selectedCity, searchQuery])

  const grouped = useMemo(() => {
    if (selectedCategory !== 'all' || viewMode === 'list') return false
    return SERVICE_CATEGORY_KEYS.some(
      (key) => filteredServices.filter((s) => s.category === key).length >= GROUP_MIN,
    )
  }, [selectedCategory, viewMode, filteredServices])

  /* ── Motion ──────────────────────────────────────────────────────── */
  const gridRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<gsap.core.Tween | null>(null)
  const pending = useRef<{ state: Flip.FlipState; height: number } | null>(null)

  useCardIntro(gridRef, introRef)

  /** Before a change: finish the intro, then record the cards and the grid's height. */
  const capture = useCallback(() => {
    const intro = introRef.current
    if (intro && intro.progress() < 1) intro.progress(1)
    const grid = gridRef.current
    pending.current =
      grid && !prefersReduced() ? { state: Flip.getState(cardsIn(grid)), height: grid.offsetHeight } : null
  }, [])

  const current = useRef({ selectedCategory, searchQuery, selectedCity, sortBy, viewMode })
  current.current = { selectedCategory, searchQuery, selectedCity, sortBy, viewMode }

  const changeCategory = (category: ServiceCategory | 'all') => {
    if (category === current.current.selectedCategory) return
    capture()
    setSelectedCategory(category)
  }
  const changeQuery = (query: string) => {
    if (query === current.current.searchQuery) return
    capture()
    setSearchQuery(query)
  }
  const changeCity = (city: string) => {
    if (city === current.current.selectedCity) return
    capture()
    setSelectedCity(city)
  }
  const changeSort = (sort: ServiceSortOption) => {
    if (sort === current.current.sortBy) return
    capture()
    setSortBy(sort)
  }
  const changeView = (mode: 'grid' | 'list') => {
    if (mode === current.current.viewMode) return
    capture()
    setViewMode(mode)
  }
  const clearFilters = () => {
    const now = current.current
    if (now.selectedCategory === 'all' && now.searchQuery === '' && now.selectedCity === 'all') return
    capture()
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedCity('all')
  }

  // The hero's search, handed over once the page has glided down to the directory.
  useEffect(() => {
    const onSearch = (event: Event) => {
      const { q, city } = (event as CustomEvent<ServicesSearchDetail>).detail
      const now = current.current
      if (q === now.searchQuery && city === now.selectedCity) return
      capture()
      setSearchQuery(q)
      setSelectedCity(city)
    }
    window.addEventListener(HERO_SEARCH_EVENT, onSearch)
    return () => window.removeEventListener(HERO_SEARCH_EVENT, onSearch)
  }, [capture, setSearchQuery, setSelectedCity])

  // ...and the hero's fields kept in step with the toolbar's.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<ServicesSearchDetail>(DIRECTORY_SYNC_EVENT, { detail: { q: searchQuery, city: selectedCity } }),
    )
  }, [searchQuery, selectedCity])

  /* After React commits a change: the grid's height and the Flip (page-services.js render). */
  const layoutKey = `${sorted.map((s) => s.id).join()}|${filteredServices.map((s) => s.id).join()}|${viewMode}|${grouped}`
  const firstLayout = useRef(true)
  useIsoLayoutEffect(() => {
    if (firstLayout.current) {
      firstLayout.current = false
      return
    }
    const grid = gridRef.current
    const before = pending.current
    pending.current = null
    if (!grid || !before) {
      ScrollTrigger.refresh()
      return
    }
    const cards = cardsIn(grid)
    gsap.fromTo(grid, { height: before.height }, { height: grid.offsetHeight, duration: 0.7, ease: 'expo.out', clearProps: 'height' })
    Flip.from(before.state, {
      targets: cards,
      duration: 0.7,
      ease: 'expo.out',
      absolute: true,
      stagger: 0.025,
      nested: true,
      prune: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { autoAlpha: 0, scale: 0.88, y: 20 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.04, delay: 0.1 },
        ),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.88, duration: 0.3, ease: 'power2.in' }),
      onComplete: () => {
        gsap.set(cards, { clearProps: 'opacity,visibility,transform' })
        ScrollTrigger.refresh()
      },
    })
  }, [layoutKey])

  /* The empty state rises in, child by child, when the last card goes. */
  const wasEmpty = useRef(false)
  useIsoLayoutEffect(() => {
    const empty = !isLoading && shown === 0
    if (empty && !wasEmpty.current && !prefersReduced() && emptyRef.current) {
      gsap.from(emptyRef.current.children, { y: 20, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, clearProps: 'all' })
    }
    wasEmpty.current = empty
  }, [shown, isLoading])

  const EmptyIcon =
    selectedCategory === 'all' ? Package : (CATEGORY_ICON[SERVICE_CATEGORY_META[selectedCategory].icon] ?? Package)

  return (
    <>
      <ServiceCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={changeCategory}
        categoryCount={categoryCount}
      />

      <section
        id="service-results"
        aria-label="EV services"
        data-theme="light"
        className="pb-[clamp(64px,7vw,96px)] pt-8 sm:pt-12"
      >
        <div className={WRAP}>
          <ServiceFilters
            searchQuery={searchQuery}
            onSearchChange={changeQuery}
            selectedCity={selectedCity}
            onCityChange={changeCity}
            sortBy={sortBy}
            onSortChange={changeSort}
            resultCount={shown}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={changeView}
          />

          <ServiceGrid
            ref={gridRef}
            services={sorted}
            visible={visible}
            isLoading={isLoading}
            viewMode={viewMode}
            grouped={grouped}
          />

          {!isLoading && shown === 0 ? (
            <div
              ref={emptyRef}
              className="grid justify-items-center gap-1.5 rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] px-6 py-16 text-center"
            >
              <span className="mb-2.5 grid h-16 w-16 place-items-center rounded-full bg-ink text-volt">
                <EmptyIcon size={26} aria-hidden="true" />
              </span>
              <p className="font-display text-[26px] leading-[1.1] text-ink">No services match.</p>
              <p className="mb-3.5 text-[15px] text-muted">Try another category, city or search term.</p>
              <Btn variant="ink" size="sm" magnetic={false} onClick={clearFilters}>
                Clear filters
              </Btn>
            </div>
          ) : null}

          {/* A status, not a button: there is no "load more" behind it. */}
          {!isLoading && shown > 0 ? (
            <div className="mt-10 grid justify-items-center">
              <small className="inline-flex h-9 items-center rounded-full border border-ink/10 bg-white px-4 font-mono text-[12.5px] font-medium text-muted">
                {shown === total ? `All ${total} services shown` : `Showing ${shown} of ${total} services`}
              </small>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

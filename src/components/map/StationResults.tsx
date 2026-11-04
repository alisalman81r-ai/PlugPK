// src/components/map/StationResults.tsx
'use client'

import { ChevronDown, List } from '@/components/ui/icons'
import * as React from 'react'

import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
import type { Station } from '@/lib/types'
import { Eyebrow, btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'
import { SORT_OPTIONS, type SortKey } from './filter-options'
import { refreshSoon, useIsoLayoutEffect } from './motion'
import { NoResults, StationListItem, StationListSkeleton } from './StationList'

const cardsIn = (grid: HTMLElement | null) =>
  grid ? [...grid.querySelectorAll<HTMLElement>('[data-station-card]')] : []
const idOf = (card: HTMLElement) => card.dataset.stationCard ?? ''

/**
 * The results, as a grid under the map.
 *
 * They used to be a single 380px column beside the map, which made every card
 * a narrow strip and put the fourth result below the fold. Across the full
 * width of the page the same cards fit three to a row, so a reader sees nine
 * stations at once instead of two and a half.
 *
 * The list starts at one screenful and grows on request rather than rendering
 * every station at once: a filter that matches sixty stations should not cost
 * sixty photographs before the reader has decided to look past the first nine.
 */

const PAGE_SIZE = 9

export interface StationResultsProps {
  stations: (Station & { distanceKm?: number })[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  isLoading?: boolean
  onResetFilters?: () => void
  /** True once geolocation has landed — "nearest first" is a lie without it. */
  hasUserLocation?: boolean
  /** The station last picked by its pin on the map, and a counter that changes per pick. */
  pinPick?: { id: string; n: number } | null
  className?: string
}

export function StationResults({
  stations,
  selectedStation,
  onStationSelect,
  isLoading = false,
  onResetFilters,
  hasUserLocation = false,
  pinPick = null,
  className,
}: StationResultsProps) {
  const [sortBy, setSortBy] = React.useState<SortKey>('nearest')
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  // A new filter or a new search is a new list: showing result 37 of the
  // previous one would be answering a question nobody is still asking.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [stations, sortBy])

  const sorted = React.useMemo(() => {
    const copy = [...stations]

    if (sortBy === 'rating') return copy.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'recent') {
      return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    }
    // `nearest` keeps the distance ordering already applied upstream.
    return copy
  }, [stations, sortBy])

  const visible = sorted.slice(0, visibleCount)
  const remaining = sorted.length - visible.length

  /*
    ── Motion (page-map.js) ──────────────────────────────────────────

    First paint: the cards wait below the fold and rise as they scroll in —
    from y 32, opacity 0; 1s, expo.out, 0.07s apart, at "top 92%", once.
    After that, every change to the list (a filter, a search, "show more")
    brings in only the cards that were not already showing — from y 18,
    opacity 0; 0.6s, expo.out, 0.05s apart — and a new sort or a located
    position replays it for the whole list.
  */
  const gridRef = React.useRef<HTMLDivElement>(null)
  /** Ids on show after the last pass; null until the first reveal is set up. */
  const shown = React.useRef<Set<string> | null>(null)
  /** Ids whose first scroll reveal has run (the rest are still waiting below). */
  const revealed = React.useRef(new Set<string>())
  const replayAll = React.useRef(false)
  const lastLocated = React.useRef(hasUserLocation)
  const visibleKey = visible.map((station) => station.id).join(',')

  useIsoLayoutEffect(() => {
    const cards = cardsIn(gridRef.current)
    shown.current = new Set(cards.map(idOf))
    if (prefersReduced() || cards.length === 0) {
      cards.forEach((card) => revealed.current.add(idOf(card)))
      return
    }
    gsap.set(cards, { opacity: 0, y: 32 })
    const triggers = ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((card) => revealed.current.add(idOf(card as HTMLElement)))
        gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, overwrite: true, clearProps: 'transform' })
      },
    })
    return () => {
      triggers.forEach((trigger) => trigger.kill())
      gsap.set(cards, { clearProps: 'opacity,transform' })
      shown.current = null
      revealed.current.clear()
    }
    // The first cards only; later changes are the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useIsoLayoutEffect(() => {
    if (shown.current === null) return
    const cards = cardsIn(gridRef.current)
    if (lastLocated.current !== hasUserLocation) {
      lastLocated.current = hasUserLocation
      if (hasUserLocation) replayAll.current = true
    }
    const all = replayAll.current
    replayAll.current = false
    const before = shown.current
    // Cards still waiting for their first scroll reveal keep waiting.
    const entering = cards.filter((card) => {
      const id = idOf(card)
      return !before.has(id) || (all && revealed.current.has(id))
    })
    entering.forEach((card) => revealed.current.add(idOf(card)))
    shown.current = new Set(cards.map(idOf))
    if (entering.length && !prefersReduced()) {
      gsap.fromTo(
        entering,
        { opacity: 0, y: 18 },
        // clearProps: GSAP leaves an inline 'translate: none' that would
        // cancel the card's hover lift (which rides the translate property).
        { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, overwrite: true, clearProps: 'transform' },
      )
    }
    refreshSoon()
  }, [visibleKey, sortBy, hasUserLocation])

  const changeSort = (next: SortKey) => {
    replayAll.current = true
    setSortBy(next)
  }

  return (
    <section aria-label="Station results" className={cn('min-w-0', className)}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-[18px]">
        <div className="min-w-0">
          <Eyebrow className="mb-3.5">
            <List size={15} aria-hidden="true" />
            Results
          </Eyebrow>
          <h2 className="font-display text-[clamp(28px,3vw,40px)] leading-[1.08] text-ink">
            {isLoading
              ? 'Loading stations…'
              : `${stations.length} ${stations.length === 1 ? 'station' : 'stations'} on the map`}
          </h2>
          <p className="mt-2.5 text-[15px] text-muted">
            {hasUserLocation
              ? 'Sorted by distance from you. Tap a card to place it on the map.'
              : 'Tap a card to place it on the map, or allow location for distances.'}
          </p>
        </div>

        {/* A select rather than a row of buttons — drawn by us so the open
            list stays in the site's colours, with the same keyboard handling. */}
        <ThemedSelect
          value={sortBy}
          onChange={(value) => changeSort(value as SortKey)}
          aria-label="Sort stations"
          align="right"
          wrapperClassName="shrink-0"
          options={SORT_OPTIONS}
        />
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StationListSkeleton count={6} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-[28px] border-[1.5px] border-dashed border-ink/20 bg-paper bg-[radial-gradient(rgba(11,12,14,.06)_1px,transparent_1.5px)] [background-size:14px_14px]">
          <NoResults onClearFilters={onResetFilters} />
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((station) => (
              <StationListItem
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onClick={onStationSelect}
                distanceKm={station.distanceKm}
                pulse={pinPick?.id === station.id ? pinPick.n : undefined}
              />
            ))}
          </div>

          {remaining > 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className={btnClass('ghost', 'md')}
              >
                Show {Math.min(remaining, PAGE_SIZE)} more
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <p className="font-mono text-xs text-muted">
                {visible.length} of {sorted.length} shown
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

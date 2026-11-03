// src/components/partners/PartnerList.tsx
'use client'

import { ChevronDown, Globe, MapPin, Phone, Plug, Search, Star, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Btn, BtnArrow, SEG, Tag, btnClass, segButtonClass } from '@/components/v2/ui'
import type { PartnerRow } from '@/lib/db/queries'
import { gsap, prefersReduced, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/**
 * The partner directory, with its filters (landing-v2's .pt-dir).
 *
 * Filtering runs in the browser over the full list: it searches name, city and
 * address together, and a round trip per keystroke to do that would be slower
 * than this list is long for any realistic number of partners.
 *
 * The records are the same ones the map draws, so every card leads to a real
 * station page; an "invitation" tile closes the grid rather than padding it out
 * with invented logos.
 *
 * Motion is page-partner.js's: the cards (and the invitation) rise in
 * together the first time the grid is 90% down the viewport; after that, every
 * filter, sort or search (160ms after the last keystroke) re-lays them and they
 * rise in again, or the empty state does.
 */

export interface PartnerListProps {
  partners: PartnerRow[]
}

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  mall: 'Shopping mall',
  office: 'Office',
  dealership: 'Dealership',
  'service-center': 'Service centre',
  home: 'Home charger',
}

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

type SortKey = 'newest' | 'power' | 'rating'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'power', label: 'Fastest' },
  { key: 'rating', label: 'Best rated' },
]

const SELECT =
  'h-12 w-full cursor-pointer appearance-none rounded-full border-[1.5px] border-ink/10 bg-white pl-4 pr-10 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] duration-200 hover:border-ink/30 focus:border-ink focus:shadow-focus'

export function PartnerList({ partners }: PartnerListProps) {
  const [query, setQuery] = React.useState('')
  const [city, setCity] = React.useState('all')
  const [type, setType] = React.useState('all')
  const [sortBy, setSortBy] = React.useState<SortKey>('newest')
  // The search applies 160ms after the last keystroke, as the design debounces it.
  const [term, setTerm] = React.useState('')
  const searchRef = React.useRef<HTMLInputElement>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const t = window.setTimeout(() => setTerm(query), 160)
    return () => window.clearTimeout(t)
  }, [query])

  // Only the cities and types actually represented. A dropdown offering
  // filters that return nothing is worse than a shorter dropdown.
  const cities = React.useMemo(
    () => [...new Set(partners.map((partner) => partner.city))].sort((a, b) => a.localeCompare(b)),
    [partners],
  )
  const types = React.useMemo(() => [...new Set(partners.map((partner) => partner.type))], [partners])

  const visible = React.useMemo(() => {
    const needle = term.trim().toLowerCase()

    let rows = partners
    if (needle) {
      rows = rows.filter((partner) =>
        [partner.name, partner.city, partner.address ?? ''].join(' ').toLowerCase().includes(needle),
      )
    }
    if (city !== 'all') rows = rows.filter((partner) => partner.city === city)
    if (type !== 'all') rows = rows.filter((partner) => partner.type === type)

    return [...rows].sort((a, b) => {
      if (sortBy === 'power') return b.maxPowerKw - a.maxPowerKw
      if (sortBy === 'rating') {
        // Unrated partners sort last rather than tying with a genuine zero.
        if (a.reviewCount === 0 && b.reviewCount === 0) return 0
        if (a.reviewCount === 0) return 1
        if (b.reviewCount === 0) return -1
        return b.rating - a.rating
      }
      return b.joinedAt.localeCompare(a.joinedAt)
    })
  }, [partners, term, city, type, sortBy])

  const reset = () => {
    setQuery('')
    setTerm('')
    setCity('all')
    setType('all')
    searchRef.current?.focus()
  }

  const total = partners.length

  /* First sight: the cards wait below, then rise in together (1s, expo.out, 0.07s apart). */
  const ctxRef = React.useRef<gsap.Context | null>(null)
  useIsoLayoutEffect(() => {
    const root = resultsRef.current
    if (!root) return
    const ctx = gsap.context(() => {}, root)
    ctxRef.current = ctx
    if (!prefersReduced()) {
      ctx.add(() => {
        gsap.set(root.querySelectorAll('[data-dir-grid] > li'), { y: 32, autoAlpha: 0 })
        ScrollTrigger.create({
          trigger: root,
          start: 'top 90%',
          once: true,
          onEnter: () =>
            ctx.add(() => {
              const cards = root.querySelectorAll('[data-dir-grid] > li')
              gsap.to(cards, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.07 })
            }),
        })
      })
    }
    return () => {
      ctx.revert()
      ctxRef.current = null
    }
  }, [])

  /* Every re-render of the results after that: they rise in again (0.7s, expo.out, 0.06s apart). */
  const shown = React.useRef(visible)
  useIsoLayoutEffect(() => {
    if (shown.current === visible) return
    shown.current = visible
    const root = resultsRef.current
    const ctx = ctxRef.current
    if (root && ctx && !prefersReduced()) {
      ctx.add(() => {
        const grid = root.querySelector('[data-dir-grid]')
        const els = grid ? grid.children : root.querySelectorAll('[data-dir-empty]')
        gsap.fromTo(els, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.06 })
      })
    }
    ScrollTrigger.refresh()
  }, [visible])

  return (
    <div>
      <div data-reveal="" className="mb-[18px] flex flex-wrap items-center gap-2.5">
        <label className="relative min-w-0 flex-[1_1_320px]">
          <span className="sr-only">Search partners</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search partners by name, city or address"
            autoComplete="off"
            className="h-12 w-full rounded-full border-[1.5px] border-ink/10 bg-white pl-11 pr-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus"
          />
        </label>

        <div className="relative flex-1 md:flex-none">
          <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter by city" className={SELECT}>
            <option value="all">All cities</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink" />
        </div>

        <div className="relative flex-1 md:flex-none">
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by type" className={SELECT}>
            <option value="all">All types</option>
            {types.map((option) => (
              <option key={option} value={option}>
                {TYPE_LABEL[option] ?? option}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink" />
        </div>

        <div role="group" aria-label="Sort" className={cn(SEG, 'w-full rounded-full md:w-auto')}>
          {SORTS.map((sort) => (
            <button
              key={sort.key}
              type="button"
              onClick={() => setSortBy(sort.key)}
              aria-pressed={sortBy === sort.key}
              className={segButtonClass(sortBy === sort.key, 'inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-4 py-0 md:flex-none')}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mb-[18px] text-sm text-muted">
        <b className="font-mono font-semibold text-ink">{visible.length}</b> of {total} listing{total === 1 ? '' : 's'} shown
      </p>

      <div ref={resultsRef}>
        {visible.length === 0 ? (
          <div data-dir-empty="" className="grid justify-items-center gap-2 rounded-[28px] border-[1.5px] border-dashed border-ink/20 bg-paper px-6 py-14 text-center">
            <span aria-hidden="true" className="mb-1.5 grid h-14 w-14 place-items-center rounded-full bg-stone text-ink">
              <Search size={22} />
            </span>
            <h3 className="font-display text-[26px] font-normal leading-[1.1] text-ink pg-medium">No places match that search</h3>
            <p className="max-w-[30rem] text-muted">
              There {total === 1 ? 'is 1 listing' : `are ${total} listings`} so far. Clear the filters to see{' '}
              {total === 1 ? 'it' : 'them'}, or list your own charger.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              <Btn variant="ink" size="sm" onClick={reset} magnetic={false}>
                Clear filters
              </Btn>
              <Btn
                href="/business/signup"
                variant="ghost"
                size="sm"
                magnetic={false}
                className="border-ink/20 bg-transparent hover:border-ink hover:bg-volt"
              >
                List your charger
              </Btn>
            </div>
          </div>
        ) : (
          <ul data-dir-grid="" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((partner) => (
              <li key={partner.id}>
                <PartnerCard partner={partner} />
              </li>
            ))}

            {/* The invitation beside real listings. */}
            <li>
              <Link
                href="/business/signup"
                className="group grid h-full content-center justify-items-start gap-2.5 rounded-[28px] border-[1.5px] border-dashed border-ink/20 bg-paper bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] bg-[length:14px_14px] p-7 [transition:border-color_.3s,translate_.45s_cubic-bezier(.16,1,.3,1)] hover:border-ink hover:[translate:0_-4px] focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span aria-hidden="true" className="mb-2 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-ink text-volt">
                  <Plug size={24} />
                </span>
                <h3 className="font-display text-2xl font-normal leading-[1.1] text-ink pg-medium">Your charger here</h3>
                <p className="text-[14.5px] leading-[1.55] text-muted">
                  Applying takes a few minutes and costs nothing. Every listing is checked by a person before it goes
                  live.
                </p>
                <span className={btnClass('ink', 'sm', 'mt-2')}>
                  List your charger
                  <BtnArrow />
                </span>
              </Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}

function PartnerCard({ partner }: { partner: PartnerRow }) {
  const typeLabel = TYPE_LABEL[partner.type] ?? partner.type

  return (
    <Link
      href={`/station/${partner.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1 [transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:border-ink/20 hover:shadow-e2 hover:[translate:0_-4px] focus-visible:outline-none focus-visible:shadow-focus"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone">
        {/* A plain img rather than next/image — user uploads of unknown
            dimensions, and the optimizer earns little on a card thumbnail. */}
        {partner.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={partner.photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover [transition:scale_.8s_cubic-bezier(.16,1,.3,1)] group-hover:[scale:1.05]"
          />
        ) : (
          // No photo: a plain stone panel, not a stock image standing in for
          // somebody's charger.
          <span
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-[radial-gradient(rgba(11,12,14,.08)_1px,transparent_1.5px)] bg-[length:14px_14px] text-ink/25"
          >
            <Zap size={40} className="fill-current" />
          </span>
        )}
        <Tag className="absolute left-3 top-3 border-transparent bg-white/90 backdrop-blur">{typeLabel}</Tag>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="font-display text-2xl font-normal leading-[1.1] text-ink pg-medium">{partner.name}</h3>
          <span className="flex flex-none items-center gap-1.5">
            {partner.phone ? (
              <span role="img" aria-label="Phone listed" className="grid h-8 w-8 place-items-center rounded-full bg-chalk text-ink">
                <Phone size={15} aria-hidden="true" />
              </span>
            ) : null}
            {partner.website ? (
              <span role="img" aria-label="Website listed" className="grid h-8 w-8 place-items-center rounded-full bg-chalk text-ink">
                <Globe size={15} aria-hidden="true" />
              </span>
            ) : null}
          </span>
        </div>

        <p className="flex items-start gap-1.5 text-sm text-muted">
          <MapPin size={15} className="mt-0.5 flex-none" aria-hidden="true" />
          <span className="line-clamp-2">
            {partner.address ? `${partner.address}, ` : ''}
            {partner.city}
          </span>
        </p>

        {partner.description ? <p className="line-clamp-2 text-sm text-muted">{partner.description}</p> : null}

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-ink px-2.5 font-mono text-xs font-semibold text-white">
            <Zap size={12} className="fill-current text-volt" aria-hidden="true" />
            {partner.maxPowerKw > 0 ? `${partner.maxPowerKw} kW` : 'Power not stated'}
          </span>
          {partner.connectorTypes.map((connector) => (
            <Tag key={connector}>{connector}</Tag>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-ink/10 pt-3 text-[13px] text-muted">
          <span className="font-mono text-[12.5px] text-ink">
            {partner.chargerCount} charger{partner.chargerCount === 1 ? '' : 's'} · {partner.portCount} port
            {partner.portCount === 1 ? '' : 's'}
          </span>
          {partner.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star size={13} className="fill-current text-ink" aria-hidden="true" />
              <span className="sr-only">Rated</span>
              <span className="font-mono text-ink">{partner.rating.toFixed(1)}</span>
              <span className="sr-only">out of 5</span>
              <span>
                · {partner.reviewCount} review{partner.reviewCount === 1 ? '' : 's'}
              </span>
            </span>
          ) : (
            <span>No reviews yet</span>
          )}
        </div>
      </div>

    </Link>
  )
}

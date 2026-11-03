// src/components/services/ServiceHeroSearch.tsx
'use client'

import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { Search } from '@/components/ui/icons'
import { SearchSelect } from '@/components/ui/SearchSelect'
import { btnClass } from '@/components/v2/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { prefersReduced } from '@/lib/gsap'

import { DIRECTORY_SYNC_EVENT, HERO_SEARCH_EVENT, type ServicesSearchDetail } from './services-motion'

/**
 * The hero's white search pill (landing-v2 .psearch #heroSearch).
 *
 * As page-services.js does it: on submit the page glides down to the
 * directory (Lenis, 1.1s, clearing the navbar by 90px) and the results change
 * once it is nearly there, 450ms later, so the Flip is seen rather than
 * happening off screen. The directory keeps these fields in step with its own
 * toolbar.
 *
 * Without script, or before the directory has mounted, it is still a plain
 * GET back to /services, which the directory reads its first state from.
 *
 * On a phone the pill wraps into a card — input, then city and the button —
 * rather than hiding the city picker and the submit, which are the two
 * controls that make it a search rather than a text box.
 */
export function ServiceHeroSearch() {
  const [q, setQ] = React.useState('')
  const [city, setCity] = React.useState('all')
  const timer = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<ServicesSearchDetail>).detail
      setQ((current) => (current.trim() === detail.q ? current : detail.q))
      setCity(detail.city)
    }
    window.addEventListener(DIRECTORY_SYNC_EVENT, onSync)
    return () => {
      window.removeEventListener(DIRECTORY_SYNC_EVENT, onSync)
      clearTimeout(timer.current)
    }
  }, [])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const target = document.getElementById('directory')
    if (!target || !document.querySelector('[data-services-grid]')) return
    event.preventDefault()
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.1 })
    else target.scrollIntoView()
    const detail: ServicesSearchDetail = { q: q.trim(), city }
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => window.dispatchEvent(new CustomEvent<ServicesSearchDetail>(HERO_SEARCH_EVENT, { detail })),
      prefersReduced() ? 0 : 450,
    )
  }

  return (
    <form
      data-hero-item=""
      action="/services"
      method="get"
      role="search"
      onSubmit={onSubmit}
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
        value={q}
        onChange={(event) => setQ(event.target.value)}
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
        value={city}
        onChange={setCity}
        ariaLabel="Filter by city"
        options={PAKISTAN_CITIES}
        searchPlaceholder="Type a city"
        className="h-[46px] min-w-0 flex-1 rounded-full border-0 bg-chalk px-4 text-sm text-ink hover:border-0 focus-visible:ring-volt/60 sm:w-40 sm:flex-none sm:rounded-none sm:border-l sm:border-ink/10 sm:bg-transparent sm:px-3.5"
      />
      <button type="submit" className={btnClass('volt', 'md', 'h-[50px] shrink-0 shadow-none hover:bg-ink hover:text-white')}>
        Search
      </button>
    </form>
  )
}

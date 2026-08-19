// src/components/services/ServiceHero.tsx
import { Search } from 'lucide-react'

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

export function ServiceHero({ totalServices, citiesCovered }: ServiceHeroProps) {
  const stats = [
    { value: totalServices.toLocaleString('en-PK'), label: 'Services' },
    { value: String(SERVICE_CATEGORY_KEYS.length), label: 'Categories' },
    { value: String(citiesCovered), label: 'Cities' },
  ]

  return (
    /**
     * slate-950 with layered light, not the flat `bg-gradient-hero` ramp.
     *
     * That gradient ran navy to teal across the whole block, which meant the
     * headline sat on one colour and the stats beneath it on a noticeably
     * different one — and the white search bar landed in the middle of the
     * transition, where it had the least contrast to work against. A dark
     * ground with discrete pools of colour keeps every element on a
     * predictable backdrop, and matches the home hero and route planner
     * rather than introducing a third treatment.
     */
    <section className="relative isolate overflow-hidden bg-slate-950 py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-600/30 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -right-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-plug-cyan-500/20 blur-[130px]"
      />
      {/* Catches the light along the top edge so the section reads as a
          surface rather than a hole punched in the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="container-plug relative z-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-ui-xs font-medium uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-plug-cyan-400" />
          EV Ecosystem
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.04] tracking-[-0.035em] text-white">
          Everything your EV needs in{' '}
          <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
            one place
          </span>
        </h1>

        {/* white/70, not white/60 — at this size the old value sat under the
            4.5:1 floor against the darkest part of the old gradient. */}
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
          From dealerships to home charger installation — find every EV service
          across Pakistan.
        </p>

        {/* A plain GET back to /services. The page reads q and city from the
            URL and seeds the filter state, so this stays a server component.

            Restructured from an absolutely-positioned overlay into a real
            flex row. The old markup pinned the city select and the submit
            button on top of the input and hid them below 640px, which left
            phone users with no way to choose a city and no visible way to
            submit — the two controls that make this a search rather than a
            text box. Now they wrap onto their own row instead of vanishing. */}
        <form
          action="/services"
          method="get"
          className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-2 rounded-3xl border border-white/15 bg-white/[0.07] p-2 shadow-e4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/30 sm:flex-row sm:items-center sm:rounded-full"
        >
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 text-white/50"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              placeholder="Search services, dealers, installers..."
              aria-label="Search services"
              className="h-12 w-full min-w-0 rounded-full border-none bg-transparent pl-11 pr-3 text-ui text-white outline-none placeholder:text-white/50 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Solid dark fill rather than a translucent one: a native select
                paints its option list from its own background, and a
                see-through control gives the browser nothing to work with. */}
            <select
              name="city"
              aria-label="Filter by city"
              className="h-12 min-w-0 flex-1 cursor-pointer rounded-full border border-white/15 bg-slate-900 px-4 text-ui font-medium text-white outline-none transition-colors hover:border-white/25 focus-visible:border-plug-cyan-400 focus-visible:ring-2 focus-visible:ring-plug-cyan-400/40 sm:flex-none"
            >
              <option value="all">All cities</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-white px-6 text-ui font-semibold text-slate-950 shadow-[0_0_36px_-8px_rgba(34,211,238,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-plug-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* One rail with hairline dividers, rather than three numbers floating
            in space. It gives the figures an edge to sit against, and on a
            phone it stays a single row instead of collapsing into a column
            that pushes the listings below the fold. */}
        <dl className="mx-auto mt-10 grid w-full max-w-md grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
          {stats.map((stat) => (
            // dt before dd in the source, which is the order a definition
            // list requires; flex-col-reverse puts the number on top where
            // the eye wants it without lying about the structure.
            <div key={stat.label} className="flex flex-col-reverse px-4 py-4">
              <dt className="mt-1 text-ui-xs uppercase tracking-[0.12em] text-white/60">
                {stat.label}
              </dt>
              <dd className="text-2xl font-black tabular-nums text-white sm:text-3xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

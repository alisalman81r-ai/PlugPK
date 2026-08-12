// src/components/services/ServiceHero.tsx
import { Search } from 'lucide-react'

import { PAKISTAN_CITIES, SERVICE_CATEGORY_KEYS } from '@/lib/constants'

export interface ServiceHeroProps {
  totalServices: number
}

export function ServiceHero({ totalServices }: ServiceHeroProps) {
  const stats = [
    { value: totalServices.toLocaleString('en-PK'), label: 'Total Services' },
    { value: String(SERVICE_CATEGORY_KEYS.length), label: 'Categories' },
    { value: String(PAKISTAN_CITIES.length), label: 'Cities Covered' },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/[0.18] blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/[0.12] blur-[100px]"
      />

      <div className="container-plug relative z-10 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white">
          EV Ecosystem
        </span>

        <h1 className="mb-5 text-4xl font-black text-white lg:text-display-lg">
          Everything Your EV
          <br />
          Needs in{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            One Place
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg text-white/60">
          From dealerships to home charger installation — find every EV service across Pakistan.
        </p>

        {/* A plain GET back to /services. The page reads q and city from the
            URL and seeds the filter state, so this stays a server component. */}
        <form action="/services" method="get" className="relative mx-auto max-w-2xl">
          <Search
            size={20}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            name="q"
            placeholder="Search services, dealers, installers..."
            aria-label="Search services"
            className="h-[60px] w-full rounded-2xl border-none bg-white pl-14 pr-4 text-[15px] text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.15)] outline-none transition-shadow placeholder:text-slate-400 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.45),0_8px_32px_rgba(0,0,0,0.15)] sm:pr-48"
          />

          <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-2 sm:flex">
            <select
              name="city"
              aria-label="Filter by city"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <option value="all">All Cities</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-10 rounded-xl bg-plug-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-plug-blue-700"
            >
              Search
            </button>
          </span>
        </form>

        <div className="mt-12 flex justify-center gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

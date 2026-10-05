// src/components/shared/NotFoundContent.tsx
import Link from 'next/link'

import { Button } from '@/components/ui'
import { Car, MapPin, Route, Search } from '@/components/ui/icons'

/**
 * The body of the site's 404, shared by the (main) group's not-found (which
 * the site chrome already wraps) and the root one (which adds the chrome
 * itself, because an unmatched URL renders outside every route group).
 *
 * The search is a plain GET form to /map?q=, the one search the site has that
 * covers chargers, places and cities. It works without JavaScript, which
 * matters on a page somebody reached because something else went wrong.
 */
const DESTINATIONS = [
  { href: '/map', label: 'Charging map', body: 'Every charger, filtered by connector and speed.', icon: MapPin },
  { href: '/cars', label: 'Electrified cars', body: 'Prices, ranges and charging, side by side.', icon: Car },
  { href: '/routes', label: 'Route planner', body: 'A long drive, with the charging stops worked out.', icon: Route },
]

export function NotFoundContent() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-plug">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-cyan-700">Error 404</p>
          <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-slate-900">
            We could not find that page
          </h1>
          <p className="mt-4 text-ui leading-relaxed text-slate-500">
            The link may be old, or the listing may have been removed. Search for a charger or a city,
            or pick up from one of these.
          </p>

          <form action="/map" method="get" role="search" className="mx-auto mt-8 flex max-w-md gap-2">
            <label htmlFor="not-found-search" className="sr-only">
              Search chargers and cities
            </label>
            <div className="relative flex-1">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="not-found-search"
                name="q"
                type="search"
                placeholder="A charger, an area or a city"
                className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        <ul className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
          {DESTINATIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-plug-blue-500 hover:bg-plug-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
              >
                <item.icon size={22} aria-hidden="true" className="text-plug-cyan-700" />
                <span className="mt-3 font-semibold text-slate-900">{item.label}</span>
                <span className="mt-1 text-ui-sm text-slate-500">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center">
          <Link href="/" className="text-ui-sm font-semibold text-plug-blue-600 hover:underline">
            Back to the home page
          </Link>
        </p>
      </div>
    </section>
  )
}

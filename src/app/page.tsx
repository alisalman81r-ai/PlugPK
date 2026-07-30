// src/app/page.tsx
import Link from 'next/link'

import { CITIES_PAKISTAN, CONNECTOR_TYPES, NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <main>
      <section className="bg-gradient-hero px-6 py-24 text-plug-slate-50">
        <div className="mx-auto max-w-5xl">
          <p className="animate-fade-up font-mono text-sm uppercase tracking-widest text-plug-cyan-300">
            Pakistan’s EV charging network
          </p>
          <h1 className="mt-4 animate-fade-up text-display-lg text-plug-slate-0 md:text-display-2xl">
            Every charger. One map.
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg text-plug-slate-300">
            Live availability, connector types and tariffs for public charging
            stations in {CITIES_PAKISTAN.length} cities — plus route planning
            built around your vehicle’s real range.
          </p>

          <nav className="mt-10 flex flex-wrap gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.description}
                className={cn(
                  'rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium',
                  'transition hover:border-white/30 hover:bg-white/10',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-display-sm">Supported connectors</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONNECTOR_TYPES.map((connector) => (
              <li
                key={connector.type}
                className="rounded-2xl border border-plug-slate-200 bg-plug-slate-0 p-6 shadow-card transition hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      connector.badgeClass,
                    )}
                  >
                    {connector.shortLabel}
                  </span>
                  <span className="font-mono text-xs text-plug-slate-500">
                    {connector.current} · up to {connector.typicalMaxPower} kW
                  </span>
                </div>
                <p className="mt-4 text-sm text-plug-slate-600">
                  {connector.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

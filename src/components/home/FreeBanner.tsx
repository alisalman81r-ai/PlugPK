// src/components/home/FreeBanner.tsx
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

/**
 * States plainly that the platform costs nothing to use.
 *
 * The claims are deliberately narrow — each one describes something the
 * product genuinely does today. There is no subscription, no paywall and no
 * card field anywhere in the codebase, so "free" here is a fact rather than
 * an introductory offer with conditions attached.
 *
 * It says nothing about the price of electricity: that is set by each
 * station operator and is shown per-connector on the map. Conflating the two
 * would be the kind of claim that erodes trust the first time someone plugs
 * in and gets a bill.
 */
const INCLUDED = [
  'Search every station and see live port availability',
  'Compare real per-unit prices before you drive',
  'Plan intercity routes around your car’s range',
  'Read and write reviews from other EV drivers',
]

export function FreeBanner() {
  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="container-plug">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:p-12">
            <div className="min-w-0">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-ui-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <Check size={13} className="shrink-0" aria-hidden="true" />
                Free to use
              </span>

              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-black leading-[1.08] tracking-[-0.02em] text-slate-900">
                Plug.pk is free, and stays free
              </h2>

              <p className="mt-4 max-w-xl text-pretty leading-relaxed text-slate-600">
                No subscription, no account required to search, and no card details asked for.
                You only ever pay the station operator for the electricity you use.
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                    >
                      <Check size={12} className="text-emerald-700" />
                    </span>
                    <span className="text-ui-sm leading-relaxed text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:w-56">
              <Link
                href="/map"
                className="group/cta inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-ui font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Find a charger
                <ArrowRight
                  size={16}
                  className="shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-ui font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
              >
                Create an account
              </Link>

              <p className="text-center text-ui-xs leading-relaxed text-slate-500">
                An account lets you save stations and post reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

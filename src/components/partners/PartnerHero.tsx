// src/components/partners/PartnerHero.tsx
import { ArrowRight, Check, MapPin, Plug, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

/**
 * The pitch at the top of Partner Up.
 *
 * Deliberately carries no invented metrics. Reference designs for this kind of
 * page lean on lines like "2,000+ active drivers" and "15,000 views a month",
 * and every one of those on a young product is a number somebody made up. The
 * counts here are passed in from the database, and any that are still zero are
 * left out rather than dressed up — the rest of this codebase had exactly that
 * problem and it took a day to clear out.
 */

export interface PartnerHeroProps {
  stats: {
    listings: number
    cities: number
    ports: number
    partners: number
  }
}

/** Only the figures that are actually non-zero earn a place in the trust line. */
function trustLine(stats: PartnerHeroProps['stats']): string | null {
  const parts: string[] = []
  if (stats.partners > 0) {
    parts.push(`${stats.partners} partner${stats.partners === 1 ? '' : 's'}`)
  }
  if (stats.listings > 0) {
    parts.push(`${stats.listings} charging point${stats.listings === 1 ? '' : 's'}`)
  }
  if (stats.cities > 0) parts.push(`${stats.cities} ${stats.cities === 1 ? 'city' : 'cities'}`)

  return parts.length > 0 ? parts.join(' · ') : null
}

const PROMISES = [
  'Free to list — no card, no time limit',
  'You set your own rates and keep every rupee',
  'Live on the map once we verify the details',
]

export function PartnerHero({ stats }: PartnerHeroProps) {
  const trust = trustLine(stats)

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* A faint grid, purely decorative, kept behind the content. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
        }}
      />

      <div className="container-plug relative grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        {/* ── The pitch ─────────────────────────────────────────── */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-ui-sm font-semibold text-plug-cyan-200 backdrop-blur">
            <Plug size={14} aria-hidden="true" />
            Partner Up
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            Put your charger in front of{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 to-plug-blue-300 bg-clip-text text-transparent">
              Pakistan&apos;s EV drivers
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Whether it is a bank of chargers at your hotel or the single unit on your
            driveway, listing it on Plug.pk puts it on the map drivers search when they
            need a charge — and gives you a dashboard showing who found you.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-2.5 text-white/80">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-plug-cyan-400/20"
                >
                  <Check size={12} className="text-plug-cyan-300" />
                </span>
                <span className="text-ui">{promise}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/business/signup"
              className="group inline-flex h-13 items-center gap-2 rounded-xl bg-gradient-brand px-7 text-ui font-bold text-white shadow-[0_10px_30px_rgba(6,182,212,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(6,182,212,0.5)]"
            >
              List your charger
              <ArrowRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="#pricing"
              className="inline-flex h-13 items-center rounded-xl border border-white/20 bg-white/5 px-7 text-ui font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              See plans
            </Link>
          </div>

          {trust ? (
            <p className="mt-8 text-ui-sm text-white/45">
              Already on the map: <span className="font-semibold text-white/70">{trust}</span>
            </p>
          ) : (
            <p className="mt-8 text-ui-sm text-white/45">
              We are building the map now — early listings are the first drivers see.
            </p>
          )}
        </div>

        {/* ── What a host actually sees ─────────────────────────── */}
        <div className="relative">
          <div className="rounded-3xl border border-white/12 bg-[#0A0F1E]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur">
            {/* Labelled as an example, because it is drawn rather than measured.
                The alternative — presenting invented view counts as a real
                dashboard — is the thing this page is careful not to do. */}
            <p className="mb-5 text-ui-xs font-semibold uppercase tracking-widest text-white/35">
              Example of your dashboard
            </p>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand"
              >
                <Zap size={20} className="fill-white text-white" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-white">Your listing</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-ui-sm text-white/50">
                  <MapPin size={12} aria-hidden="true" />
                  Your city · your chargers
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-1 text-ui-xs font-semibold text-emerald-300">
                Live
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Listing views', hint: 'per day, per visitor' },
                { label: 'Directions taken', hint: 'drivers heading to you' },
                { label: 'Reviews received', hint: 'from real visits' },
                { label: 'Average rating', hint: 'out of five' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <dt className="text-ui-sm font-semibold text-white/80">{metric.label}</dt>
                  <dd className="mt-1 text-ui-xs text-white/40">{metric.hint}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="flex items-center gap-2 text-ui-sm font-semibold text-white/80">
                <TrendingUp size={15} className="text-plug-cyan-300" aria-hidden="true" />
                Views per day, and the 30 days before
              </p>
              {/* A shape, not data: no axis labels and no numbers, so it reads
                  as an illustration of the chart rather than a claim. */}
              <span
                aria-hidden="true"
                className="mt-4 flex h-24 items-end gap-1"
              >
                {[18, 34, 26, 44, 38, 56, 48, 62, 54, 72, 66, 84].map((height, index) => (
                  <span
                    key={index}
                    style={{ height: `${height}%` }}
                    className="flex-1 rounded-t bg-gradient-to-t from-plug-blue-500/40 to-plug-cyan-400/70"
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

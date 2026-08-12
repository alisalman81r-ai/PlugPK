// src/components/home/Hero.tsx
'use client'

import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { HeroSearch } from '@/components/home/HeroSearch'
import { ConnectorBadgeGroup, PhotoFrame, PortMeter, SpeedBadge } from '@/components/ui'
import { MOCK_STATIONS } from '@/lib/mock-data'
import { cn, formatPricePerKwh, getLowestPrice, getMaxPower, getPortAvailability } from '@/lib/utils'

/**
 * The hero card shows a real station from the catalogue rather than an
 * invented one — the same photo, status and pricing the station page shows,
 * so the first thing a visitor sees is the actual product.
 */
const FEATURED = MOCK_STATIONS.find((station) => station.slug === 'mall-road-ev-hub-lahore')

export function Hero() {
  const maxPower = FEATURED ? getMaxPower(FEATURED) : 0
  const ports = FEATURED ? getPortAvailability(FEATURED) : { available: 0, total: 0 }
  const price = FEATURED ? getLowestPrice(FEATURED) : null

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-950">
      {/* Layer 0 — photograph. Carries the depth that CSS gradients alone
          cannot; everything above it is treatment, not decoration. */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <Image
          src="/images/hero/charging-hub-night.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.28]"
        />
      </div>

      {/* Layer 1 — brand wash, keeps the photo from reading as a stock plate */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-blue-950/60"
      />

      {/* Layer 2 — dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]"
      />

      {/* Layer 3 — glow behind the headline, anchors the eye left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[120px] top-1/4 z-0 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-[130px]"
      />

      {/* Layer 4 — floor fade into the next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[240px] bg-gradient-to-b from-transparent to-slate-950"
      />

      <div className="container-plug relative z-10 w-full pb-24 pt-32 lg:pb-32 lg:pt-40">
        <div className="grid items-center gap-16 lg:grid-cols-[11fr_9fr]">
          {/* ── Left column ─────────────────────────────────────── */}
          <div>
            <span className="mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium uppercase tracking-widest text-white/70 opacity-0 backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400"
              />
              Live across 18 cities
            </span>

            <h1 className="mb-6 text-[clamp(2.75rem,7vw,4.75rem)] font-black leading-[0.98] tracking-[-0.03em] text-white">
              <span className="block animate-fade-up opacity-0">Every charger</span>
              <span className="delay-100 block animate-fade-up opacity-0">in Pakistan.</span>
              <span className="delay-200 block animate-fade-up bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent opacity-0">
                One map.
              </span>
            </h1>

            <p className="delay-300 mb-9 max-w-md animate-fade-up text-lg leading-relaxed text-white/65 opacity-0">
              Live port availability, real prices, and reviews from drivers who actually
              charged there.
            </p>

            {/* delay-400 comes from globals.css (animation-delay). Tailwind's
                own delay-* utility sets transition-delay and would not stagger
                the fade-up animation. */}
            <div className="delay-400 animate-fade-up opacity-0">
              <HeroSearch />
            </div>

            <div className="delay-500 mt-8 animate-fade-up border-t border-white/10 pt-6 opacity-0">
              <Link
                href="/routes"
                className="group/link inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
              >
                Driving between cities? Plan a route with charging stops
                <ArrowRight
                  size={15}
                  className="shrink-0 transition-transform duration-200 group-hover/link:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* ── Right column — a real station, not a mock ────────── */}
          {FEATURED ? (
            <div className="delay-600 hidden animate-fade-up opacity-0 lg:block">
              <Link
                href={`/station/${FEATURED.slug}`}
                className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-e4 backdrop-blur-xl transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <PhotoFrame
                    src={FEATURED.coverPhoto}
                    alt={`${FEATURED.name} charging station`}
                    sizes="(max-width: 1024px) 0px, 460px"
                    priority
                    zoomOnHover
                    overlay
                  />

                  {FEATURED.isVerified ? (
                    <span className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
                      <ShieldCheck size={13} className="text-cyan-300" aria-hidden="true" />
                      <span className="text-xs font-medium text-white">Verified</span>
                    </span>
                  ) : null}

                  <div className="absolute inset-x-4 bottom-4 z-10">
                    <p className="text-lg font-bold leading-tight text-white">{FEATURED.name}</p>
                    <p className="mt-0.5 text-sm text-white/70">
                      {FEATURED.address.area}, {FEATURED.address.city}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  {/* The signature availability read, shown here at the largest
                      size it appears anywhere in the product. */}
                  <PortMeter
                    available={ports.available}
                    total={ports.total}
                    size="lg"
                    onDark
                    className="mb-4"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ConnectorBadgeGroup connectors={FEATURED.connectors} max={2} size="sm" />
                      {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
                    </div>
                    {price !== null ? (
                      <span className="shrink-0 font-mono text-sm font-semibold text-white">
                        {price === 0 ? 'Free' : formatPricePerKwh(price)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>

              <p className="mt-4 text-center text-xs text-white/35">
                A live listing from the network
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <Link
        href="#stats"
        aria-label="Scroll to explore"
        className={cn(
          'absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex',
          'transition-opacity duration-150 hover:opacity-80',
        )}
      >
        <span className="text-xs uppercase tracking-widest text-white/40">Scroll to explore</span>
        <ChevronDown size={16} className="animate-bounce text-white/40" aria-hidden="true" />
      </Link>
    </section>
  )
}

// src/components/home/ServicesPreview.tsx
import { ArrowRight, Car, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { SERVICE_CATEGORIES } from '@/lib/constants'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The EV ecosystem band.
 *
 * Dark on purpose. Glass needs something behind it to refract — over a white
 * section a translucent card is just a grey card, so the surface it sits on is
 * doing as much work here as the blur.
 *
 * The counts are read from the database. They used to come from SERVICE_
 * CATEGORIES, which carries figures like 24 dealerships and 45 accessory shops
 * against a table holding twelve services in total. A category with nothing in
 * it now says so rather than printing a zero.
 */

/** SERVICE_CATEGORIES stores icon and colour as strings; resolve them here. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  dealership: Car,
  'service-center': Wrench,
  'home-charger-installer': Home,
  accessories: Package,
  insurance: Shield,
  'roadside-assistance': LifeBuoy,
}

/**
 * A tint per category, applied to the icon and to the glow that lights the
 * card behind it. Held as full class strings so Tailwind can see them.
 */
const CATEGORY_TONES: Record<string, { icon: string; glow: string; ring: string }> = {
  dealership: {
    icon: 'text-sky-300',
    glow: 'bg-sky-400/20',
    ring: 'group-hover:border-sky-300/40',
  },
  'service-center': {
    icon: 'text-emerald-300',
    glow: 'bg-emerald-400/20',
    ring: 'group-hover:border-emerald-300/40',
  },
  'home-charger-installer': {
    icon: 'text-violet-300',
    glow: 'bg-violet-400/20',
    ring: 'group-hover:border-violet-300/40',
  },
  accessories: {
    icon: 'text-amber-300',
    glow: 'bg-amber-400/20',
    ring: 'group-hover:border-amber-300/40',
  },
  insurance: {
    icon: 'text-cyan-300',
    glow: 'bg-cyan-400/20',
    ring: 'group-hover:border-cyan-300/40',
  },
  'roadside-assistance': {
    icon: 'text-rose-300',
    glow: 'bg-rose-400/20',
    ring: 'group-hover:border-rose-300/40',
  },
}

const FALLBACK_TONE = {
  icon: 'text-slate-300',
  glow: 'bg-slate-400/20',
  ring: 'group-hover:border-white/30',
}

export async function ServicesPreview() {
  const counts = await getServiceCategoryCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <section className="relative overflow-hidden bg-[#0A0F1E] py-24 lg:py-32">
      {/* Two soft lights, off-centre and far apart, so the glass has something
          uneven to pick up. A flat background makes a blur look like paint. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-plug-blue-600/20 blur-[130px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-plug-cyan-500/15 blur-[130px]"
      />
      {/* A third light directly behind the grid. Without it both sources sat
          at the edges and the cards had nothing to refract — a blur over an
          even surface is indistinguishable from a flat tint. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[900px] -translate-x-1/2 -translate-y-[35%] rounded-full bg-plug-blue-500/[0.13] blur-[140px]"
      />
      {/* A faint grid, masked to fade out before it reaches the edges. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      />

      <div className="container-plug relative">
        {/* ── The heading, given room and weight ───────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-ui-xs font-bold uppercase tracking-[0.18em] text-plug-cyan-300 backdrop-blur-md">
            EV Ecosystem
          </span>

          <h2 className="mt-7 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-white">
            Everything an EV driver{' '}
            <span className="bg-gradient-to-r from-plug-cyan-300 via-plug-cyan-200 to-plug-blue-300 bg-clip-text text-transparent">
              needs
            </span>
            .
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60">
            Beyond charging — dealers, workshops, installers and insurers, each one
            checked before it is listed.
          </p>
        </div>

        {/* ── The cards ────────────────────────────────────────── */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Package
            const tone = CATEGORY_TONES[category.id] ?? FALLBACK_TONE
            const count = counts[category.id] ?? 0

            return (
              <Link
                key={category.id}
                href={`/services/${category.id}`}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl p-7',
                  // The glass itself: a translucent face, a real blur, and a
                  // hairline that catches the light at the top edge.
                  'border border-white/[0.12] bg-white/[0.055] backdrop-blur-2xl',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_18px_40px_-24px_rgba(0,0,0,0.8)]',
                  'transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.10]',
                  tone.ring,
                )}
              >
                {/* The category's own light, sitting behind the glass rather
                    than on it, so hovering warms the whole panel. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-[70px] transition-opacity duration-500',
                    'opacity-0 group-hover:opacity-100',
                    tone.glow,
                  )}
                />

                <span
                  aria-hidden="true"
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl transition-colors duration-300 group-hover:border-white/25"
                >
                  <Icon size={24} className={tone.icon} />
                </span>

                <h3 className="relative mt-6 text-lg font-bold tracking-tight text-white">
                  {category.label}
                </h3>

                <p className="relative mt-2 flex-1 text-ui-sm leading-relaxed text-white/55">
                  {category.description}
                </p>

                <span className="relative mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-ui-sm font-medium text-white/70">
                    {count > 0
                      ? `${count} listed`
                      : // Said rather than shown as "0 listed", which reads as
                        // a broken counter rather than an honest empty shelf.
                        'None listed yet'}
                  </span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/80"
                  />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/services"
            className="group inline-flex h-13 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 text-ui font-semibold text-white backdrop-blur-xl transition-all duration-200 hover:border-white/35 hover:bg-white/10"
          >
            {total > 0 ? `Explore all ${total} services` : 'Explore EV services'}
            <ArrowRight
              size={17}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}

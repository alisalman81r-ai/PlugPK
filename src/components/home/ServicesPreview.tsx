// src/components/home/ServicesPreview.tsx
import { ArrowRight, Car, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { SERVICE_CATEGORIES } from '@/lib/constants'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The EV ecosystem band.
 *
 * White, as it was. The glass survives the change but had to be rebuilt for
 * it: a translucent white card over a white section is invisible, so the
 * frosting here works against soft coloured blooms placed behind the grid.
 * The cards blur those blooms, which is what makes the panels read as glass
 * rather than as plain white boxes with a border.
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
 * A tint per category: the icon, the bloom that lights the card behind it, and
 * the edge it takes on hover. Full class strings so Tailwind can see them.
 */
const CATEGORY_TONES: Record<string, { icon: string; glow: string; ring: string }> = {
  dealership: {
    icon: 'text-sky-600',
    glow: 'bg-sky-400/25',
    ring: 'group-hover:border-sky-300',
  },
  'service-center': {
    icon: 'text-emerald-600',
    glow: 'bg-emerald-400/25',
    ring: 'group-hover:border-emerald-300',
  },
  'home-charger-installer': {
    icon: 'text-violet-600',
    glow: 'bg-violet-400/25',
    ring: 'group-hover:border-violet-300',
  },
  accessories: {
    icon: 'text-amber-600',
    glow: 'bg-amber-400/25',
    ring: 'group-hover:border-amber-300',
  },
  insurance: {
    icon: 'text-cyan-600',
    glow: 'bg-cyan-400/25',
    ring: 'group-hover:border-cyan-300',
  },
  'roadside-assistance': {
    icon: 'text-rose-600',
    glow: 'bg-rose-400/25',
    ring: 'group-hover:border-rose-300',
  },
}

const FALLBACK_TONE = {
  icon: 'text-slate-600',
  glow: 'bg-slate-400/25',
  ring: 'group-hover:border-slate-300',
}

export async function ServicesPreview() {
  const counts = await getServiceCategoryCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      {/*
        Glass is only visible when there is something behind it to distort.
        On a white section that has to be built deliberately, so two things
        sit under the grid: a ruled pattern the cards visibly soften, and
        blooms placed to fall behind the cards rather than out in the open —
        the panels pick up the colour while the section stays white.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[38%] h-[62%]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          maskImage: 'radial-gradient(ellipse 60% 75% at 50% 45%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 75% at 50% 45%, black 30%, transparent 75%)',
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[6%] top-[42%] h-[380px] w-[380px] rounded-full bg-plug-blue-400/30 blur-[110px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[55%] h-[360px] w-[360px] rounded-full bg-plug-cyan-400/30 blur-[110px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[60%] h-[300px] w-[520px] -translate-x-1/2 rounded-full bg-violet-400/20 blur-[110px]"
      />

      <div className="container-plug relative">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-1.5 text-ui-xs font-bold uppercase tracking-[0.18em] text-plug-blue-600 backdrop-blur-md">
            EV Ecosystem
          </span>

          <h2 className="mt-7 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Everything an EV driver{' '}
            <span className="bg-gradient-to-r from-plug-blue-600 via-plug-blue-500 to-plug-cyan-500 bg-clip-text text-transparent">
              needs
            </span>
            .
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
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
                  // Thin enough to see through. At 65% white over a 40px blur
                  // the panel was opaque in practice, which is why it read as
                  // a plain card; 42% over a 16px blur leaves the pattern and
                  // the bloom behind it legible but soft, which is the whole
                  // tell of glass.
                  'border border-white/60 bg-white/[0.42] backdrop-blur-md backdrop-saturate-150',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(15,23,42,0.04),0_10px_30px_-14px_rgba(15,23,42,0.20)]',
                  'transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/[0.58]',
                  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_44px_-16px_rgba(15,23,42,0.28)]',
                  tone.ring,
                )}
              >
                {/* The category's own light. Visible at rest now, not only on
                    hover — it is what gives each panel its own cast rather than
                    six identical white rectangles. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full blur-[60px] transition-opacity duration-500',
                    'opacity-70 group-hover:opacity-100',
                    tone.glow,
                  )}
                />

                {/* The sheen: light catching the top-left face of the pane.
                    Without it a translucent rectangle reads as tracing paper
                    rather than glass. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/10 to-transparent"
                />

                <span
                  aria-hidden="true"
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl transition-colors duration-300 group-hover:border-slate-300"
                >
                  <Icon size={24} className={tone.icon} />
                </span>

                <h3 className="relative mt-6 text-lg font-bold tracking-tight text-slate-900">
                  {category.label}
                </h3>

                <p className="relative mt-2 flex-1 text-ui-sm leading-relaxed text-slate-500">
                  {category.description}
                </p>

                <span className="relative mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4">
                  <span className="text-ui-sm font-medium text-slate-600">
                    {count > 0
                      ? `${count} listed`
                      : // Said rather than shown as "0 listed", which reads as
                        // a broken counter rather than an honest empty shelf.
                        'None listed yet'}
                  </span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-plug-blue-600"
                  />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/services"
            className="group inline-flex h-13 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-8 text-ui font-semibold text-slate-900 backdrop-blur-xl transition-all duration-200 hover:border-plug-blue-300 hover:bg-white"
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

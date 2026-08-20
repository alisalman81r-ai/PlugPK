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
      {/* The blooms the glass refracts, kept deliberately faint. They are
          here so a blurred card has something behind it other than paper —
          any stronger and the section stops reading as white, which is the
          whole point of it being white. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-plug-blue-400/[0.10] blur-[140px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-plug-cyan-400/[0.10] blur-[140px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-[30%] rounded-full bg-plug-blue-300/[0.08] blur-[150px]"
      />
      {/* A faint grid, masked so it fades out before the edges. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
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
                  // Frosted rather than solid: the card is mostly-opaque white
                  // over the blooms, with a bright inner top edge — the light
                  // equivalent of the dark version's hairline.
                  'border border-white/90 bg-white/65 backdrop-blur-2xl',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-14px_rgba(15,23,42,0.18)]',
                  'transition-all duration-300 hover:-translate-y-1 hover:bg-white/85',
                  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_44px_-16px_rgba(15,23,42,0.28)]',
                  tone.ring,
                )}
              >
                {/* The category's own light, behind the glass rather than on
                    it, so a hover warms the whole panel. */}
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

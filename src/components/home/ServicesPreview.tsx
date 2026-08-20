// src/components/home/ServicesPreview.tsx
import { ArrowRight, Car, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The EV ecosystem band.
 *
 * Plain white, with the card treatment shared with Partner Up: a gradient
 * hairline frame, a resting shadow, an outlined icon holder and a cap rule that
 * warms on hover.
 *
 * The glass version this replaced needed coloured blooms and a ruled pattern
 * behind it to read as glass at all, and those were doing more talking than the
 * content. Nothing here tints the background.
 *
 * The counts are read from the database. They used to come from
 * SERVICE_CATEGORIES, which carries figures like 24 dealerships and 45
 * accessory shops against a table holding twelve services in total. A category
 * with nothing in it says so rather than printing a zero.
 */

/** SERVICE_CATEGORIES stores its icon as a string; resolve it here. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  dealership: Car,
  'service-center': Wrench,
  'home-charger-installer': Home,
  accessories: Package,
  insurance: Shield,
  'roadside-assistance': LifeBuoy,
}

export async function ServicesPreview() {
  const counts = await getServiceCategoryCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container-plug">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            EV Ecosystem
          </span>

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Everything an EV driver needs.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            Beyond charging — dealers, workshops, installers and insurers, each one
            checked before it is listed.
          </p>
        </div>

        {/* ── The cards ────────────────────────────────────────── */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Package
            const count = counts[category.id] ?? 0

            return (
              <Link key={category.id} href={`/services/${category.id}`} className={FRAME}>
                <div className={cn(FACE, 'p-8')}>
                  <span aria-hidden="true" className={ICON_FRAME}>
                    <Icon size={24} className={ICON_GLYPH} />
                  </span>

                  <span aria-hidden="true" className={cn('mt-8', CAP_RULE)} />

                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {category.label}
                  </h3>

                  <p className="mt-3 flex-1 text-ui leading-relaxed text-slate-500">
                    {category.description}
                  </p>

                  <span className="mt-7 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-ui-sm font-medium text-slate-600">
                      {count > 0
                        ? `${count} listed`
                        : // Said rather than shown as "0 listed", which reads as a
                          // broken counter rather than an honest empty shelf.
                          'None listed yet'}
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-plug-blue-600"
                    />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/services"
            className="group inline-flex h-13 items-center gap-2 rounded-xl border-[1.5px] border-slate-300 px-8 text-ui font-semibold text-slate-700 transition-colors duration-200 hover:border-plug-blue-400 hover:text-plug-blue-700"
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

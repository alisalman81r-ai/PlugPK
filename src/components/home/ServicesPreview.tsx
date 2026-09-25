// src/components/home/ServicesPreview.tsx
import { ArrowRight, Car, Home, LifeBuoy, Package, Shield, Wrench, type LucideIcon } from 'lucide-react'

import { AnimatedIcon, HoverLink, PillButton, type IconMotion } from '@/components/ui'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { readOrFallback } from '@/lib/db/availability'
import { getServiceCategoryCounts } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The EV ecosystem band.
 *
 * Plain white. Each card is a card inside a card: a pale outer shell, and in
 * it a white face with the icon standing on its own (no tile behind it), a short uppercase tag set
 * against it on the right, the title and a two-line description, a hairline,
 * and a status line at the foot — a green dot and the real listed count, or a
 * grey one where the category is still empty. No numbering: the categories
 * have no order.
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

/**
 * Each glyph's motion, matched to what it depicts rather than picked for
 * variety: the car pulls away, the wrench turns, the shield takes a beat, the
 * ring throws itself. See AnimatedIcon for the set.
 */
const CATEGORY_MOTION: Record<string, IconMotion> = {
  dealership: 'travel',
  'service-center': 'spin',
  'home-charger-installer': 'lift',
  accessories: 'pop',
  insurance: 'pulse',
  'roadside-assistance': 'swing',
}

/**
 * The tag in each card's corner and the fuller line under its title. Kept
 * here, not in SERVICE_CATEGORIES, whose one-line descriptions other pages
 * use as they are.
 */
const CATEGORY_COPY: Record<string, { tag: string; body: string }> = {
  dealership: {
    tag: 'Buy & test drive',
    body: 'Authorised EV dealers across Pakistan, for test drives, prices and delivery dates.',
  },
  'service-center': {
    tag: 'Repairs & upkeep',
    body: 'Certified workshops that know battery, motor and software, not only the brakes.',
  },
  'home-charger-installer': {
    tag: 'Charge at home',
    body: 'Professional wall-charger installs, from the site survey to the first plug-in.',
  },
  accessories: {
    tag: 'Gear & cables',
    body: 'Cables, adapters and portable chargers, matched to the connector your car uses.',
  },
  insurance: {
    tag: 'Cover & claims',
    body: 'Insurers who price the battery properly and know how to handle an EV claim.',
  },
  'roadside-assistance': {
    tag: 'Help on the road',
    body: 'Round-the-clock support: a mobile charge, a tow, or advice on the phone.',
  },
}

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
  /*
    Counts per category, or none.

    This is the second data read on the landing page and it is easy to miss:
    the page itself awaits three queries, and this component awaits a fourth
    from inside the tree. Guarding only the page left the whole thing throwing
    anyway — the counts below are a per-card chip, not the reason the section
    exists, so the grid renders without them. See lib/db/availability.
  */
  const counts = await readOrFallback('/ service category counts', {}, getServiceCategoryCounts)
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container-plug">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            EV Ecosystem
          </span>

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.035em] text-slate-900">
            Everything an EV driver{' '}
            <span className="text-plug-blue-600">needs</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            Beyond charging — dealers, workshops, installers and insurers, each one
            checked before it is listed.
          </p>
        </div>

        {/* ── The cards ────────────────────────────────────────── */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Package
            const count = counts[category.id] ?? 0
            const copy = CATEGORY_COPY[category.id] ?? { tag: 'EV services', body: category.description }

            return (
              /*
               * HoverLink rather than Link: this file is an async server
               * component, so it cannot render motion itself, and the icon's
               * motion has to be driven by the whole card being hovered.
               */
              <HoverLink
                key={category.id}
                href={`/services/${category.id}`}
                className={cn(
                  // The shell.
                  'group relative block rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-2.5',
                  'transition-colors duration-300 hover:border-plug-cyan-500/40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
                )}
              >
                {/* The face. */}
                <div
                  className={cn(
                    'flex h-full flex-col rounded-[1.35rem] border border-slate-200 bg-white p-6 sm:p-7',
                    'shadow-[0_1px_2px_rgba(5,36,30,0.04),0_10px_30px_-18px_rgba(5,36,30,0.18)]',
                    'transition-[box-shadow,transform] duration-300',
                    'group-hover:-translate-y-0.5 group-hover:shadow-[0_2px_4px_rgba(5,36,30,0.05),0_22px_44px_-22px_rgba(5,36,30,0.28)]',
                    'motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-start text-slate-700 transition-colors duration-300 group-hover:text-plug-blue-600"
                    >
                      <AnimatedIcon motion={CATEGORY_MOTION[category.id] ?? 'pop'}>
                        <Icon size={26} strokeWidth={1.6} />
                      </AnimatedIcon>
                    </span>
                    <span className="pt-1 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {copy.tag}
                    </span>
                  </div>

                  <h3 className="mt-7 text-[1.35rem] font-bold tracking-[-0.015em] text-slate-900">{category.label}</h3>

                  <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-slate-500">{copy.body}</p>

                  <span className="mt-7 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 rounded-full',
                          count > 0 ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]' : 'bg-slate-300',
                        )}
                      />
                      <span className={count > 0 ? 'text-slate-600' : 'text-slate-400'}>
                        {count > 0
                          ? `${count} listed`
                          : // Said rather than shown as "0 listed", which reads as a
                            // broken counter rather than an honest empty shelf.
                            'None listed yet'}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-plug-blue-600"
                    />
                  </span>
                </div>
              </HoverLink>
            )
          })}
        </div>

        <div className="mt-14 flex justify-center">
          {/* The same pill-and-badge as the free band and the route promo. It
              was an outlined button, which read as a secondary control in a
              section where it is the only action. */}
          <PillButton href="/services">
            {total > 0 ? `Explore all ${total} services` : 'Explore EV services'}
          </PillButton>
        </div>
      </div>
    </section>
  )
}

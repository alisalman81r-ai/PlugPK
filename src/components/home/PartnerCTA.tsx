// src/components/home/PartnerCTA.tsx
import {
  Building2,
  Car,
  Check,
  Hotel,
  ShoppingBag,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion, PillButton, type IconMotion } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * Partner Up, on the home page.
 *
 * Renamed from BusinessCTA, and pointed at /partners rather than
 * /for-businesses. Those are two pages doing the same job — one titled
 * "Partner Up" and built on the shared card treatment, the other an older
 * "For Businesses" — and a home page section calling itself Partner Up while
 * linking to the other one would just teach visitors that the two names mean
 * different things.
 *
 * The blue stays, by request — it is what set this band apart from the white
 * sections either side of it. The tinted card and its Zap watermark are back,
 * with the structure the redesign brought: centred eyebrow, black heading with
 * one blue word, the five kinds of host as pills, then one card and one
 * button. The watermark sits behind everything at low contrast and the card
 * inside it stays white, so the fill is a ground rather than something the
 * text has to fight.
 *
 * "Free to list, Premium available" stays because it is true — PartnerPricing
 * publishes a real Premium tier at PKR 4,999 a month. It does not contradict
 * the free band above: that promise is to drivers, who are never charged for
 * anything. This one is to hosts.
 */

interface HostType {
  label: string
  icon: LucideIcon
  motion: IconMotion
}

/** Who this is for, in the order a reader is likeliest to recognise. */
const HOST_TYPES: HostType[] = [
  { label: 'Hotels & resorts', icon: Hotel, motion: 'lift' },
  { label: 'Restaurants & cafés', icon: Utensils, motion: 'pop' },
  { label: 'Shopping malls', icon: ShoppingBag, motion: 'lift' },
  { label: 'Office buildings', icon: Building2, motion: 'pop' },
  { label: 'Dealerships', icon: Car, motion: 'travel' },
]

interface Benefit {
  title: string
  description: string
}

/** Each line maps to something the application actually does today. */
const BENEFITS: Benefit[] = [
  {
    title: 'Appear on the Plug.pk map',
    description: 'Your chargers show up the moment drivers search nearby.',
  },
  {
    title: 'Visible to 5,000+ active EV owners',
    description: 'Reach drivers actively looking for somewhere to charge.',
  },
  {
    title: 'Manage charger details and availability',
    description: 'Update connectors, pricing and hours whenever they change.',
  },
  {
    title: 'Receive and respond to reviews',
    description: 'Build trust by replying to feedback in public.',
  },
  {
    title: 'Analytics on visits and navigation clicks',
    description: 'See how many drivers viewed and routed to your site.',
  },
]

export function PartnerCTA() {
  return (
    <section className="bg-slate-50 py-24 lg:py-32">
      <div className="container-plug">
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
          <Zap
            size={220}
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 text-blue-100/70"
          />

        {/* ── The heading ──────────────────────────────────────── */}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Partner up
          </span>

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Have chargers? Reach thousands of{' '}
            <span className="text-plug-blue-600">drivers</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            List your charger on Plug.pk and become the place Pakistan&apos;s EV drivers stop
            at — you set the rate, you keep it.
          </p>
        </div>

        {/* ── Who it is for ────────────────────────────────────── */}
        <ul className="relative z-10 mt-12 flex flex-wrap justify-center gap-3">
          {HOST_TYPES.map((type) => {
            const Icon = type.icon

            return (
              <li key={type.label}>
                {/* Outlined, and hovering one pill moves only its own glyph. */}
                <HoverMotion className="group/pill flex items-center gap-2.5 rounded-full border border-blue-200 bg-white px-4 py-2.5 text-ui-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 hover:border-plug-blue-400">
                  <AnimatedIcon motion={type.motion}>
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-plug-blue-600"
                    />
                  </AnimatedIcon>
                  {type.label}
                </HoverMotion>
              </li>
            )
          })}
        </ul>

        {/* ── What a host gets ─────────────────────────────────── */}
        <HoverMotion className={cn(FRAME, 'relative z-10 mx-auto mt-8 max-w-5xl')}>
          <div className={cn(FACE, 'p-8 lg:p-10')}>
            {/* Outlined, matching every other holder in this card system.
                It was a filled blue chip sitting inside the same FRAME/FACE
                card the steps on Partner Up use — the one place on the page
                where the rule "prominence from the edge, never the fill" was
                broken, and directly above a CAP_RULE that follows it. */}
            <span aria-hidden="true" className={ICON_FRAME}>
              <AnimatedIcon motion="pulse">
                <Building2 size={24} className={ICON_GLYPH} />
              </AnimatedIcon>
            </span>

            <span aria-hidden="true" className={cn('mt-7', CAP_RULE)} />

            <h3 className="mt-5 text-[1.375rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-slate-900">
              What a listing gets you
            </h3>

            <ul className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  {/* Outlined rather than filled, matching the tick list on
                      the Partner Up pricing cards. Blue rather than the green
                      it used to be — green was the only third colour anywhere
                      on the page. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-plug-blue-200"
                  >
                    <Check size={11} strokeWidth={3} className="text-plug-blue-600" />
                  </span>
                  <span>
                    <span className="block text-ui font-semibold text-slate-900">
                      {benefit.title}
                    </span>
                    <span className="mt-0.5 block text-ui-sm leading-relaxed text-slate-500">
                      {benefit.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col items-center gap-4 border-t border-slate-100 pt-8">
              <PillButton href="/partners">
                List your charger
              </PillButton>

              <p className="text-ui-xs text-slate-500">
                Free to list. Premium available if you want more.
              </p>
            </div>
          </div>
        </HoverMotion>
        </div>
      </div>
    </section>
  )
}

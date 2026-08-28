// src/components/business/BusinessTestimonials.tsx
import {
  Building2,
  Car,
  Coffee,
  Hotel,
  MapPinned,
  Route,
  ShoppingBag,
  Star,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { SectionHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * What a listing does, and who it is for.
 *
 * ── What this section used to be ──────────────────────────────────────
 *
 * Three customer testimonials, five stars each, under the heading "Trusted by
 * EV-Forward Businesses". Every one of them was invented: named people — Usman
 * Tariq, Fatima Ahmed, Kamran Hussain — given job titles at named businesses,
 * one of them a real brand, quoted claiming specific results including
 * "excellent ROI" and "a 30% increase in EV-owning customers".
 *
 * The Business table holds zero rows. Not zero approved — zero. So there was no
 * customer to have said any of it, and the page attributed words and commercial
 * outcomes to three people who do not exist at businesses that had not signed
 * up. That is a false claim about a real named brand as well as invented social
 * proof, and it is the sort of thing that is repeated back to a company by a
 * regulator rather than merely being embarrassing.
 *
 * It also contradicted this product's own standard, written on PartnerHero:
 * reference designs for this kind of page lean on invented metrics, and this
 * one does not do that — counts come from the database and a figure that is
 * still zero is left out rather than dressed up.
 *
 * ── What replaced it ──────────────────────────────────────────────────
 *
 * The same three-card shape, carrying three things the application actually
 * does for a host, each traceable to code that exists: the listing appears on
 * the map the moment it is approved, the route planner can route a driver
 * through it, and drivers can rate it. No names, no quotes, no stars standing
 * in for a review nobody left.
 *
 * When there are real hosts with real things to say, quotes belong here — with
 * their consent and their actual words. Until then this says what the product
 * does, which is the honest version of the same pitch.
 */

interface Capability {
  icon: LucideIcon
  title: string
  body: string
}

const CAPABILITIES: Capability[] = [
  {
    icon: MapPinned,
    title: 'You appear on the map',
    body: 'Once your listing is approved it is on the charging map and in search, filterable by connector and speed, with directions one tap away.',
  },
  {
    icon: Route,
    title: 'Route planning sends drivers to you',
    body: 'The planner sizes charging stops against a car’s real battery and range, so a listing on a long corridor becomes a scheduled stop rather than a hope.',
  },
  {
    icon: Star,
    title: 'Drivers rate what they actually used',
    body: 'Reviews come from people who charged there, and you can reply to them in public. Your rating is counted from those reviews, never set by us.',
  },
]

const BUSINESS_TYPES: { label: string; icon: LucideIcon }[] = [
  { label: 'Hotels', icon: Hotel },
  { label: 'Restaurants', icon: Utensils },
  { label: 'Shopping Malls', icon: ShoppingBag },
  { label: 'Office Buildings', icon: Building2 },
  { label: 'Dealerships', icon: Car },
  { label: 'Service Centers', icon: Wrench },
  { label: 'Cafes', icon: Coffee },
  { label: 'Petrol Stations', icon: Zap },
]

export function BusinessTestimonials() {
  return (
    <section className="section-padding bg-slate-50">
      <div className="container-plug">
        <SectionHeader
          align="center"
          eyebrow="What a listing does"
          title="Three things that happen once you are listed"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {CAPABILITIES.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className={FRAME}>
                <div className={cn(FACE, 'p-8')}>
                  <span aria-hidden="true" className={ICON_FRAME}>
                    <Icon size={24} className={ICON_GLYPH} />
                  </span>

                  <span aria-hidden="true" className={cn('mt-8', CAP_RULE)} />

                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-ui leading-relaxed text-slate-500">{item.body}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <h3 className="mb-8 text-xl font-bold text-slate-900">
            Perfect for All EV-Friendly Businesses
          </h3>

          <ul className="flex flex-wrap justify-center gap-4">
            {BUSINESS_TYPES.map((type) => {
              const Icon = type.icon

              return (
                <li
                  key={type.label}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <Icon size={16} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
                  {type.label}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

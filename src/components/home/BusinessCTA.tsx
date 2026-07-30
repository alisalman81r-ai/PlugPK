// src/components/home/BusinessCTA.tsx
import { Building2, Car, Check, Hotel, ShoppingBag, Utensils, Zap, type LucideIcon } from 'lucide-react'

import { Button, EyebrowBadge } from '@/components/ui'

interface BusinessTypeChip {
  label: string
  icon: LucideIcon
}

const BUSINESS_TYPES: BusinessTypeChip[] = [
  { label: 'Hotels & Resorts', icon: Hotel },
  { label: 'Restaurants & Cafes', icon: Utensils },
  { label: 'Shopping Malls', icon: ShoppingBag },
  { label: 'Office Buildings', icon: Building2 },
  { label: 'Dealerships', icon: Car },
]

interface Benefit {
  title: string
  description: string
}

const BENEFITS: Benefit[] = [
  { title: 'Appear on the Plug.pk map', description: 'Your chargers show up the moment drivers search nearby.' },
  { title: 'Visible to 5,000+ active EV owners', description: 'Reach drivers actively looking for somewhere to charge.' },
  { title: 'Manage charger details and availability', description: 'Update connectors, pricing and hours whenever they change.' },
  { title: 'Receive and respond to reviews', description: 'Build trust by replying to feedback in public.' },
  { title: 'Analytics on visits and navigation clicks', description: 'See how many drivers viewed and routed to your site.' },
]

export function BusinessCTA() {
  return (
    <section className="section-padding border-t border-slate-100 bg-white">
      <div className="container-plug">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-12 lg:p-16">
          <Zap
            size={200}
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 text-blue-100 opacity-50"
          />

          <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
            {/* ── Left ─────────────────────────────────────────── */}
            <div>
              <div className="mb-6">
                <EyebrowBadge color="blue">For Businesses</EyebrowBadge>
              </div>

              <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900 lg:text-display-md">
                Have EV Chargers?
                <br />
                Reach Thousands
                <br />
                of EV Owners.
              </h2>

              <p className="mb-8 text-lg text-slate-600">
                List your business on Plug.pk and become the go-to destination for Pakistan&apos;s
                growing EV community.
              </p>

              <ul className="flex flex-wrap gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon

                  return (
                    <li
                      key={type.label}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      <Icon size={16} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
                      {type.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* ── Right ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
              <ul className="mb-8 flex flex-col gap-4">
                {BENEFITS.map((benefit) => (
                  <li key={benefit.title} className="flex items-start gap-3">
                    <Check size={20} className="mt-0.5 shrink-0 text-green-500" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {benefit.title}
                      </span>
                      <span className="block text-sm text-slate-500">{benefit.description}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mb-6 text-center text-xs text-slate-400">
                Free to list. Premium features available.
              </p>

              <div className="flex flex-col gap-3">
                <Button href="/for-businesses" size="lg" fullWidth>
                  List Your Business Free &rarr;
                </Button>
                <Button href="/for-businesses#how-it-works" variant="ghost" size="md" fullWidth>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

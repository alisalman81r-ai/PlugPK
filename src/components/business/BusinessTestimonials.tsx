// src/components/business/BusinessTestimonials.tsx
import {
  Building2,
  Car,
  Coffee,
  Hotel,
  ShoppingBag,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { RatingStars, SectionHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Testimonial {
  quote: string
  name: string
  role: string
  tone: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'We installed 2 EV chargers and listed on Plug.pk. Within a week we had EV customers specifically visiting for charging. Excellent ROI.',
    name: 'Usman Tariq',
    role: 'Owner, Mall Road Hotel, Lahore',
    tone: 'from-blue-500 to-cyan-500',
  },
  {
    quote:
      'Our restaurant saw a 30% increase in EV-owning customers after listing. They stay longer while charging — perfect for our business.',
    name: 'Fatima Ahmed',
    role: 'Manager, The EV Café, Islamabad',
    tone: 'from-purple-500 to-pink-500',
  },
  {
    quote:
      'As a dealership, Plug.pk connects us with active EV buyers at exactly the right moment. Best platform for the Pakistan EV market.',
    name: 'Kamran Hussain',
    role: 'Director, BYD Lahore',
    tone: 'from-emerald-500 to-cyan-500',
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
          eyebrow="Success Stories"
          eyebrowColor="green"
          title="Trusted by EV-Forward Businesses"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl border border-slate-200 bg-white p-7"
            >
              <span
                aria-hidden="true"
                className="-mb-4 block text-6xl font-black leading-none text-blue-100"
              >
                &ldquo;
              </span>

              <div className="mb-4">
                <RatingStars rating={5} size="sm" />
              </div>

              <p className="mb-6 text-base italic leading-relaxed text-slate-600">
                {testimonial.quote}
              </p>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white',
                    testimonial.tone,
                  )}
                >
                  {testimonial.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-slate-900">{testimonial.name}</span>
                  <span className="block text-sm text-slate-500">{testimonial.role}</span>
                </span>
              </div>
            </div>
          ))}
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

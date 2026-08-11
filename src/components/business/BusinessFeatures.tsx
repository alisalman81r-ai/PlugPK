// src/components/business/BusinessFeatures.tsx
import {
  ArrowRight,
  BarChart2,
  Building2,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { SectionHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Feature {
  icon: LucideIcon
  tone: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    tone: 'bg-blue-50 text-plug-blue-600',
    title: 'Map Visibility',
    description:
      'Appear on the Plug.pk charging map and be discovered by EV owners actively searching near you.',
  },
  {
    icon: ShieldCheck,
    tone: 'bg-green-50 text-green-600',
    title: 'Verified Badge',
    description:
      'Get a verified badge that builds trust with EV owners and shows your chargers are accurate and reliable.',
  },
  {
    icon: Zap,
    tone: 'bg-amber-50 text-amber-600',
    title: 'Charger Management',
    description:
      'Easily manage your charger details, availability, and pricing from your simple business dashboard.',
  },
  {
    icon: Star,
    tone: 'bg-purple-50 text-purple-600',
    title: 'Reviews & Ratings',
    description:
      'Receive and respond to reviews from real EV owners who have visited your location.',
  },
  {
    icon: BarChart2,
    tone: 'bg-cyan-50 text-cyan-600',
    title: 'Analytics Dashboard',
    description:
      'Track profile views, navigation clicks, and customer engagement with easy-to-read analytics.',
  },
  {
    icon: Users,
    tone: 'bg-rose-50 text-rose-600',
    title: 'Community Reach',
    description:
      "Reach Pakistan's largest EV community and attract premium EV-owning customers.",
  },
]

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Building2,
    title: 'Create Profile',
    description: 'Tell us about your business — name, type, location and contact details.',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Add Your Chargers',
    description: 'List each connector with its power, ports and pricing so drivers know what to expect.',
  },
  {
    number: '03',
    icon: MapPin,
    title: 'Go Live',
    description: 'We verify your listing and put you on the map, usually within 24 hours.',
  },
]

export function BusinessFeatures() {
  return (
    <>
      <section id="how-it-works" className="section-padding bg-white">
        <div className="container-plug">
          <SectionHeader
            align="center"
            eyebrow="Why Plug.pk"
            eyebrowColor="blue"
            title="Everything You Need to Attract EV Customers"
            subtitle="A complete platform to manage your EV presence."
          />

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-[250ms] hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover"
                >
                  <span
                    className={cn(
                      'mb-5 flex h-14 w-14 items-center justify-center rounded-2xl',
                      feature.tone,
                    )}
                  >
                    <Icon size={26} aria-hidden="true" />
                  </span>

                  <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="container-plug">
          <h2 className="mb-16 text-center text-3xl font-bold text-slate-900">
            Get Listed in 3 Simple Steps
          </h2>

          <div className="grid gap-10 lg:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                <div key={step.number} className="relative text-center">
                  {index < STEPS.length - 1 ? (
                    <ArrowRight
                      size={24}
                      aria-hidden="true"
                      className="absolute -right-5 top-[52px] hidden text-blue-200 lg:block"
                    />
                  ) : null}

                  <p className="mb-3 font-mono text-2xl font-bold text-plug-blue-600">
                    {step.number}
                  </p>

                  <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand">
                    <Icon size={28} className="text-white" aria-hidden="true" />
                  </span>

                  <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                  <p className="mx-auto max-w-[260px] text-sm text-slate-500">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

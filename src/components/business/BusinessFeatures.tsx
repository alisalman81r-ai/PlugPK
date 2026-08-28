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

import { FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion, SectionHeader, type IconMotion } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Feature {
  motion: IconMotion
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    motion: 'scan',
    title: 'Map Visibility',
    description:
      'Appear on the Plug.pk charging map and be discovered by EV owners actively searching near you.',
  },
  {
    icon: ShieldCheck,
    motion: 'pop',
    title: 'Verified Badge',
    description:
      'Get a verified badge that builds trust with EV owners and shows your chargers are accurate and reliable.',
  },
  {
    icon: Zap,
    motion: 'pulse',
    title: 'Charger Management',
    description:
      'Easily manage your charger details, availability, and pricing from your simple business dashboard.',
  },
  {
    icon: Star,
    motion: 'pop',
    title: 'Reviews & Ratings',
    description:
      'Receive and respond to reviews from real EV owners who have visited your location.',
  },
  {
    icon: BarChart2,
    motion: 'slide',
    title: 'Analytics Dashboard',
    description:
      'Track profile views, navigation clicks, and customer engagement with easy-to-read analytics.',
  },
  {
    icon: Users,
    motion: 'pulse',
    title: 'Community Reach',
    description:
      'Your listing sits alongside the discussions, trip reports and owner clubs drivers already read here.',
  },
]

interface Step {
  number: string
  icon: LucideIcon
  motion: IconMotion
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    motion: 'lift',
    icon: Building2,
    title: 'Create Profile',
    description: 'Tell us about your business — name, type, location and contact details.',
  },
  {
    number: '02',
    motion: 'pulse',
    icon: Zap,
    title: 'Add Your Chargers',
    description: 'List each connector with its power, ports and pricing so drivers know what to expect.',
  },
  {
    number: '03',
    motion: 'scan',
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
                <HoverMotion key={feature.title} className={FRAME}>
                  <div className={cn(FACE, 'p-7')}>
                    {/* Outlined, like every other icon holder on the site. This
                        was one pastel fill per feature — six hues in a six-card
                        grid, and the last rainbow on the public site. */}
                    <span aria-hidden="true" className={cn('mb-5', ICON_FRAME)}>
                      <AnimatedIcon motion={feature.motion}>
                        <Icon size={24} aria-hidden="true" className={ICON_GLYPH} />
                      </AnimatedIcon>
                    </span>

                    <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
                  </div>
                </HoverMotion>
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
                <HoverMotion key={step.number} className="relative text-center">
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
                    <AnimatedIcon motion={step.motion}>
                      <Icon size={28} className="text-white" aria-hidden="true" />
                    </AnimatedIcon>
                  </span>

                  <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                  <p className="mx-auto max-w-[260px] text-sm text-slate-500">{step.description}</p>
                </HoverMotion>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

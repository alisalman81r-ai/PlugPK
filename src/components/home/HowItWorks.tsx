// src/components/home/HowItWorks.tsx
import { Navigation2, Search, SlidersHorizontal, Star, type LucideIcon } from 'lucide-react'

import { SectionHeader } from '@/components/ui'

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Search Your Location',
    description: 'Enter your city or allow location access to find nearby EV chargers instantly.',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Filter by Your EV',
    description: 'Select your connector type, speed, and amenities for the perfect match.',
  },
  {
    number: '03',
    icon: Navigation2,
    title: 'Navigate and Charge',
    description: 'Get directions with one tap and arrive at your charging destination.',
  },
  {
    number: '04',
    icon: Star,
    title: 'Review and Share',
    description: 'Help fellow EV owners by sharing your honest charging experience.',
  },
]

export function HowItWorks() {
  return (
    <section className="section-padding bg-slate-50">
      <div className="container-plug">
        <SectionHeader
          align="center"
          eyebrow="Simple by Design"
          eyebrowColor="cyan"
          title="Start finding chargers in seconds"
          subtitle="No complicated setup. Search, filter, navigate, and charge."
        />

        <div className="relative mt-20">
          {/* Connecting line runs through the icon centres: 28px number + 24px
              gap + half of the 72px icon box = 88px from the top of each card,
              plus the card's 32px padding. */}
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-[120px] z-0 hidden border-t border-dashed border-blue-200 lg:block"
          />

          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon

              return (
                <div
                  key={step.number}
                  // p-4 at 375px: two cards plus the gap leave ~131px of
                  // content each, which the 72px icon and copy still fit.
                  className="group relative z-10 flex flex-col items-center p-4 text-center sm:p-8"
                >
                  <span className="mb-6 flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 font-mono text-sm font-bold tracking-widest text-plug-blue-600">
                    {step.number}
                  </span>

                  <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-blue">
                    <Icon size={32} strokeWidth={1.5} className="text-plug-blue-600" aria-hidden="true" />
                  </span>

                  <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mx-auto max-w-[200px] text-sm leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

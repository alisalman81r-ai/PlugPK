// src/components/home/HowItWorks.tsx
import { Navigation2, Search, SlidersHorizontal, Star, type LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/ui'
import { ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'

/**
 * The four steps, redesigned.
 *
 * Three things were asked for and one was already available. The heading now
 * matches the ecosystem band — same size, weight and tracking, with a single
 * word in blue. The steps enter in sequence rather than all at once, using the
 * Reveal primitive the home page already wraps its sections in, so no second
 * observer was needed for it.
 *
 * Nothing is filled and nothing is tinted beyond that one word. The number
 * chips were a blue pill on a blue background and the icon holders were solid
 * white with a coloured glyph; both are outlines now, which is the treatment
 * Partner Up and the ecosystem band use.
 */

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
    <section className="bg-slate-50 py-24 lg:py-32">
      <div className="container-plug">
        {/* ── The heading, matching the ecosystem band ─────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Simple by design
          </span>

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Start finding chargers in{' '}
            <span className="text-plug-blue-600">seconds</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            No complicated setup. Search, filter, navigate, and charge.
          </p>
        </div>

        <div className="relative mt-20">
          {/*
            The rail through the icon centres. It arrives first and the steps
            follow, which is what makes the sequence read as a sequence.

            Its offset is measured, not guessed: 28px number row + 24px gap +
            half of the 64px icon frame, plus the column's 32px top padding.
          */}
          <Reveal className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden lg:block">
            <span
              aria-hidden="true"
              className="absolute left-[12.5%] right-[12.5%] top-[116px] border-t border-dashed border-slate-300"
            />
          </Reveal>

          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                // Staggered by 110ms. Enough to read as one-after-another,
                // short enough that the last step is not still arriving after
                // the eye has moved on.
                <Reveal key={step.number} delay={index * 110}>
                  <div className="group relative z-10 flex flex-col items-center p-4 text-center sm:p-8">
                    {/* Outlined, not a filled pill. */}
                    <span className="mb-6 font-mono text-ui-sm font-bold tracking-[0.2em] text-slate-400 transition-colors duration-300 group-hover:text-plug-blue-600">
                      {step.number}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`${ICON_FRAME} mb-6 h-16 w-16 bg-slate-50`}
                    >
                      <Icon size={28} strokeWidth={1.5} className={ICON_GLYPH} />
                    </span>

                    <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mx-auto max-w-[220px] text-ui-sm leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

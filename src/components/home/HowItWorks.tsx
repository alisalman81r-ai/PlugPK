// src/components/home/HowItWorks.tsx
'use client'

import { STAGGER } from '@/lib/motion'
import { Navigation2, Search, SlidersHorizontal, Star, type LucideIcon } from 'lucide-react'

import { AnimatedIcon, HoverMotion, Reveal, type IconMotion } from '@/components/ui'
import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH, NUMERAL } from '@/components/shared/frame'

/**
 * The four steps, as cards.
 *
 * They were borderless columns under a dashed rail — a number, an outlined
 * icon, a title and a paragraph floating on the band's own slate. That read as
 * a diagram rather than as four things, and with the descriptions running to
 * different lengths the columns drifted apart with nothing to say where one
 * step ended.
 *
 * Each is now a card in the frame the rest of the site uses: a 1.5px gradient
 * edge over an inset white face, so the border grades to brand on hover
 * without the card itself ever being painted. The primitives come from
 * components/shared/frame, the same ones Partner Up's steps and the value band
 * use, so all three are tuned in one place.
 *
 * Hover is one gesture. HoverMotion wraps the whole card and framer passes the
 * state down, so the glyph animates, the cap rule draws across, the stroked
 * numeral warms and the frame's edge and shadow lift together — one pointer
 * crossing one boundary should read as one thing happening, not four.
 *
 * The heading is unchanged: it matches the ecosystem band, one word in blue.
 *
 * This is a client component because HoverMotion and Reveal are. The steps are
 * static data, so there was nothing on the server to give up for it.
 */

interface Step {
  number: string
  icon: LucideIcon
  /** Matched to what the glyph depicts — see AnimatedIcon for the set. */
  motion: IconMotion
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    motion: 'scan',
    icon: Search,
    title: 'Search Your Location',
    description: 'Enter your city or allow location access to find nearby EV chargers instantly.',
  },
  {
    number: '02',
    motion: 'slide',
    icon: SlidersHorizontal,
    title: 'Filter by Your EV',
    description: 'Select your connector type, speed, and amenities for the perfect match.',
  },
  {
    number: '03',
    motion: 'travel',
    icon: Navigation2,
    title: 'Navigate and Charge',
    description: 'Get directions with one tap and arrive at your charging destination.',
  },
  {
    number: '04',
    motion: 'pop',
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

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.035em] text-slate-900">
            Start finding chargers in{' '}
            <span className="text-plug-blue-600">seconds</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            No complicated setup. Search, filter, navigate, and charge.
          </p>
        </div>

        {/*
          ── Four cards, not four columns ──────────────────────────────

          These were borderless columns under a dashed rail: a number, an
          outlined icon, a title, a paragraph, all floating on the band's own
          slate. It read as a diagram rather than as four things, and at this
          width the eye had nothing telling it where one step ended and the
          next began — the descriptions ran to different lengths and the
          columns drifted apart.

          They are cards now, in the frame the rest of the site already uses:
          a 1.5px gradient edge with an inset white face, so the border grades
          to brand on hover without the card ever being painted. Same
          primitives as Partner Up's steps and the value band, from
          components/shared/frame, so all three are tuned in one place.

          ── What the hover does, and why it is one gesture ────────────

          HoverMotion is the whole card. Framer passes the hover state down,
          so the glyph animates, the cap rule draws across, the stroked
          numeral warms and the frame's edge and shadow lift — together,
          because one pointer crossing one boundary should read as one thing
          happening.

          ── The rail is gone ─────────────────────────────────────────

          It ran through the icon centres and only made sense while the
          columns had no edges of their own. Drawn across cards it would cut
          through four borders to join them. The sequence is carried by the
          numerals and the stagger instead.
        */}
        <ol className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon

            return (
              // Staggered by 110ms: enough to read as one-after-another, short
              // enough that the fourth is not still arriving after the eye has
              // moved on.
              <li key={step.number} className="h-full">
                <Reveal className="h-full" delay={index * STAGGER.STEP}>
                  <HoverMotion className={FRAME}>
                    <div className={`${FACE} overflow-hidden p-7 lg:p-8`}>
                      {/* The step number, as a stroked outline in the corner.
                          It is the card's ordinal, not a label to read — so it
                          is large and hollow rather than small and solid. */}
                      <span aria-hidden="true" className={NUMERAL}>
                        {step.number}
                      </span>

                      <span aria-hidden="true" className={ICON_FRAME}>
                        <AnimatedIcon motion={step.motion}>
                          <Icon size={26} strokeWidth={1.5} className={ICON_GLYPH} />
                        </AnimatedIcon>
                      </span>

                      {/* Draws from 40px to 64px on hover — motion with a
                          purpose, marking the card being read. */}
                      <span aria-hidden="true" className={`mt-7 ${CAP_RULE}`} />

                      <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-ui-sm leading-relaxed text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </HoverMotion>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

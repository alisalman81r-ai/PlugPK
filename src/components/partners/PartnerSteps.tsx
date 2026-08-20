// src/components/partners/PartnerSteps.tsx
import { BadgeCheck, Banknote, BarChart3, Home, MapPinned, Users } from 'lucide-react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'

/**
 * How hosting works, and what a host is actually promised.
 *
 * Every claim here maps to something the application does. "Live once we
 * verify" is the admin approval step; "you keep every rupee" is true because
 * there is no payment processing and no commission anywhere in the code; the
 * dashboard figures named are the ones BusinessDailyStat actually counts. If a
 * claim on this page ever stops being true, the code that made it true is the
 * thing to look at.
 *
 * Both sections share the card treatment in ./frame — see that file for why
 * the prominence lives on the edge rather than in a fill.
 */

const STEPS = [
  {
    icon: Home,
    title: 'List what you have',
    body: 'A hotel forecourt, an office car park, or the single charger on your driveway. Same form, same few minutes.',
  },
  {
    icon: BadgeCheck,
    title: 'We check the details',
    body: 'We confirm the address, the pin and the charger specs before publishing, so drivers who set off actually arrive.',
  },
  {
    icon: MapPinned,
    title: 'Drivers find you',
    body: 'Your listing appears on the map and in search, filterable by connector and speed, with directions one tap away.',
  },
]

const BENEFITS = [
  {
    icon: Banknote,
    title: 'You set the price, you keep it',
    body: 'Plug.pk does not set your rates, process the payment or take a percentage. Whatever you charge is between you and the driver.',
  },
  {
    icon: BarChart3,
    title: 'See what your listing does',
    body: 'Views, directions taken, reviews and rating — counted from real visits to your page, not estimated.',
  },
  {
    icon: Users,
    title: 'Reach drivers already looking',
    body: 'People open the map because they need a charge now. That is a narrower and warmer audience than an advert.',
  },
]

export function PartnerSteps() {
  return (
    <>
      <section className="bg-white py-20 lg:py-28">
        <div className="container-plug">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Three steps, then you are on the map
            </h2>
          </div>

          {/*
            Prominence without fill.

            The brief was to make these read as important while leaving the
            cards unfilled, so every device here works on the edge or the
            space rather than the surface: a gradient hairline border that
            warms to brand colour on hover, a lift with a real shadow, an
            outlined numeral that is stroke only, a ruled cap above the
            heading that draws across on hover, and a dashed rail joining the
            three so they read as a sequence instead of three separate facts.
            The card face itself stays transparent.
          */}
          <ol className="relative grid gap-6 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                {/* The rail between cards. Sits at the icon's centre line and
                    only exists between them, never trailing off the last. */}
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-full top-[64px] z-10 hidden h-px w-8 border-t-2 border-dashed border-slate-300 lg:block"
                  />
                ) : null}

                {/* The border is a 1px gradient frame: a wrapper carrying the
                    gradient with an inset face on top, which is how you get a
                    graded edge without painting the card. */}
                <div className={FRAME}>
                  <div className={`${FACE} overflow-hidden p-8`}>
                    {/* Stroke-only numeral, large enough to anchor the corner
                        without competing with the heading. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-3 right-4 select-none font-mono text-[5.5rem] font-black leading-none text-transparent transition-all duration-300 [-webkit-text-stroke:2px_#CBD5E1] group-hover:[-webkit-text-stroke:2px_#60A5FA]"
                    >
                      {index + 1}
                    </span>

                    <span aria-hidden="true" className={ICON_FRAME}>
                      <step.icon size={24} className={ICON_GLYPH} />
                    </span>

                    {/* A cap rule that draws across on hover — motion with a
                        purpose, marking the card you are reading. */}
                    <span aria-hidden="true" className={`mt-8 ${CAP_RULE}`} />

                    <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-ui leading-relaxed text-slate-500">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="container-plug">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-ui-sm font-bold uppercase tracking-widest text-plug-blue-600">
              What you get
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Your charger, earning its keep
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className={FRAME}>
                <div className={`${FACE} p-8`}>
                  <span aria-hidden="true" className={ICON_FRAME}>
                    <benefit.icon size={24} className={ICON_GLYPH} />
                  </span>

                  <span aria-hidden="true" className={`mt-8 ${CAP_RULE}`} />

                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-ui leading-relaxed text-slate-500">{benefit.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// src/app/(main)/range-converter/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { ListingsGuide } from '@/components/range/ListingsGuide'
import { RangeConverter } from '@/components/range/RangeConverter'
import { RangeFactors } from '@/components/range/RangeFactors'
import { StandardsGuide } from '@/components/range/StandardsGuide'
import type { RangeCar, StandardCounts } from '@/components/range/types'
import { FaqSection } from '@/components/shared/FaqSection'
import { ArrowRight } from '@/components/ui/icons'
import { readOrFallback } from '@/lib/db/availability'
import { listCars } from '@/lib/db/car-queries'
import { RANGE_FAQS } from '@/lib/faqs'
import { parseStandard, SOURCES } from '@/lib/range-standards'

export const metadata: Metadata = {
  title: 'EV Range Converter: WLTP vs EPA, NEDC and CLTC',
  description:
    'Compare EV range figures across WLTP, EPA, NEDC and CLTC, and see what a quoted range might mean on Pakistani roads — in summer heat, with the AC on, and on the motorway.',
}

/** The catalogue changes a few times a month at most. */
export const revalidate = 3600

/** Same measure as the charging calculator and /community. */
const STAGE = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10'

export default async function RangeConverterPage() {
  // Same guard as the calculator: without the database the converter still
  // works, with an empty car list and the figure typed by hand.
  const all = await readOrFallback('/range-converter cars', [], listCars)

  // Battery-electric only. A plug-in hybrid's electric range is a small part
  // of what it can drive, and its stated standard often describes the
  // combined figure rather than that one.
  const evs = all.filter((c) => c.category === 'EV' && c.range && c.range > 0)

  const cars: RangeCar[] = evs
    .map((c) => ({
      slug: c.slug,
      name: c.fullName,
      brand: c.brand,
      rangeKm: c.range as number,
      rangeMaxKm: c.rangeMax && c.rangeMax > (c.range as number) ? c.rangeMax : null,
      standard: parseStandard(c.rangeStandard),
      ownerLowKm: c.realWorldRange ?? null,
      ownerHighKm: c.realWorldRangeMax ?? null,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))

  const counts: StandardCounts = { WLTP: 0, EPA: 0, NEDC: 0, CLTC: 0, unstated: 0 }
  for (const c of cars) counts[c.standard ?? 'unstated'] += 1

  return (
    <div className="min-h-below-nav bg-slate-50">
      <RangeConverter
        cars={cars}
        intro={
          <>
            <h1 className="text-balance font-display text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-white">
              <span className="block">Compare EV range</span>
              <span className="block bg-gradient-to-r from-plug-cyan-300 to-plug-blue-400 bg-clip-text text-transparent">
                across every test
              </span>
            </h1>

            <div className="mt-6 max-w-xl space-y-4 text-pretty text-ui leading-relaxed text-white/70 sm:text-base">
              <p>
                One car can be sold with four different range figures. WLTP, EPA, NEDC and CLTC are four different
                test drives, so the number on the brochure depends on which one was used, not on the car.
              </p>
              <p>
                That matters in Pakistan: many EVs here are Chinese imports quoted on CLTC, the most generous of the
                four, so the brochure figure sits well above what the car will do on the road.
              </p>
              <p>
                Pick the standard and type the figure to see it on all four, with a plain note on how far to trust
                each. Further down, see what it might come to here: in summer heat, with the AC on, and on the
                motorway.
              </p>
            </div>
          </>
        }
      />

      <div className={`${STAGE} mt-16 space-y-20 pb-20 lg:mt-20 lg:space-y-28 lg:pb-28`}>
        <RangeFactors />
        <StandardsGuide />
        <ListingsGuide counts={counts} />
      </div>

      <FaqSection items={RANGE_FAQS} title="EV range questions" tone="white" />

      <section aria-labelledby="sources-heading" className="border-t border-slate-100 bg-white">
        <div className={`${STAGE} py-12 lg:py-16`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
            <div>
              <h2 id="sources-heading" className="text-ui font-semibold text-slate-900">
                How we worked this out
              </h2>
              <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">
                Each standard&rsquo;s typical ratio to WLTP, and each real-world band, comes from cars that have been
                published or measured on more than one test. That is a handful of cars, not a statistical model —
                which is why every figure here is a band, and why a car&rsquo;s own published figure always beats
                this estimate.
              </p>
              <Link
                href="/charging-calculator"
                className="mt-4 inline-flex items-center gap-1.5 text-ui-sm font-semibold text-plug-blue-600 hover:text-plug-cyan-700"
              >
                How long will a charge take? Try the charging calculator
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <ul className="space-y-2.5 text-ui-sm">
              {SOURCES.map((s) => (
                <li key={s.href} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-plug-cyan-500" />
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-plug-blue-600 hover:decoration-plug-cyan-500"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

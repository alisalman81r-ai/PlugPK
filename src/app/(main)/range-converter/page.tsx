// src/app/(main)/range-converter/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { ListingsGuide } from '@/components/range/ListingsGuide'
import { RangeConverter } from '@/components/range/RangeConverter'
import { RangeFactors } from '@/components/range/RangeFactors'
import type { RangeCar, StandardCounts } from '@/components/range/types'
import { FaqSection } from '@/components/shared/FaqSection'
import { ArrowRight, ArrowUpRight } from '@/components/ui/icons'
import { Hl, PageHero, Section, Wrap } from '@/components/v2/ui'
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
    <>
      <PageHero
        title={
          <>
            Compare EV range <Hl dark>across every test</Hl>
          </>
        }
        sub="EVs in Pakistan are sold with range figures from four different tests — WLTP, EPA, NEDC and CLTC. Compare a figure across all four, then see what it might come to on the road here."
        className="lg:pb-[196px]"
      />

      {/* The converter lifted into the hero, then the standards, the road
          estimates and the two-listing compare — all driven by its state. */}
      <RangeConverter cars={cars} />

      <Section tone="paper" id="listings">
        <Wrap>
          <ListingsGuide counts={counts} />
        </Wrap>
      </Section>

      <Section tone="chalk" id="factors">
        <Wrap>
          <RangeFactors />
        </Wrap>
      </Section>

      <FaqSection items={RANGE_FAQS} title="EV range questions" tone="white" />

      <Section tone="chalk" tight id="method">
        <Wrap>
          <div className="grid gap-[clamp(28px,4vw,56px)] rounded-[28px] border border-ink/10 bg-white p-[clamp(22px,3.5vw,44px)] sm:rounded-[40px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h2 id="sources-heading" className="font-display text-[clamp(26px,2.6vw,34px)] leading-[1.1] text-ink">
                How we worked this out
              </h2>
              <p className="mt-4 text-[15px] leading-[1.65] text-muted">
                Each standard&rsquo;s typical ratio to WLTP, and each real-world band, comes from cars that have been
                published or measured on more than one test. That is a handful of cars, not a statistical model — which
                is why every figure here is a band, and why a car&rsquo;s own published figure always beats this
                estimate.
              </p>
              <Link
                href="/charging-calculator"
                className="group/cta mt-[22px] inline-flex min-h-11 items-center gap-3 rounded-full bg-ink py-2.5 pl-5 pr-3 text-[14.5px] text-white transition-colors duration-300 hover:bg-volt hover:text-ink"
              >
                <span>
                  How long will a charge take? <b className="font-semibold">Try the charging calculator</b>
                </span>
                <ArrowRight
                  size={18}
                  className="shrink-0 transition-transform duration-300 ease-spring group-hover/cta:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <ol aria-labelledby="sources-heading" className="m-0 list-none self-center p-0">
              {SOURCES.map((s, i) => (
                <li key={s.href} className="border-t border-ink/10 last:border-b">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/src grid min-h-[52px] grid-cols-[28px_1fr_16px] items-center gap-2.5 px-1 py-2.5 text-sm leading-[1.45] text-ink transition-[padding,color] duration-300 ease-out hover:pl-2.5 sm:grid-cols-[34px_1fr_18px]"
                  >
                    <span className="font-mono text-[11.5px] font-semibold text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.label}</span>
                    <ArrowUpRight
                      size={16}
                      className="text-muted transition-[transform,color] duration-300 ease-spring group-hover/src:-translate-y-0.5 group-hover/src:translate-x-0.5 group-hover/src:text-volt-ink"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </Wrap>
      </Section>
    </>
  )
}

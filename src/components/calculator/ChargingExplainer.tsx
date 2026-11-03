// src/components/calculator/ChargingExplainer.tsx
import { Btn, BtnArrow, CARD, CARD_HOVER, H2_CLASS, Hl, LEAD_CLASS, Section, Wrap } from '@/components/v2/ui'
import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { cn } from '@/lib/utils'

import { BatteryCharging, MapPin, Plug, Receipt, Zap } from '@/components/ui/icons'
import type { IconType } from '@/components/ui/icons'

/**
 * What the calculator is doing, in four short blocks.
 *
 * Written for someone standing next to their car, not for an engineer: each
 * block answers one question a driver actually asks, in the order they tend to
 * ask it, and none runs past a few sentences. The arithmetic is in
 * lib/charging-time for anyone who wants it; this is the version that fits on
 * a phone screen.
 *
 * The one thing here that a generic calculator would not say is the voltage
 * point. Supply in many Pakistani neighbourhoods sags well below 230V at peak
 * hours, and an AC charger draws less power when it does — so an evening
 * charge on the same socket can genuinely run slower than a morning one.
 */

interface Block {
  icon: IconType
  title: string
  body: React.ReactNode
}

const BLOCKS: Block[] = [
  {
    icon: BatteryCharging,
    title: 'How we work it out',
    body: (
      <>
        We take the part of the battery you&rsquo;re filling — 60 kWh from 20% to 80% is 36 kWh — and add
        about 10% for losses on AC, since not every unit from the wall makes it into the pack. Then we divide
        by the power your car can actually accept. A 7.4 kW box on a car that takes 6.6 kW still charges at
        6.6.
      </>
    ),
  },
  {
    icon: Plug,
    title: 'AC or DC?',
    body: (
      <>
        <strong>AC</strong> is home, office, hotel and mall
        charging. Your car converts the power itself, so the speed stays steady and the estimate is close.{' '}
        <strong>DC</strong> is the public fast charger. It&rsquo;s
        much quicker, but the car slows it down as the battery fills — which is why we show DC as an estimate.
      </>
    ),
  },
  {
    icon: Zap,
    title: 'Why your time may differ',
    body: (
      <>
        A cold or very hot battery charges slower. Every car has its own charging curve. And in many areas
        the voltage drops at peak hours — when it does, an AC charger simply draws less, so the same charge
        can take longer in the evening than in the morning.
      </>
    ),
  },
  {
    icon: Receipt,
    title: 'What it costs',
    body: (
      <>
        Multiply the energy drawn from the supply by your rate. 40 kWh at Rs 50 a unit is about Rs 2,000.
        Public DC chargers usually charge more per unit than your home connection, so check the rate on the
        charger before you plug in.
      </>
    ),
  },
]

export function ChargingExplainer() {
  return (
    <Section tone="chalk" className="pt-[clamp(72px,8vw,112px)]">
      <Wrap>
        <header className="mb-11 grid justify-items-start">
          <h2 id="explainer-heading" className={cn(H2_CLASS, 'text-ink')}>
            The short <Hl>version</Hl>
          </h2>
          <p className={cn(LEAD_CLASS, 'mt-3.5 text-muted')}>What the numbers above mean, and when to trust them.</p>
        </header>

        <RevealGroup className="grid gap-4 md:grid-cols-2" aria-labelledby="explainer-heading">
          {BLOCKS.map(({ icon: Icon, title, body }) => (
            <RevealItem key={title} className="h-full">
              <article className={cn(CARD, CARD_HOVER, 'group/ex h-full p-6 sm:p-[30px]')}>
                <span className="grid size-12 place-items-center rounded-[14px] bg-chalk text-ink transition-colors duration-300 group-hover/ex:bg-ink group-hover/ex:text-volt">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="mb-2.5 mt-[22px] font-display text-[26px] leading-[1.1] text-ink pg-medium">{title}</h3>
                <p className="text-[15.5px] leading-[1.65] text-muted [&_strong]:font-semibold [&_strong]:text-ink">{body}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* The calculator's natural next step, since the answer is "go and
            charge": the map of where. */}
        <Btn href="/map" variant="ink" size="lg" className="mt-9 w-full sm:w-auto">
          <MapPin aria-hidden="true" />
          <span>Find a charger near you</span>
          <BtnArrow />
        </Btn>
      </Wrap>
    </Section>
  )
}

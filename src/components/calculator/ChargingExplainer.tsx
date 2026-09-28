// src/components/calculator/ChargingExplainer.tsx
import Link from 'next/link'

import { ArrowRight, Gauge, Plug, Receipt, Zap } from '@/components/ui/icons'
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
    icon: Gauge,
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
        <strong className="font-semibold text-slate-800">AC</strong> is home, office, hotel and mall
        charging. Your car converts the power itself, so the speed stays steady and the estimate is close.{' '}
        <strong className="font-semibold text-slate-800">DC</strong> is the public fast charger. It&rsquo;s
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
    <section aria-labelledby="explainer-heading" className="mt-16 lg:mt-24">
      <div className="max-w-2xl">
        <h2
          id="explainer-heading"
          className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          The short version
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-500">
          What the numbers above mean, and when to trust them.
        </p>
      </div>

      <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {BLOCKS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <Icon size={26} className="mt-0.5 shrink-0 text-plug-cyan-600" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-ui-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-ui leading-relaxed text-slate-600">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The calculator's natural next step, since the answer is "go and
          charge": the map of where. */}
      <Link
        href="/map"
        className="mt-12 inline-flex items-center gap-2 text-ui font-semibold text-plug-blue-600 hover:text-plug-cyan-700"
      >
        Find a charger near you
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  )
}

// src/components/range/RoadEstimates.tsx
import Link from 'next/link'

import { ArrowUpRight, Flame, Gauge, Route, Users } from '@/components/ui/icons'
import type { IconType } from '@/components/ui/icons'
import type { RangeStandard, RoadEstimate, ScenarioId } from '@/lib/range-standards'

import type { RangeCar } from './types'

/**
 * What the quoted figure might come to on Pakistani roads.
 *
 * Three situations, each a band rather than a number, each with the
 * measurement it rests on printed underneath — the point of this block is
 * that a test-cycle figure is a starting line, so it would undo itself by
 * giving one confident answer. Where the catalogue has what owners report for
 * the chosen car, that sits beside the estimates, labelled for what it is.
 */

const ICONS: Record<ScenarioId, IconType> = {
  mixed: Route,
  summer: Flame,
  motorway: Gauge,
}

export interface RoadEstimatesProps {
  estimates: RoadEstimate[]
  km: number
  standard: RangeStandard
  car: RangeCar | null
}

export function RoadEstimates({ estimates, km, standard, car }: RoadEstimatesProps) {
  const owner = car && car.ownerLowKm ? car : null

  return (
    <section aria-labelledby="road-heading">
      <div className="max-w-2xl">
        <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-700">Real-world estimate</p>
        <h2
          id="road-heading"
          className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          {km.toLocaleString('en-PK')} km {standard} on Pakistani roads
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-600">
          A test figure is a starting line, not a promise. Here is roughly where it tends to land, in three
          situations that published tests have actually measured. Treat each as a likely band for a healthy
          battery, not a figure for your car.
        </p>
      </div>

      <ul className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
        {estimates.map((e) => {
          const Icon = ICONS[e.scenario.id]
          return (
            <li key={e.scenario.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Icon size={20} className="shrink-0 text-plug-cyan-700" aria-hidden="true" />
                <h3 className="text-ui font-semibold text-slate-900">{e.scenario.title}</h3>
              </div>
              <p className="mt-1 text-ui-sm text-slate-500">{e.scenario.conditions}</p>

              <p className="mt-5 text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-none tracking-tight tabular-nums text-slate-900">
                {e.low}–{e.high}
                <span className="ml-1.5 text-lg font-semibold text-slate-400">km</span>
              </p>
              <p className="mt-1.5 text-ui-sm text-slate-500">
                Most likely around <span className="font-semibold text-slate-700">{e.typical} km</span>
              </p>

              {/* How much of the quoted figure is left, as a share of the
                  same bar every card draws, so the three compare at a glance. */}
              <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-plug-blue-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                  style={{ width: `${Math.min(100, (e.typical / km) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-ui-sm tabular-nums text-slate-400">
                ~{Math.round((e.typical / km) * 100)}% of the quoted {standard} figure
              </p>

              <div aria-hidden="true" className="min-h-5 flex-1" />
              <p className="border-t border-slate-100 pt-3 text-ui-sm leading-relaxed text-slate-500">
                Based on: {e.scenario.basis}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
        <p className="rounded-2xl bg-slate-100/80 px-5 py-4 text-ui-sm leading-relaxed text-slate-600">
          <strong className="font-semibold text-slate-800">Motorway in June, car full?</strong> Expect less than the
          motorway band. Heat, AC and weight each take their share on top of speed — nobody has published a clean
          measurement of all three together, so we won&rsquo;t put a number on it.
        </p>

        {owner ? (
          <div className="flex gap-3 rounded-2xl border border-plug-cyan-500/40 bg-plug-cyan-500/[0.06] px-5 py-4">
            <Users size={20} className="mt-0.5 shrink-0 text-plug-cyan-700" aria-hidden="true" />
            <p className="text-ui-sm leading-relaxed text-slate-600">
              <strong className="font-semibold text-slate-800">
                Owners of the {owner.name} report {owner.ownerLowKm}
                {owner.ownerHighKm ? `–${owner.ownerHighKm}` : ''} km.
              </strong>{' '}
              That is from our catalogue, not a test: how and where each owner drives varies, so it can sit above
              or below the estimates here.{' '}
              <Link
                href={`/cars/${owner.slug}`}
                className="inline-flex items-center gap-0.5 font-medium text-plug-cyan-700 hover:text-plug-cyan-800"
              >
                Car details
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-100/80 px-5 py-4 text-ui-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-800">City traffic is kinder to an EV</strong> than to a petrol
            car. Crawling and stopping cost little, and braking puts some energy back — it&rsquo;s sustained speed
            and heat that shrink the range.
          </p>
        )}
      </div>
    </section>
  )
}

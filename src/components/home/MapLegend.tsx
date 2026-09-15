// src/components/home/MapLegend.tsx

import { FAST_CHARGER_KW } from '@/lib/charging'

/**
 * What the dots on the map mean.
 *
 * The map gained two colours of marker, and two colours with no key is a
 * puzzle rather than information — the reader can see that some dots are blue
 * and some green, and has no way to learn why. This is the smallest thing that
 * turns the difference into a fact.
 *
 * It states the threshold rather than implying it. "Fast charger" alone invites
 * everyone to guess where fast begins; "60kW+" is the line the data is actually
 * sorted on, and it is the same constant the markers are coloured by.
 *
 * Only the rows that can appear are listed. There is no "coming soon" state in
 * the schema, so there is no swatch for one — a legend describing a state the
 * product cannot produce is a promise, not a key.
 *
 * The line row says "major highway", not "planned route". It stopped being a
 * route when the journey animation went: the path on the map is the N-5
 * corridor standing still, and nothing plans anything along it.
 */
export function MapLegend() {
  return (
    <div
      className="pointer-events-none absolute right-[4%] top-[6%] hidden rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.24)] backdrop-blur-sm lg:block"
      role="note"
      aria-label="What the markers on the map mean"
    >
      <ul className="flex flex-col gap-2">
        <LegendRow swatch={<Dot className="bg-plug-blue-600" />}>
          Fast charger ({FAST_CHARGER_KW}kW+)
        </LegendRow>
        <LegendRow swatch={<Dot className="bg-green-600" />}>Standard charger</LegendRow>
        <LegendRow
          swatch={
            <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full bg-plug-blue-500" />
          }
        >
          Major highway
        </LegendRow>
      </ul>
    </div>
  )
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden="true" className={`h-2 w-2 rounded-full ${className}`} />
}

function LegendRow({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[12.5px] leading-none text-slate-600">
      <span className="flex w-3.5 shrink-0 items-center justify-center">{swatch}</span>
      {children}
    </li>
  )
}

// src/components/range/StandardsGuide.tsx
import { STANDARD_ORDER, STANDARDS, type RangeStandard } from '@/lib/range-standards'

/**
 * The four standards, one short card each, plus the one line that ties them
 * together: for the same car, they usually run in the same order.
 *
 * The cycle figures are the published definitions of each drive. EPA gets no
 * speed figures because it is not one drive but several combined and then
 * adjusted, so a single average speed would describe nothing.
 */

interface Detail {
  used: string
  drive: string
  facts: { label: string; value: string }[]
  note: string
}

const DETAILS: Record<RangeStandard, Detail> = {
  WLTP: {
    used: 'The EU since 2017–18, the UK, and many other markets',
    drive:
      'A 30-minute drive in four phases, from slow city to 131 km/h, run on rollers in a lab at 23°C. Stricter and faster than the NEDC it replaced.',
    facts: [
      { label: 'Average speed', value: '46.5 km/h' },
      { label: 'Top speed', value: '131 km/h' },
    ],
    note: 'The most common reference point, and the one we convert through.',
  },
  EPA: {
    used: 'The United States',
    drive:
      'City and highway cycles, with the result corrected down to reflect faster driving, climate control and cold weather — or measured across five cycles that include them.',
    facts: [
      { label: 'Cycles', value: 'Several, combined' },
      { label: 'Correction', value: 'Built in' },
    ],
    note: 'Usually the most conservative of the four.',
  },
  NEDC: {
    used: 'Europe until 2017–18; still on some Chinese brochures',
    drive:
      'A short, gentle lab drive with long stretches of steady speed and slow acceleration. Designed decades ago, and far kinder than real traffic.',
    facts: [
      { label: 'Average speed', value: 'about 34 km/h' },
      { label: 'Top speed', value: '120 km/h' },
    ],
    note: 'Older and generous — typically about a fifth above WLTP.',
  },
  CLTC: {
    used: 'China since 2021, and many cars imported from there',
    drive:
      'A 30-minute drive modelled on Chinese city traffic: low speeds, frequent stops, and over a fifth of the time spent idling.',
    facts: [
      { label: 'Average speed', value: '29 km/h' },
      { label: 'Top speed', value: '114 km/h' },
    ],
    note: 'The most generous of the four for most cars.',
  },
}

export function StandardsGuide() {
  return (
    <section aria-labelledby="standards-heading">
      <div className="max-w-2xl">
        <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-700">The four standards</p>
        <h2
          id="standards-heading"
          className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          WLTP vs EPA vs NEDC vs CLTC, in plain words
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-600">
          Each is a test drive with its own speeds, stops and conditions. None of them is your drive — but they
          differ from each other enough that one EV can be sold with four different range figures, all official.
        </p>
      </div>

      {/* The order they usually fall in, for one car rated 100 on WLTP. */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-ui-sm font-semibold text-slate-900">One car, rated 100 km on WLTP, typically reads:</p>
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['EPA', 'WLTP', 'NEDC', 'CLTC'] as const).map((s) => (
            <li key={s} className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="block text-ui-sm font-bold tracking-wide text-slate-500">{s}</span>
              <span className="mt-0.5 block text-2xl font-bold tabular-nums text-slate-900">
                {s === 'WLTP' ? '' : '~'}
                {Math.round(100 * STANDARDS[s].vsWltp.typical)}
                <span className="ml-1 text-ui font-semibold text-slate-400">km</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-ui-sm leading-relaxed text-slate-500">
          Typical, not fixed: individual cars can land well either side of these.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {STANDARD_ORDER.map((s) => {
          const d = DETAILS[s]
          return (
            <article key={s} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-bold tracking-wide text-slate-900">{s}</h3>
                <span className="text-right text-ui-sm text-slate-400">{STANDARDS[s].name}</span>
              </div>
              <p className="mt-1 text-ui-sm font-medium text-plug-cyan-700">{d.used}</p>
              <p className="mt-3 text-ui leading-relaxed text-slate-600">{d.drive}</p>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-100">
                {d.facts.map((f) => (
                  <div key={f.label} className="bg-white px-3.5 py-2.5 first:rounded-l-xl last:rounded-r-xl">
                    <dt className="text-ui-sm text-slate-500">{f.label}</dt>
                    <dd className="text-ui font-semibold tabular-nums text-slate-900">{f.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-ui-sm text-slate-500">{d.note}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

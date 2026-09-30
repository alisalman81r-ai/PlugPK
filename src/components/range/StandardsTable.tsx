// src/components/range/StandardsTable.tsx
import { STANDARDS } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import { REALISM, REALISM_ORDER } from './realism'

/**
 * The four standards side by side, one row each: where it is used, how it
 * typically reads against WLTP, and how far to trust it. A glance-sized
 * version of the fuller guide further down the page.
 *
 * "vs WLTP" is the typical ratio from lib/range-standards, the same one the
 * converter uses, so the table and the card cannot disagree.
 */

function vsWltp(ratio: number): string {
  return ratio === 1 ? 'Baseline' : `~${Math.round(ratio * 100)}% of WLTP`
}

export function StandardsTable() {
  return (
    <section aria-labelledby="standards-table-heading">
      <div className="max-w-2xl">
        <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-cyan-700">At a glance</p>
        <h2
          id="standards-table-heading"
          className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-tight text-slate-900"
        >
          The four standards
        </h2>
        <p className="mt-3 text-ui leading-relaxed text-slate-600">
          Listings in Pakistan mix all four freely, so two cars on the same page may not be comparable until
          they are on the same test.
        </p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[36rem] text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {['Standard', 'Used in', 'vs WLTP', 'How realistic'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3.5 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-500 sm:px-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {REALISM_ORDER.map((s) => {
              const r = REALISM[s]
              return (
                <tr key={s}>
                  <th scope="row" className="px-5 py-4 sm:px-6">
                    <span className="block text-ui font-bold text-slate-900">{s}</span>
                    <span className="block text-ui-sm font-normal text-slate-500">{STANDARDS[s].name}</span>
                  </th>
                  <td className="px-5 py-4 text-ui text-slate-700 sm:px-6">{r.usedIn}</td>
                  <td className="px-5 py-4 text-ui tabular-nums text-slate-700 sm:px-6">
                    {vsWltp(STANDARDS[s].vsWltp.typical)}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span
                      className={cn(
                        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider ring-1 ring-inset',
                        r.tone,
                      )}
                    >
                      {r.badge}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-3xl text-ui-sm leading-relaxed text-slate-500">
        EPA is the strictest: its cycles include higher speeds, harder acceleration and cold starts, and the result
        is adjusted down on top. CLTC is the most generous: it is mostly slow city running, where an EV is at its
        most efficient. Ratios are typical, not fixed, and individual cars land either side of them.
      </p>
    </section>
  )
}

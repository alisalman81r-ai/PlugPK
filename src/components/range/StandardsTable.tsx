// src/components/range/StandardsTable.tsx
import { CARD, H2_CLASS, Eyebrow, Hl, LEAD_CLASS } from '@/components/v2/ui'
import { STANDARDS } from '@/lib/range-standards'
import { cn } from '@/lib/utils'

import { REALISM, REALISM_ORDER, TONE_PILL } from './realism'

/**
 * The four standards side by side, one row each: where it is used, how it
 * typically reads against WLTP, and how far to trust it. A glance-sized
 * version of the fuller guide further down the page.
 *
 * "vs WLTP" is the typical ratio from lib/range-standards, the same one the
 * converter uses, so the table and the card cannot disagree. Its bar is drawn
 * against 125% of WLTP, with a tick where WLTP itself sits.
 *
 * On a phone the table folds into one card per standard, each cell labelled.
 */

function vsWltp(ratio: number): string {
  return ratio === 1 ? 'Baseline' : `~${Math.round(ratio * 100)}% of WLTP`
}

const CELL_LABEL =
  'max-md:grid max-md:grid-cols-[92px_1fr] max-md:gap-3 max-md:before:font-mono max-md:before:text-[10.5px] max-md:before:font-semibold max-md:before:uppercase max-md:before:leading-[1.9] max-md:before:tracking-[0.12em] max-md:before:text-muted max-md:before:content-[attr(data-label)]'

export function StandardsTable() {
  return (
    <section aria-labelledby="standards-table-heading">
      <header className="mb-[clamp(32px,4vw,48px)] grid justify-items-start">
        <Eyebrow>At a glance</Eyebrow>
        <h2 id="standards-table-heading" className={cn(H2_CLASS, 'text-ink')}>
          The four <Hl>standards</Hl>
        </h2>
        <p className={cn(LEAD_CLASS, 'max-w-[46rem] text-muted')}>
          Listings in Pakistan mix all four freely, so two cars on the same page may not be comparable until they are
          on the same test.
        </p>
      </header>

      <div className={cn(CARD, 'overflow-hidden')}>
        <table className="w-full border-collapse text-left max-md:block">
          <thead className="max-md:hidden">
            <tr>
              {['Standard', 'Used in', 'Vs WLTP', 'How realistic'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-b border-ink/10 bg-[#F7F6F1] px-6 py-4 font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-md:block">
            {REALISM_ORDER.map((s, i) => {
              const r = REALISM[s]
              const ratio = STANDARDS[s].vsWltp.typical
              return (
                <tr
                  key={s}
                  className={cn(
                    'transition-colors duration-200 hover:bg-[#FCFBF8] max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-x-3.5 max-md:gap-y-2.5 max-md:px-[18px] max-md:pb-4 max-md:pt-[18px]',
                    i > 0 && 'border-t border-ink/10',
                  )}
                >
                  <th scope="row" className="px-6 py-5 align-middle font-normal max-md:p-0">
                    <b className="block font-mono text-[17px] font-semibold leading-[1.1] tracking-[0.04em] text-ink">{s}</b>
                    <span className="mt-[5px] block text-[13px] text-muted">{STANDARDS[s].name}</span>
                  </th>
                  <td data-label="Used in" className={cn('px-6 py-5 text-[15px] text-ink max-md:col-span-full max-md:p-0 max-md:text-sm', CELL_LABEL)}>
                    {r.usedIn}
                  </td>
                  <td data-label="Vs WLTP" className={cn('px-6 py-5 max-md:col-span-full max-md:p-0', CELL_LABEL)}>
                    <span className="grid max-w-[210px] gap-2">
                      <span className="font-mono text-sm font-medium tabular-nums text-ink">{vsWltp(ratio)}</span>
                      <i
                        aria-hidden="true"
                        className="relative block h-1.5 rounded-[3px] bg-ink"
                        style={{ width: `${(ratio / 1.25) * 100}%` }}
                      >
                        <span
                          className="absolute -bottom-1 -top-1 -ml-px w-0.5 rounded-[1px] bg-volt-ink"
                          style={{ left: `${(1 / ratio) * 100}%` }}
                        />
                      </i>
                    </span>
                  </td>
                  <td className="px-6 py-5 max-md:col-start-2 max-md:row-start-1 max-md:self-start max-md:p-0">
                    <span className={cn(TONE_PILL, r.tone)}>{r.badge}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-[22px] max-w-[58rem] text-[15px] leading-[1.65] text-muted">
        EPA is the strictest: its cycles include higher speeds, harder acceleration and cold starts, and the result is
        adjusted down on top. CLTC is the most generous: it is mostly slow city running, where an EV is at its most
        efficient. Ratios are typical, not fixed, and individual cars land either side of them.
      </p>
    </section>
  )
}

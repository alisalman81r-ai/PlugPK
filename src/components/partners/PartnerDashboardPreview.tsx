// src/components/partners/PartnerDashboardPreview.tsx
import { LayoutDashboard, MapPin, TrendingUp, Zap } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * What a host actually sees once they are listed.
 *
 * This is the lifted card on Partner Up — the same role /map gives its filter
 * rail and /routes its popular routes: the concrete thing the page is about,
 * pulled up out of the dark band so it reads as the object rather than the next
 * section down.
 *
 * It used to be squeezed into the right half of the hero's two-column grid,
 * which at 1280px made a dashboard preview about 560px wide — a thumbnail of
 * itself, with four metric tiles stacked two-by-two and a chart the width of a
 * phone. On the full measure the four metrics fit one row, which is how a
 * dashboard is actually laid out, and the chart gets room to be a chart.
 *
 * ── Every part of this is labelled as an example ──────────────────────
 *
 * The metric tiles carry no numbers and the chart has no axis, deliberately.
 * The alternative — inventing "1,284 views" and drawing a plausible curve — is
 * the single most tempting lie on this page and the hardest to walk back once a
 * real host compares it to their own dashboard. What is shown is the *shape* of
 * the page: which four things get counted, and that there is a trend line. The
 * four names are the ones BusinessDailyStat actually records, so this preview
 * cannot promise a metric the product does not collect.
 */

/** The four figures the dashboard really counts. See BusinessDailyStat. */
const METRICS = [
  { label: 'Listing views', hint: 'per day, per visitor' },
  { label: 'Directions taken', hint: 'drivers heading to you' },
  { label: 'Reviews received', hint: 'from real visits' },
  { label: 'Average rating', hint: 'out of five' },
]

/**
 * The trend line's shape.
 *
 * A rising sequence, because a listing that gets found does trend up — but no
 * axis, no numbers and no dates, so it stays an illustration of the chart
 * rather than a claim about anybody's traffic.
 */
const TREND = [18, 26, 22, 34, 30, 44, 38, 52, 46, 60, 54, 68, 62, 78, 72, 88]

export interface PartnerDashboardPreviewProps {
  className?: string
}

export function PartnerDashboardPreview({ className }: PartnerDashboardPreviewProps) {
  return (
    <section
      aria-labelledby="dashboard-preview-heading"
      className={cn(
        'overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-e4',
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.14em] text-plug-blue-600">
            <LayoutDashboard size={13} aria-hidden="true" />
            Your dashboard
          </p>
          <h2
            id="dashboard-preview-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            What you see once you are listed
          </h2>
          <p className="mt-1.5 text-ui text-slate-500">
            Counted from real visits to your page — not estimated, and not shared with
            anyone else.
          </p>
        </div>

        {/* Said on the card itself, not in a caption underneath. A preview that
            is only labelled below the fold is a preview somebody will screenshot
            without the label. */}
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-ui-xs font-bold uppercase tracking-[0.1em] text-amber-700">
          Example — no real figures
        </span>
      </div>

      <div className="grid gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-8 lg:px-8 lg:py-8">
        {/* ── The listing, and what gets counted about it ─────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand"
            >
              <Zap size={20} className="fill-white text-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display font-bold text-slate-900">Your listing</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-ui-sm text-slate-500">
                <MapPin size={12} aria-hidden="true" />
                Your city · your chargers
              </p>
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-ui-xs font-bold text-emerald-700">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-plug-blue-200"
              >
                {/* An em dash where the number goes, rather than a plausible
                    figure. It reads as "this is where yours appears" and cannot
                    be mistaken for data. */}
                <dd
                  aria-hidden="true"
                  className="font-mono text-2xl font-bold leading-none text-slate-300"
                >
                  —
                </dd>
                <dt className="mt-2 text-ui-sm font-bold text-slate-900">{metric.label}</dt>
                <p className="mt-0.5 text-ui-xs text-slate-400">{metric.hint}</p>
              </div>
            ))}
          </dl>
        </div>

        {/* ── The trend ───────────────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-ui-sm font-bold text-slate-900">
            <TrendingUp size={15} className="text-plug-blue-600" aria-hidden="true" />
            Views per day, against the thirty before
          </p>
          <p className="mt-1 text-ui-xs text-slate-400">
            Illustration of the chart. No axis, because there is no data yet.
          </p>

          <span aria-hidden="true" className="mt-5 flex flex-1 items-end gap-1 sm:gap-1.5">
            {TREND.map((height, index) => (
              <span
                key={index}
                style={{ height: `${height}%` }}
                className="min-h-[6px] flex-1 rounded-t bg-gradient-to-t from-plug-blue-200 to-plug-cyan-400"
              />
            ))}
          </span>

          {/* A baseline, so the bars sit on something. Without it they float in
              the card and the chart reads as an unfinished sparkline. */}
          <span aria-hidden="true" className="mt-1.5 block h-px w-full bg-slate-200" />
        </div>
      </div>
    </section>
  )
}

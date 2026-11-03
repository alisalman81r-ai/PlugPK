// src/components/partners/PartnerDashboardPreview.tsx
import { Eye, MapPin, MessageSquare, Navigation, Star, TrendingUp, Zap, type IconType } from '@/components/ui/icons'

import { ExampleBadge, Lift, LiftBody, LiftHead, Tag } from '@/components/v2/ui'

import { PartnerTrendBars } from './PartnerTrendBars'

/**
 * What a host actually sees once they are listed — the paper sheet lifted into
 * the hero (landing-v2's .pt-dash).
 *
 * On a page asking somebody to hand over their charger, the most persuasive
 * thing is not the pitch but seeing exactly what they get back, before the
 * plans and before the form.
 *
 * ── Every part of this is labelled as an example ──────────────────────
 *
 * The metric tiles carry no numbers and the chart has no axis, deliberately.
 * Inventing "1,284 views" and drawing a plausible curve is the most tempting
 * lie on this page and the hardest to walk back once a real host compares it to
 * their own dashboard. What is shown is the *shape* of the page: which four
 * things get counted, and that there is a trend. The four names are the ones
 * BusinessDailyStat actually records, so this preview cannot promise a metric
 * the product does not collect.
 */

/** The four figures the dashboard really counts. See BusinessDailyStat. */
const METRICS: { label: string; hint: string; icon: IconType }[] = [
  { label: 'Listing views', hint: 'per day, per visitor', icon: Eye },
  { label: 'Directions taken', hint: 'drivers heading to you', icon: Navigation },
  { label: 'Reviews received', hint: 'from real visits', icon: MessageSquare },
  { label: 'Average rating', hint: 'out of five', icon: Star },
]

export function PartnerDashboardPreview() {
  return (
    <Lift>
      <section aria-labelledby="dashboard-preview-heading">
        <LiftHead
          className="items-start max-sm:flex-col max-sm:gap-2.5"
          eyebrow="Your dashboard"
          title={<span id="dashboard-preview-heading">What you see once you are listed</span>}
          meta={
            <span className="block max-w-[46rem]">
              Counted from real visits to your page — not estimated, and not shared with anyone else.{' '}
              <b>The figures shown here are an example.</b>
            </span>
          }
          actions={<ExampleBadge className="max-sm:order-first">Example</ExampleBadge>}
        />

        <LiftBody className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="grid content-start gap-3">
            {/* The listing itself */}
            <div className="flex items-center gap-3.5 rounded-[20px] border border-ink/10 bg-white px-[18px] py-4">
              <span aria-hidden="true" className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-ink text-volt">
                <Zap size={20} className="fill-current" />
              </span>
              <div className="grid min-w-0 flex-1 gap-[3px]">
                <b className="truncate font-display text-xl font-normal leading-[1.1] text-ink pg-medium">Your listing</b>
                <span className="inline-flex items-center gap-[5px] text-[13px] leading-snug text-muted">
                  <MapPin size={14} aria-hidden="true" />
                  Your city · your chargers
                </span>
              </div>
              <span className="inline-flex h-7 flex-none items-center gap-[7px] rounded-full border border-[#BFEBD1] bg-[#E9F8EF] px-[11px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#157A45]">
                <span aria-hidden="true" className="relative flex h-[7px] w-[7px]">
                  <span className="absolute -inset-1 rounded-full border-[1.5px] border-[#1FA35B] motion-safe:animate-ping" />
                  <span className="relative h-[7px] w-[7px] rounded-full bg-[#1FA35B]" />
                </span>
                Live
              </span>
            </div>

            {/* What gets counted. An em dash where the number goes: it reads
                as "this is where yours appears" and cannot be mistaken for data. */}
            <dl className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="relative grid gap-0.5 rounded-[20px] border border-ink/10 bg-white p-3.5 transition-[translate,box-shadow] duration-[400ms] ease-out hover:-translate-y-[3px] hover:shadow-e1 sm:p-[18px]"
                >
                  <metric.icon size={18} aria-hidden="true" className="absolute right-4 top-4 text-fog" />
                  <dd aria-hidden="true" className="mb-3 font-mono text-[26px] font-semibold leading-none text-fog sm:text-[32px]">
                    —
                  </dd>
                  <dt className="text-sm font-semibold text-ink">{metric.label}</dt>
                  <dd className="text-[12.5px] text-muted">{metric.hint}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The trend */}
          <figure className="m-0 grid min-h-full grid-rows-[auto_1fr_auto] gap-4 rounded-[22px] border border-ink/10 bg-white px-4 pb-[18px] pt-4 sm:px-[22px] sm:pt-5">
            <figcaption className="grid gap-1">
              <b className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
                <TrendingUp size={18} className="text-volt-ink" aria-hidden="true" />
                Views per day, against the thirty before
              </b>
              <span className="text-[13px] text-muted">Illustration of the chart. No axis, because there is no data yet.</span>
            </figcaption>

            <PartnerTrendBars />

            <div aria-hidden="true" className="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-[7px]">
                <i className="h-3 w-3 rounded-[3px] bg-ink" />
                This period
              </span>
              <span className="inline-flex items-center gap-[7px]">
                <i className="h-3 w-3 rounded-[3px] bg-stone" />
                The thirty before
              </span>
              <Tag mono className="text-muted sm:ml-auto">
                Illustration
              </Tag>
            </div>
          </figure>
        </LiftBody>
      </section>
    </Lift>
  )
}

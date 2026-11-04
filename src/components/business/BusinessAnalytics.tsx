'use client'

import { TrendingDown, TrendingUp } from '@/components/ui/icons'
import * as React from 'react'

import type { BusinessAnalyticsData } from '@/lib/db/queries'
import { gsap, prefersReduced } from '@/lib/gsap'
import { cn } from '@/lib/utils'

import { AdmIcon } from '@/components/admin/admin-icons'

import { BizKpi } from './BizKpi'
import { useGlide } from './biz-motion'

/**
 * What the owner's listing actually did.
 *
 * Every figure here comes from BusinessDailyStat and Review — rows written when
 * a real visitor opened the listing or pressed its directions button. There is
 * no premium gate and no fixture: a quiet listing shows zeros and says why.
 *
 * Drawn in the admin design's language: KPI tiles that count up, a segmented
 * range picker whose ink pill glides, and a bar chart (views) with a line
 * (directions) that draw in when the range changes.
 */

export interface BusinessAnalyticsProps {
  analytics: BusinessAnalyticsData
  /** Approved listings can accumulate figures; others cannot be visited. */
  isLive: boolean
}

type RangeKey = 7 | 30 | 60

const RANGES: RangeKey[] = [7, 30, 60]

function percentChange(current: number, previous: number): number | null {
  // No baseline means no percentage. Reporting "+100%" against a month of zero
  // would dress up the first visit as growth.
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous)
  if (change === null || change === 0) return <span>Same as last month</span>
  const up = change > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <>
      <span className={cn('kpi__delta', up ? 'up' : 'down')}>
        <Icon aria-hidden="true" />
        {up ? '+' : ''}
        {change}%
      </span>
      <span>vs last 30 days</span>
    </>
  )
}

function shortDate(iso: string | undefined) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function BusinessAnalytics({ analytics, isLive }: BusinessAnalyticsProps) {
  const [range, setRange] = React.useState<RangeKey>(30)
  const [hover, setHover] = React.useState<number | null>(null)
  const segRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLSpanElement>(null)
  const chartRef = React.useRef<SVGSVGElement>(null)
  const [segReady, setSegReady] = React.useState(false)

  useGlide(segRef, pillRef, 'button[aria-pressed="true"]', 'x', [range])
  React.useEffect(() => setSegReady(true), [])

  const points = React.useMemo(() => analytics.chartData.slice(-range), [analytics.chartData, range])

  // At least 1, so a quiet listing draws a flat baseline instead of dividing by zero.
  const max = React.useMemo(() => Math.max(...points.map((p) => Math.max(p.views, p.clicks)), 1), [points])
  const hasAnyActivity = analytics.chartData.some((point) => point.views > 0 || point.clicks > 0)

  const W = points.length * 10
  const H = 100

  // Bars rise and the directions line wipes in whenever the range changes.
  React.useLayoutEffect(() => {
    const svg = chartRef.current
    if (!svg || prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.from(svg.querySelectorAll('.bar'), {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.8,
        ease: 'expo.out',
        stagger: { amount: 0.35 },
      })
      gsap.fromTo(svg.querySelector('#biz-reveal rect'), { attr: { width: 0 } }, { attr: { width: W }, duration: 1.2, ease: 'power2.inOut', delay: 0.15 })
    }, svg)
    return () => ctx.revert()
  }, [range, hasAnyActivity, W])

  const y = (v: number) => H - (v / max) * (H - 6)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * 10 + 5},${y(p.clicks).toFixed(2)}`).join(' ')
  const tip = hover !== null ? points[hover] : null

  const t = analytics.thisMonth
  const l = analytics.lastMonth

  return (
    <>
      {!isLive ? (
        <p className="note note--warn">
          <AdmIcon name="alert" />
          <span>
            <b>Not live yet</b>
            This listing is not approved yet, so drivers cannot open it. Figures start once it is live.
          </span>
        </p>
      ) : null}

      <div className="biz-kpis">
        <BizKpi
          lit
          icon="globe"
          label="Listing views"
          value={t.profileViews}
          note={<Delta current={t.profileViews} previous={l.profileViews} />}
        />
        <BizKpi
          icon="pinl"
          label="Directions taken"
          value={t.navigateClicks}
          note={<Delta current={t.navigateClicks} previous={l.navigateClicks} />}
        />
        <BizKpi
          icon="star"
          label="Average rating"
          value={t.avgRating === 0 ? null : t.avgRating}
          decimals={1}
          suffix=" / 5"
          note={t.avgRating === 0 ? 'No ratings this month' : <Delta current={t.avgRating} previous={l.avgRating} />}
        />
        <BizKpi
          icon="chat"
          label="Reviews received"
          value={t.reviewsReceived}
          note={<Delta current={t.reviewsReceived} previous={l.reviewsReceived} />}
        />
      </div>

      <section className="card" aria-labelledby="views-per-day">
        <div className="chead">
          <div className="min-w-0">
            <h2 id="views-per-day">Views per day</h2>
            <p>Views count once per visitor per day. Figures are compared with the 30 days before.</p>
          </div>
          <div ref={segRef} className={cn('seg biz-seg', segReady && 'is-ready')} role="group" aria-label="Range">
            <span ref={pillRef} className="biz-seg__pill" aria-hidden="true" />
            {RANGES.map((option) => (
              <button key={option} type="button" onClick={() => setRange(option)} aria-pressed={range === option}>
                {option} days
              </button>
            ))}
          </div>
        </div>

        {hasAnyActivity ? (
          <div className="bchart" onMouseLeave={() => setHover(null)}>
            <div className="bchart__legend">
              <span>
                <i aria-hidden="true" />
                Views
              </span>
              <span>
                <i className="l" aria-hidden="true" />
                Directions
              </span>
            </div>
            <div className="chart__wrap">
              {tip ? (
                <div
                  className="chart__tip"
                  style={{ left: `clamp(0px, calc(${((hover! + 0.5) / points.length) * 100}% - 70px), calc(100% - 150px))` }}
                >
                  <b>{shortDate(tip.date)}</b>
                  <span>
                    <b>{tip.views}</b> view{tip.views === 1 ? '' : 's'}
                  </span>
                  <span>
                    <b>{tip.clicks}</b> direction{tip.clicks === 1 ? '' : 's'}
                  </span>
                </div>
              ) : null}
              <svg
                ref={chartRef}
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Daily views and directions over the last ${range} days`}
              >
                <defs>
                  <clipPath id="biz-reveal">
                    <rect x="0" y="-10" width={W} height={H + 20} />
                  </clipPath>
                </defs>
                <g className="grid" aria-hidden="true">
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} vectorEffect="non-scaling-stroke" />
                  ))}
                </g>
                {points.map((p, i) => {
                  const h = Math.max((p.views / max) * (H - 6), 1.2)
                  return (
                    <g
                      key={p.date}
                      className={cn('col', hover !== null && hover !== i && 'is-dim')}
                      tabIndex={0}
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${p.date}: ${p.views} views, ${p.clicks} directions`}
                    >
                      <rect className="hit" x={i * 10} y="0" width="10" height={H} />
                      <rect className={cn('bar', p.views === 0 && 'is-zero')} x={i * 10 + 1.6} y={H - h} width="6.8" height={h} rx="1.4" />
                    </g>
                  )
                })}
                <g clipPath="url(#biz-reveal)" pointerEvents="none">
                  <path className="line-halo" d={line} />
                  <path className="line" d={line} />
                </g>
              </svg>
            </div>
            <div className="bchart__axis" aria-hidden="true">
              <span>{shortDate(points[0]?.date)}</span>
              <span>Peak {max.toLocaleString('en-PK')}</span>
              <span>{shortDate(points[points.length - 1]?.date)}</span>
            </div>
          </div>
        ) : (
          <div className={cn('empty', !isLive && 'empty--wait')}>
            <span className="empty__ico">
              <AdmIcon name={isLive ? 'trend' : 'alert'} />
            </span>
            <b>{isLive ? 'No visits recorded yet' : 'Nothing to chart yet'}</b>
            <p>
              {isLive
                ? 'This fills in as drivers open your listing.'
                : 'Nothing to chart until the listing is live.'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}

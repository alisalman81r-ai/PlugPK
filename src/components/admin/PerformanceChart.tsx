// src/components/admin/PerformanceChart.tsx
'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'

/**
 * A time series for the operations dashboard.
 *
 * ── It renders its own emptiness on purpose ───────────────────────────
 *
 * This ships wired to nothing, because the two series the brief asked for —
 * charging sessions and revenue — have no source. There is no session table
 * and Connector carries no pricing, deliberately: the schema's note says a
 * stale rate presented as fact is worse than no rate at all.
 *
 * Drawing a plausible curve here would be the single most misleading thing on
 * the page. A chart is read as a measurement, and nobody inspects the query
 * behind a line that looks reasonable. So with no points, the axes, the range
 * filter and the frame all render — sized exactly as they will be with data —
 * and the plot area says what is missing and why.
 *
 * Passing a non-empty `data` array is all that is needed later; nothing about
 * the markup changes.
 */

export type ChartRange = '7D' | '30D' | '3M' | '1Y'

const RANGES: ChartRange[] = ['7D', '30D', '3M', '1Y']

export interface ChartPoint {
  /** Already formatted for the axis — this component does no date maths. */
  label: string
  value: number
}

export interface PerformanceChartProps {
  data: ChartPoint[]
  /** Prefix on the tooltip value, e.g. "Rs ". */
  unitPrefix?: string
  /** Why the series is empty. Shown in place of the plot. */
  emptyReason: string
  height?: number
}

export function PerformanceChart({
  data,
  unitPrefix = '',
  emptyReason,
  height = 200,
}: PerformanceChartProps) {
  const [range, setRange] = React.useState<ChartRange>('30D')
  const hasData = data.length > 0

  return (
    <div className="px-5 pb-5">
      {/*
        The range filter is live even with no series behind it. It is the
        control an operator reaches for first, and disabling it would suggest
        the panel is broken rather than unfed.
      */}
      <div
        role="group"
        aria-label="Time range"
        className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
      >
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            aria-pressed={range === option}
            className={cn(
              'rounded-[0.4rem] px-2.5 py-1 text-ui-xs font-semibold transition-colors duration-150',
              range === option
                ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(5,36,30,0.08)]'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#26CDB2" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#26CDB2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#DCE3E0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#626D6B' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 11, fill: '#626D6B' }}
            />
            <Tooltip
              cursor={{ stroke: '#BAC2C0', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #DCE3E0',
                boxShadow: '0 8px 24px -12px rgba(5,36,30,0.24)',
                fontSize: 12,
              }}
              formatter={(value) => [`${unitPrefix}${Number(value ?? 0).toLocaleString('en-PK')}`, '']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0B332C"
              strokeWidth={2}
              fill="url(#perf-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center"
        >
          <p className="text-ui-sm font-semibold text-slate-600">Not being recorded yet</p>
          <p className="mt-1 max-w-sm text-ui-xs leading-relaxed text-slate-500">{emptyReason}</p>
        </div>
      )}
    </div>
  )
}

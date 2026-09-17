// src/components/admin/LiveNetwork.tsx
import Link from 'next/link'

import type { NetworkHealth } from '@/lib/db/network-health'
import { cn } from '@/lib/utils'

/**
 * The health of the whole network, on one card.
 *
 * ── The states are the product's, not the brief's ─────────────────────
 *
 * The brief asked for Available / Charging / Offline / Maintenance. The
 * product stores available, limited, offline and unknown — so those are what
 * is shown. There is no maintenance flag and nothing reports a station as
 * mid-charge, and rows that can only ever read zero teach an operator to stop
 * reading the legend.
 *
 * limited matters most here and was the bug this panel shipped with first:
 * three hardcoded rows counted 5 of 6 stations and silently dropped the sixth,
 * while the card above it read 'All systems operational'. Every state the
 * union allows now has a row, so the rows always sum to the total.
 *
 * ── The bar is the point ──────────────────────────────────────────────
 *
 * Port availability is the one figure that changes minute to minute and the
 * most likely reason this page is open. It gets the width of the card rather
 * than a cell in a grid.
 */

const STATE_STYLE = {
  online: { dot: 'bg-green-500' },
  limited: { dot: 'bg-blue-500' },
  unknown: { dot: 'bg-slate-300' },
  offline: { dot: 'bg-red-500' },
} as const

export function LiveNetwork({ health }: { health: NetworkHealth }) {
  const { stations, ports, connectors } = health
  const pct = ports.availablePct

  const rows = [
    { key: 'online' as const, label: 'Online', value: stations.online },
    { key: 'limited' as const, label: 'Limited', value: stations.limited },
    { key: 'offline' as const, label: 'Offline', value: stations.offline },
    { key: 'unknown' as const, label: 'Unconfirmed', value: stations.unknown },
  ]

  return (
    <div className="px-5 py-5">
      {/* ── Port availability, the live figure ──────────────────────── */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[1.75rem] font-black leading-none tracking-[-0.02em] tabular-nums text-slate-900">
          {ports.available}
          <span className="text-slate-300"> / </span>
          {ports.total}
        </p>
        <p className="text-ui-xs font-medium text-slate-500">
          {pct === null ? 'No ports recorded yet' : `${pct.toFixed(1)}% of ports free right now`}
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={
          pct === null
            ? 'No ports recorded'
            : `${ports.available} of ${ports.total} ports available`
        }
      >
        <div
          className="h-full rounded-full bg-green-500 transition-[width] duration-500"
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>

      {/* ── Station states ──────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map((row) => {
          const style = STATE_STYLE[row.key]
          return (
            <Link
              key={row.key}
              href="/admin/stations"
              className="rounded-xl border border-slate-200/80 px-3 py-3 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                <span className="text-ui-xs font-medium text-slate-500">{row.label}</span>
              </span>
              <span className="mt-1.5 block text-xl font-black leading-none tabular-nums text-slate-900">
                {row.value}
              </span>
            </Link>
          )
        })}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-4 text-ui-xs text-slate-500">
        {stations.total} {stations.total === 1 ? 'station' : 'stations'} · {connectors.total}{' '}
        {connectors.total === 1 ? 'connector' : 'connectors'}
        {connectors.degraded > 0 ? (
          <>
            {' · '}
            <span className="font-semibold text-amber-700">
              {connectors.degraded} not available
            </span>
          </>
        ) : null}
      </p>
    </div>
  )
}

// src/components/admin/NetworkSummary.tsx
import { cn } from '@/lib/utils'
import type { NetworkHealth } from '@/lib/db/network-health'

/**
 * The estate at a glance, above the stations table.
 *
 * ── Same numbers as the dashboard, from the same query ────────────────
 *
 * Every figure comes from getNetworkHealth(), which is what the dashboard's
 * Live Network panel reads. Counting stations again here would have been
 * three lines and the start of the problem this product keeps avoiding: two
 * screens reporting different totals for the same network, with no way for an
 * operator to tell which one is lying.
 *
 * The chain is one line deep on purpose —
 *
 *   database → getNetworkHealth() → dashboard panel + this strip
 *
 * and the port totals inside it come from getPortAvailability(), the helper the
 * public station pages use, so the operator's figure and the driver's figure
 * cannot disagree either.
 *
 * ── Only what the schema can answer ───────────────────────────────────
 *
 * Stations by state, connectors by state, ports. No utilisation, no uptime, no
 * sessions and no revenue: nothing records them, and a percentage with no
 * meter behind it is the one thing an operations screen must never show.
 */

function Figure({
  label,
  value,
  sub,
  dot,
}: {
  label: string
  value: number | string
  sub?: string
  dot?: string
}) {
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <p className="flex items-center gap-1.5 text-ui-xs font-medium text-slate-500">
        {dot ? <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', dot)} /> : null}
        {label}
      </p>
      <p className="mt-1 text-xl font-black leading-none tabular-nums text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-ui-xs text-slate-400">{sub}</p> : null}
    </div>
  )
}

export function NetworkSummary({ health }: { health: NetworkHealth }) {
  const { stations, connectors, ports } = health
  const pct = ports.availablePct

  return (
    <section
      aria-label="Network summary"
      className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(5,36,30,0.04)] sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0"
    >
      <Figure label="Stations" value={stations.total} sub="on the live site" />
      <Figure label="Online" value={stations.online} dot="bg-green-500" sub="fully available" />
      <Figure label="Limited" value={stations.limited} dot="bg-blue-500" sub="partly usable" />
      <Figure label="Offline" value={stations.offline} dot="bg-red-500" sub="nobody can charge" />
      <Figure
        label="Connectors"
        value={connectors.total}
        sub={`${connectors.inUse} in use · ${connectors.offline} offline`}
      />
      <Figure
        label="Ports free"
        value={`${ports.available} / ${ports.total}`}
        sub={pct === null ? 'none recorded' : `${pct.toFixed(1)}% available`}
      />
    </section>
  )
}

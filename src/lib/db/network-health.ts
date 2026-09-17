// src/lib/db/network-health.ts
import 'server-only'

import { getPortAvailability } from '@/lib/utils'

import { prisma } from './client'

/**
 * What the operations dashboard can honestly say about the network.
 *
 * ── The rule this file exists to enforce ──────────────────────────────
 *
 * Everything here is counted from a row that exists. Nothing is estimated,
 * projected or filled in to make a card look complete. Where the product has
 * no source for a figure, this file returns `null` and says why, rather than
 * returning a plausible number — a dashboard that invents its own readings is
 * worse than one with a gap in it, because the gap is obvious and the
 * invention is not.
 *
 * ── What is NOT here, and why ─────────────────────────────────────────
 *
 * Charging sessions, revenue and uptime. The schema has 25 models and none of
 * them records a session, a payment or a heartbeat: there is no hardware
 * integration writing them, and Connector deliberately carries no pricing —
 * the schema's own note says a stale rate shown as fact is worse than no rate,
 * because a driver who arrives expecting one price and is charged another
 * stops trusting the map.
 *
 * So the dashboard renders those panels as empty states wired to this shape.
 * When a session source lands, it is this file that gains a query and the
 * components keep their markup.
 */

/** A station's status as the product actually stores it. */
type StationStatus = 'available' | 'limited' | 'offline' | 'unknown'

export interface NetworkHealth {
  stations: {
    total: number
    online: number
    /** Published and reachable, but not every port is usable. */
    limited: number
    offline: number
    unknown: number
  }
  ports: {
    total: number
    available: number
    /** Null rather than NaN when the network has no ports at all yet. */
    availablePct: number | null
  }
  connectors: {
    total: number
    /**
     * Broken out by the states ConnectorStatus actually defines, because the
     * difference between them matters operationally and collapsing it was a
     * bug once already: a connector with a car on it is the product working,
     * and counting it as degraded put four alerts on a dashboard that should
     * have shown two.
     */
    available: number
    inUse: number
    offline: number
    /** Offline only. Never in-use. */
    degraded: number
  }
}

/**
 * One alert, derived from a row rather than from an alerting system.
 *
 * The product has no incident table, so these are not stored events with a
 * lifecycle — they are the current state of a station or connector, read now.
 * That is why there is no "acknowledged" or "resolved": there is nowhere to
 * write it back to, and a button that appears to resolve an alert while
 * changing nothing would be a lie told by the UI.
 *
 * `href` points at the row that can actually fix it, so the alert is a route
 * to the edit form rather than a notification to be dismissed.
 */
export interface NetworkAlert {
  id: string
  severity: 'high' | 'medium'
  subject: string
  issue: string
  href: string
  /** When the underlying row last changed, for "x minutes ago". */
  since: string | null
}

/**
 * Station and port health, counted in three queries.
 *
 * Ports are summed through getPortAvailability, the same helper the public
 * station pages use, so the operator's figure and the driver's figure can
 * never disagree.
 */
export async function getNetworkHealth(): Promise<NetworkHealth> {
  const [stations, connectorTotal, connectorsByStatus] = await Promise.all([
    prisma.station.findMany({
      select: {
        status: true,
        connectors: { select: { ports: true, availablePorts: true } },
      },
    }),
    prisma.connector.count(),
    prisma.connector.groupBy({ by: ['status'], _count: true }),
  ])

  /*
    Grouped in the database rather than filtered in memory, and read by name
    rather than by 'not available'. A status this code has not heard of counts
    toward the total and toward nothing else, which is the safe way to be
    wrong: a new state would show as unaccounted rather than silently become
    a fault.
  */
  const countConnectors = (status: string) =>
    connectorsByStatus.find((row) => row.status === status)?._count ?? 0

  const byStatus = (status: StationStatus) =>
    stations.filter((station) => station.status === status).length

  const ports = stations.reduce(
    (totals, station) => {
      const counted = getPortAvailability(station)
      return {
        total: totals.total + counted.total,
        available: totals.available + counted.available,
      }
    },
    { total: 0, available: 0 },
  )

  return {
    stations: {
      total: stations.length,
      online: byStatus('available'),
      limited: byStatus('limited'),
      offline: byStatus('offline'),
      unknown: byStatus('unknown'),
    },
    ports: {
      ...ports,
      // Null, not 0, when there is nothing to take a percentage of. A network
      // with no ports is not a network that is 0% available.
      availablePct: ports.total > 0 ? (ports.available / ports.total) * 100 : null,
    },
    connectors: {
      total: connectorTotal,
      available: countConnectors('available'),
      inUse: countConnectors('in-use'),
      offline: countConnectors('offline'),
      degraded: countConnectors('offline'),
    },
  }
}

/**
 * Everything currently wrong with the network, worst first.
 *
 * An offline station is high: nobody can charge there at all. An offline
 * connector is medium: the station still works and its other ports still take
 * cars. A connector reporting in-use is not here at all — that is a car
 * charging, which is the product working rather than failing.
 *
 * Capped at twelve. The panel is a place to start work, not a log — an
 * operator facing forty alerts needs the stations list with a filter, not a
 * longer card.
 */
export async function listNetworkAlerts(limit = 12): Promise<NetworkAlert[]> {
  const [offlineStations, degradedConnectors] = await Promise.all([
    prisma.station.findMany({
      where: { status: 'offline' },
      select: { id: true, name: true, city: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    prisma.connector.findMany({
      /*
        Only offline. in-use was here and it was wrong: a connector with a
        car plugged into it is the product working, and paging an operator
        about it at 2am would train them to ignore the panel. Availability is
        already reported by the port counter above.
      */
      where: { status: 'offline' },
      select: {
        id: true,
        type: true,
        status: true,
        station: { select: { id: true, name: true } },
      },
      take: limit,
    }),
  ])

  const stationAlerts: NetworkAlert[] = offlineStations.map((station) => ({
    id: `station-${station.id}`,
    severity: 'high',
    subject: station.name,
    issue: `Station offline${station.city ? ` · ${station.city}` : ''}`,
    href: `/admin/stations/${station.id}`,
    since: station.updatedAt.toISOString(),
  }))

  const connectorAlerts: NetworkAlert[] = degradedConnectors.map((connector) => ({
    id: `connector-${connector.id}`,
    severity: 'medium',
    subject: `${connector.type} · ${connector.station?.name ?? 'Unassigned'}`,
    issue: `Connector reported ${connector.status}`,
    href: connector.station ? `/admin/stations/${connector.station.id}` : '/admin/connectors',
    // Connector carries no updatedAt, so there is no honest timestamp to give.
    since: null,
  }))

  return [...stationAlerts, ...connectorAlerts].slice(0, limit)
}

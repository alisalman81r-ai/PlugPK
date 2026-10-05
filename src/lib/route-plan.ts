// src/lib/route-plan.ts

/**
 * The charging plan for one journey, as a pure function.
 *
 * ── Why this replaced what was in useRoutePlanner ─────────────────────
 *
 * The old planner decided how many stops a trip needed from its length alone
 * (one under 300 km, a stop every 350 km after that), knocked a flat 25% off
 * the battery per leg whatever the car or the gap, never checked the final leg,
 * clamped every charge to 20–45 minutes at no less than 20 kW, and printed a
 * hard-coded "~45%" on arrival. So a 301 km city car "made" Karachi to
 * Islamabad with no stops, and an AC-only car was told it would fast-charge.
 *
 * This walks the journey the way a driver would: how far does the battery I
 * have actually take me, is there a charger I can use before it runs out, and
 * how long will I stand there. Every number it returns comes from the car's
 * own figures, the listed chargers and the charge-time model in
 * charging-time.ts. When the answer is "you can't do this on what is listed",
 * it says so instead of inventing a stop.
 *
 * No React and no database, so the arithmetic can be read and tested on its
 * own — see the scratch tests run against it before it shipped.
 */

import { estimateCharge } from '@/lib/charging-time'
import { stationsAlongRoute } from '@/lib/route-corridor'
import type { ConnectorType, Coordinates, EVModel } from '@/lib/types'

// ─── Assumptions, stated once ───────────────────────────────────────

/**
 * Rated range to motorway range.
 *
 * A catalogue range is a test-cycle figure (WLTP, NEDC, and for many Chinese
 * imports the even kinder CLTC). Sustained 100–120 km/h on the M-2 or N-5, with
 * the air-conditioning running through a Pakistani summer, costs a real car
 * somewhere between a tenth and a quarter of that. 0.85 is the cautious middle
 * of that band — a plan that leaves a driver with charge to spare is a better
 * failure than one that strands them.
 */
export const RANGE_DERATE = 0.85

/** Never plan to arrive anywhere — a stop or the destination — below this. */
export const RESERVE_PERCENT = 10

/**
 * What a stop charges to.
 *
 * Past 80% a DC charge slows sharply (see dcTaper in charging-time.ts), so the
 * last fifth can take as long as everything before it. Stopping at 80 and
 * charging again later is nearly always faster. The plan only goes to 100 when
 * the next gap is longer than 80% can cover.
 */
export const TARGET_PERCENT = 80

/**
 * The shortest gap between two stops the plan will choose.
 *
 * Without it, the greedy pick below can stop a few kilometres after the last
 * charge just because that charger is the furthest one "in reach".
 */
export const MIN_STOP_GAP_KM = 40

/** Sockets that are DC — the car's own charger is bypassed on these. */
const DC_CONNECTORS: readonly ConnectorType[] = ['CCS2', 'CHAdeMO', 'GBT']

// ─── Inputs ─────────────────────────────────────────────────────────

export interface PlanVehicle {
  /** Rated range in km, as the catalogue publishes it. */
  rangeKm: number
  /** Usable battery, kWh. */
  batteryKwh: number
  /** Peak DC the car accepts. Null when the car cannot DC-charge (or no figure). */
  dcKw: number | null
  /** Onboard AC charger limit. Null when the catalogue has no figure. */
  acKw: number | null
  /**
   * The car's sockets. Empty when the catalogue does not say, in which case a
   * charger is offered on the common Pakistani pairing (CCS2 / Type 2) and the
   * stop is marked as unconfirmed.
   */
  connectorTypes: ConnectorType[]
}

export interface PlanConnector {
  type: ConnectorType
  maxPowerKw: number
}

export interface PlanStation {
  id: string
  name: string
  coordinates: Coordinates
  connectors: PlanConnector[]
}

export interface PlanInput<T extends PlanStation> {
  origin: Coordinates
  destination: Coordinates
  originName: string
  destinationName: string
  /** Road distance for the whole trip, km. */
  totalDistanceKm: number
  vehicle: PlanVehicle
  /** State of charge on departure, 0–100. */
  startPercent: number
  stations: readonly T[]
}

// ─── Outputs ────────────────────────────────────────────────────────

export interface PlanStop<T extends PlanStation> {
  order: number
  station: T
  /** Road km from the previous stop (or the start). */
  distanceFromPreviousKm: number
  arrivalBatteryPercent: number
  departureBatteryPercent: number
  /** Minutes on the charger, from estimateCharge. Null if it could not be estimated. */
  chargingTimeMinutes: number | null
  /** The power the estimate assumed, and on which kind of socket. */
  chargeKw: number
  mode: 'dc' | 'ac'
  /**
   * Something the driver should know about this stop — that the car cannot
   * DC-charge here, or that we could not confirm its socket fits.
   */
  note: string | null
}

export interface PlanLeg {
  from: string
  to: string
  km: number
  startPercent: number
  endPercent: number
}

export type PlanStatus = 'ok' | 'unreachable'

export interface RoutePlan<T extends PlanStation> {
  status: PlanStatus
  /** Why the trip cannot be done on what is listed. Set when unreachable. */
  reason: string | null
  stops: PlanStop<T>[]
  legs: PlanLeg[]
  /** Charge left on arrival. Null when the destination is not reached. */
  arrivalPercent: number | null
  totalChargingMinutes: number
  /** Things that do not block the trip but that a driver should read. */
  warnings: string[]
  /** How far the car is assumed to go on a full battery, after the derate. */
  usableRangeKm: number
}

// ─── Charger fit ────────────────────────────────────────────────────

interface Fit {
  mode: 'dc' | 'ac'
  /** Charger power on the socket chosen. */
  chargerKw: number
  /** What the car accepts in that mode, or null when unknown. */
  carLimitKw: number | null
  note: string | null
}

/**
 * The best socket this car can use at this station, or null if none fits.
 *
 * DC first when the car takes DC and the station has a DC socket the car
 * matches. Otherwise AC, through the car's onboard charger. A station with
 * only DC sockets the car cannot use is no stop at all.
 */
export function bestFit(vehicle: PlanVehicle, connectors: readonly PlanConnector[]): Fit | null {
  const known = vehicle.connectorTypes.length > 0
  const carHas = (type: ConnectorType): boolean =>
    known ? vehicle.connectorTypes.includes(type) : type === 'CCS2' || type === 'Type2'

  const dc = connectors.filter((c) => DC_CONNECTORS.includes(c.type) && c.maxPowerKw > 0)
  const ac = connectors.filter((c) => !DC_CONNECTORS.includes(c.type) && c.maxPowerKw > 0)

  const unconfirmed = known ? null : 'We do not have this car’s socket type, so check the plug fits.'

  if (vehicle.dcKw !== null && vehicle.dcKw > 0) {
    const carDc = vehicle.dcKw
    const usable = dc.filter((c) => carHas(c.type))
    if (usable.length > 0) {
      const top = usable.reduce((a, b) =>
        Math.min(b.maxPowerKw, carDc) > Math.min(a.maxPowerKw, carDc) ? b : a,
      )
      return { mode: 'dc', chargerKw: top.maxPowerKw, carLimitKw: carDc, note: unconfirmed }
    }
  }

  const usableAc = ac.filter((c) => carHas(c.type))
  if (usableAc.length === 0) return null

  const top = usableAc.reduce((a, b) => (b.maxPowerKw > a.maxPowerKw ? b : a))
  const hasDc = dc.length > 0
  const note =
    hasDc && (vehicle.dcKw === null || vehicle.dcKw <= 0)
      ? 'Your car cannot DC fast-charge, so this stop uses the AC socket.'
      : hasDc
        ? 'The DC socket here does not fit your car, so this stop uses the AC socket.'
        : unconfirmed
  return { mode: 'ac', chargerKw: top.maxPowerKw, carLimitKw: vehicle.acKw, note }
}

// ─── The plan ───────────────────────────────────────────────────────

interface Candidate<T> {
  station: T
  /** Road km from the start to the point beside the station. */
  atKm: number
  fit: Fit
}

const round = (n: number) => Math.round(n)

export function planRoute<T extends PlanStation>(input: PlanInput<T>): RoutePlan<T> {
  const { vehicle, totalDistanceKm, originName, destinationName } = input
  const usableRangeKm = vehicle.rangeKm * RANGE_DERATE
  const kmPerPercent = usableRangeKm / 100
  const start = Math.min(100, Math.max(0, input.startPercent))

  const warnings: string[] = []
  const stops: PlanStop<T>[] = []
  const legs: PlanLeg[] = []

  const fail = (reason: string): RoutePlan<T> => ({
    status: 'unreachable',
    reason,
    stops,
    legs,
    arrivalPercent: null,
    totalChargingMinutes: sumMinutes(stops),
    warnings,
    usableRangeKm: round(usableRangeKm),
  })

  if (!(kmPerPercent > 0) || !(totalDistanceKm > 0)) {
    return fail('We do not have a range for this car, so we cannot plan its charging.')
  }

  /*
    Every listed charger the car can use, placed on the journey. The corridor
    test (route-corridor.ts) keeps out anything behind the start, past the
    destination or too far to the side to be "on the way". Road km along the
    journey are approximated as the fraction along the straight line times the
    road distance.

    The sideways distance is deliberately NOT added as a detour. The road
    distance already includes the road's own bends, and a charger 80 km off the
    straight line is very often ON the road — the M-2 swings that far west
    through Bhera. Counting it there and back made every motorway service
    area look out of reach. The cost is that a charger genuinely off the road
    is undercounted by its detour, which the 10% reserve is there to absorb.
  */
  const candidates: Candidate<T>[] = stationsAlongRoute(
    input.origin,
    input.destination,
    input.stations,
    (station) => station.coordinates,
  )
    .map((c) => {
      const fit = bestFit(vehicle, c.item.connectors)
      return fit
        ? { station: c.item, atKm: c.along * totalDistanceKm, fit }
        : null
    })
    .filter((c): c is Candidate<T> => c !== null)
    .sort((a, b) => a.atKm - b.atKm)

  let soc = start
  let positionKm = 0
  let fromLabel = originName
  // A stop bumped to 100% once to bridge a gap is not bumped again.
  let bumped = false

  for (let guard = 0; guard < 50; guard += 1) {
    const toDestinationKm = totalDistanceKm - positionKm
    const needPercent = toDestinationKm / kmPerPercent

    // ── The rest of the trip fits in the battery, with the reserve kept.
    if (soc - needPercent >= RESERVE_PERCENT) {
      const arrival = soc - needPercent
      legs.push({ from: fromLabel, to: destinationName, km: round(toDestinationKm), startPercent: round(soc), endPercent: round(arrival) })
      return {
        status: 'ok',
        reason: null,
        stops,
        legs,
        arrivalPercent: round(arrival),
        totalChargingMinutes: sumMinutes(stops),
        warnings,
        usableRangeKm: round(usableRangeKm),
      }
    }

    // ── It does not. Find the furthest usable charger in reach.
    const reachKm = (soc - RESERVE_PERCENT) * kmPerPercent
    const inReach = candidates.filter((c) => {
      if (c.atKm < positionKm + MIN_STOP_GAP_KM) return false
      const legKm = c.atKm - positionKm
      return legKm <= reachKm
    })
    let next = inReach[inReach.length - 1]

    /*
      A hop that barely moves the car is a worse plan than a fuller charge at
      the stop before. If the furthest charger in reach is less than a quarter of
      a full battery away, and charging the last stop to 100% would get further
      (to the destination or to a later charger), prefer that — the bump below
      does it. Without this, a Multan stop at 80% was followed by a second stop
      41 km later.
    */
    const lastStop = stops[stops.length - 1]
    if (next && lastStop && !bumped && lastStop.departureBatteryPercent < 100) {
      const nextAtKm = next.atKm
      const hop = nextAtKm - positionKm
      const fullReachKm = (100 - RESERVE_PERCENT) * kmPerPercent
      const fullGetsFurther =
        totalDistanceKm - positionKm <= fullReachKm ||
        candidates.some((c) => c.atKm > nextAtKm && c.atKm - positionKm <= fullReachKm)
      if (hop < usableRangeKm / 4 && fullGetsFurther) next = undefined
    }

    if (!next) {
      // A previous stop charged only to 80%: try once more as if it went to
      // 100%, which is what a driver facing a long gap would do.
      const last = stops[stops.length - 1]
      if (last && !bumped && last.departureBatteryPercent < 100) {
        bumped = true
        const extra = recharge(vehicle, last.arrivalBatteryPercent, 100, last)
        last.departureBatteryPercent = 100
        last.chargingTimeMinutes = extra
        soc = 100
        warnings.push(`Charge to 100% at ${last.station.name}: from there an 80% charge would not reach the next charger, or only one a short hop away.`)
        continue
      }

      // Not reachable even dipping into the reserve? Then say why plainly.
      if (soc - needPercent > 0) {
        // The destination is within the battery, just not above the reserve,
        // and there is no charger to top up at. That is a real trip with a
        // thin margin rather than an impossible one.
        const arrival = soc - needPercent
        legs.push({ from: fromLabel, to: destinationName, km: round(toDestinationKm), startPercent: round(soc), endPercent: round(arrival) })
        warnings.push(
          `You would arrive with about ${round(arrival)}%, below the ${RESERVE_PERCENT}% reserve this plan keeps, and there is no listed charger on the way to top up. Charge more before you set off.`,
        )
        return {
          status: 'ok',
          reason: null,
          stops,
          legs,
          arrivalPercent: round(arrival),
          totalChargingMinutes: sumMinutes(stops),
          warnings,
          usableRangeKm: round(usableRangeKm),
        }
      }

      if (stops.length === 0 && soc <= RESERVE_PERCENT) {
        return fail(
          `Starting at ${round(soc)}% leaves nothing above the ${RESERVE_PERCENT}% reserve, and no listed charger is close enough to reach. Charge before you set off.`,
        )
      }
      return fail(
        `No listed charger your car can use is within reach between ${fromLabel} and ${destinationName}. With about ${round(Math.max(0, reachKm))} km of usable charge, the next ${round(toDestinationKm)} km cannot be covered on the chargers we know of.`,
      )
    }

    // ── Drive there.
    const legKm = next.atKm - positionKm
    const arrival = soc - legKm / kmPerPercent
    legs.push({ from: fromLabel, to: next.station.name, km: round(legKm), startPercent: round(soc), endPercent: round(arrival) })

    // ── Charge only as much as is needed, and no more than the target.
    const remainingKm = totalDistanceKm - next.atKm
    const neededToFinish = remainingKm / kmPerPercent + RESERVE_PERCENT
    let departure = Math.min(TARGET_PERCENT, Math.ceil(neededToFinish))
    // Arriving above the target (a big battery, a short hop): charge to 100
    // rather than "charge" to a lower figure than the one already in the car.
    if (departure <= arrival) departure = Math.min(100, Math.max(Math.ceil(arrival) + 1, Math.ceil(neededToFinish)))

    const stop: PlanStop<T> = {
      order: stops.length + 1,
      station: next.station,
      distanceFromPreviousKm: Math.max(1, round(legKm)),
      arrivalBatteryPercent: round(arrival),
      departureBatteryPercent: round(departure),
      chargingTimeMinutes: null,
      chargeKw: next.fit.carLimitKw ? Math.min(next.fit.chargerKw, next.fit.carLimitKw) : next.fit.chargerKw,
      mode: next.fit.mode,
      note: next.fit.note,
    }
    stop.chargingTimeMinutes = recharge(vehicle, stop.arrivalBatteryPercent, stop.departureBatteryPercent, stop, next.fit)
    stops.push(stop)

    if (stop.chargingTimeMinutes === null) {
      warnings.push(`We could not estimate the charge time at ${next.station.name}.`)
    }

    soc = stop.departureBatteryPercent
    positionKm = next.atKm
    fromLabel = next.station.name
    bumped = false
  }

  return fail('This journey needs more stops than the planner will chain together.')
}

/** Minutes on the charger between two levels, or null if it cannot be estimated. */
function recharge<T extends PlanStation>(
  vehicle: PlanVehicle,
  fromPct: number,
  toPct: number,
  stop: PlanStop<T>,
  fit?: Fit,
): number | null {
  const chosen = fit ?? bestFit(vehicle, stop.station.connectors)
  if (!chosen || toPct <= fromPct) return null
  const estimate = estimateCharge({
    batteryKwh: vehicle.batteryKwh,
    fromPct: Math.max(0, fromPct),
    toPct: Math.min(100, toPct),
    mode: chosen.mode,
    chargerKw: chosen.chargerKw,
    carLimitKw: chosen.carLimitKw,
    ratePerKwh: null,
  })
  return estimate.ok ? Math.round(estimate.minutes) : null
}

function sumMinutes<T extends PlanStation>(stops: PlanStop<T>[]): number {
  return stops.reduce((sum, stop) => sum + (stop.chargingTimeMinutes ?? 0), 0)
}

// ─── Where the journey starts and ends ──────────────────────────────

/**
 * Straight-line kilometres to road kilometres.
 *
 * Roads bend. Checked against the distances recorded by hand in
 * route-distances.ts, the ratio sits a little over 1.2 on the motorway runs and
 * higher into the hills; 1.25 is the middle of that and is only used for a pair
 * the table does not hold.
 */
export const ROAD_WINDING_FACTOR = 1.25

export type Journey =
  | { ok: true; origin: Coordinates; destination: Coordinates; totalDistanceKm: number }
  | { ok: false; message: string }

/**
 * The two ends of a trip and the road distance between them.
 *
 * A known city pair gets the distance recorded by hand, so the journey a route
 * card advertised is the journey that comes back; any other pair of mapped
 * cities gets the straight line opened out by the winding factor. A place we do
 * not have coordinates for is an error, never a guessed distance.
 */
export function resolveJourney(
  originName: string,
  destinationName: string,
  lookup: (name: string) => Coordinates | null,
  roadDistance: (from: string, to: string) => number | null,
  haversine: (a: Coordinates, b: Coordinates) => number,
): Journey {
  const origin = lookup(originName)
  const destination = lookup(destinationName)
  if (!origin || !destination) {
    return {
      ok: false,
      message: `We do not have ${!origin ? originName.trim() : destinationName.trim()} on the map yet, so we cannot work out this journey.`,
    }
  }
  const totalDistanceKm =
    roadDistance(originName, destinationName) ?? Math.round(haversine(origin, destination) * ROAD_WINDING_FACTOR)
  if (!(totalDistanceKm > 0)) {
    return { ok: false, message: 'Pick two different places to plan a journey between.' }
  }
  return { ok: true, origin, destination, totalDistanceKm }
}

// ─── The planner's car ──────────────────────────────────────────────

/**
 * A catalogue car as the planner needs it: the selector's EVModel plus the two
 * charging figures kept apart.
 *
 * EVModel folds them into one `chargingSpeedKw` ("peak DC where the car has
 * it, AC otherwise"), which is how an AC-only car came to be planned as if it
 * fast-charged. Null means the catalogue has no figure — for DC that is read as
 * "cannot DC-charge", which is what a missing DC figure means for every car in
 * the catalogue that lacks one.
 */
export interface RouteVehicle extends EVModel {
  dcKw: number | null
  acKw: number | null
}

export function toPlanVehicle(vehicle: RouteVehicle): PlanVehicle {
  return {
    rangeKm: vehicle.rangeKm,
    batteryKwh: vehicle.batteryCapacityKwh,
    dcKw: vehicle.dcKw,
    acKw: vehicle.acKw,
    connectorTypes: vehicle.connectorTypes,
  }
}

/** "BYD Atto 3" — the name shown on a result and stored with a saved route. */
export function vehicleName(vehicle: Pick<EVModel, 'make' | 'model'>): string {
  return `${vehicle.make} ${vehicle.model}`
}

/**
 * "a" or "an" before a car name, by sound: "an MG ZS EV", "an Ioniq 5",
 * "a BYD Seal". Initialisms that open with a vowel sound (M, N, F…) take "an".
 */
export function withArticle(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? ''
  const vowelSound =
    /^[aeiou]/i.test(first) ||
    (/^[A-Z]{2,}$/.test(first.replace(/[^A-Za-z]/g, '')) && /^[AEFHILMNORSX]/.test(first))
  return `${vowelSound ? 'an' : 'a'} ${name}`
}

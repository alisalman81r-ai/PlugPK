// src/hooks/useRoutePlanner.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { getCityCoordinates } from '@/lib/city-coordinates'
import { MOCK_EV_MODELS, MOCK_STATIONS } from '@/lib/mock-data'
import { estimateDriveMinutes, getRoadDistanceKm } from '@/lib/route-distances'
import {
  haversineKm,
  spreadStopsAlongRoute,
  stationsAlongRoute,
} from '@/lib/route-corridor'
import type { EVModel, PlannedRoute, RouteStop } from '@/lib/types'

/**
 * Straight-line kilometres to road kilometres.
 *
 * Roads bend. Checked against the distances already recorded by hand in
 * route-distances.ts, the ratio across those pairs sits a little over 1.2 on
 * the motorway runs and higher into the hills; 1.25 is the middle of that and
 * is only ever used for a pair the table does not hold.
 */
const ROAD_WINDING_FACTOR = 1.25

const DEPARTURE_BATTERY = 80
const LEG_CONSUMPTION_PERCENT = 25
const MIN_ARRIVAL_BATTERY = 10

export interface UseRoutePlannerReturn {
  origin: string
  destination: string
  selectedVehicle: EVModel | null
  batteryPercent: number
  setOrigin: (value: string) => void
  setDestination: (value: string) => void
  setSelectedVehicle: (value: EVModel | null) => void
  setBatteryPercent: (value: number) => void
  swapLocations: () => void

  plannedRoute: PlannedRoute | null
  isCalculating: boolean
  hasCalculated: boolean
  error: string | null
  canCalculate: boolean

  calculateRoute: () => Promise<void>
  resetRoute: () => void
  saveRoute: () => void
  isSaved: boolean
}

/**
 * How many charging stops a journey needs.
 *
 * Was a flat three for anything over 400 km, which put the same two-and-a-bit
 * hours of charging on a 450 km run and on the 1,215 km to Karachi. It scales
 * past that band now — roughly a stop every 350 km, which is what a 400 km-range
 * car driven between 10% and 80% actually manages.
 *
 * This is what the journey NEEDS. What it gets is however many of those the
 * corridor actually holds, which is often fewer: the cap used to be the total
 * number of stations in the country, which meant nothing once the stops had to
 * be on the way.
 */
function stopCountForDistance(distanceKm: number): number {
  if (distanceKm < 300) return 1
  if (distanceKm <= 400) return 2
  return Math.ceil(distanceKm / 350)
}

/**
 * Rough charge duration: the energy needed to climb from arrival to departure
 * state of charge, delivered at the vehicle's peak DC rate, then padded for the
 * taper every real charging curve has. Clamped to a believable 20–45 minutes.
 */
function estimateChargingMinutes(vehicle: EVModel, arrivalPercent: number): number {
  const deltaPercent = Math.max(DEPARTURE_BATTERY - arrivalPercent, 5)
  const kWhNeeded = (vehicle.batteryCapacityKwh * deltaPercent) / 100
  const effectiveKw = Math.max(vehicle.chargingSpeedKw * 0.6, 20)
  const minutes = (kWhNeeded / effectiveKw) * 60
  return Math.round(Math.min(Math.max(minutes, 20), 45))
}

export function useRoutePlanner(): UseRoutePlannerReturn {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<EVModel | null>(null)
  const [batteryPercent, setBatteryPercent] = useState(80)

  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const canCalculate = useMemo(
    () => origin.trim() !== '' && destination.trim() !== '' && selectedVehicle !== null,
    [origin, destination, selectedVehicle],
  )

  const swapLocations = useCallback(() => {
    setOrigin(destination)
    setDestination(origin)
  }, [origin, destination])

  const calculateRoute = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      setError('Enter both a starting point and a destination.')
      return
    }
    if (!selectedVehicle) {
      setError('Select your EV so we can size the charging stops.')
      return
    }

    setError(null)
    setIsCalculating(true)

    const originAt = getCityCoordinates(origin)
    const destinationAt = getCityCoordinates(destination)

    /**
     * How long the journey is.
     *
     * A known city pair gets the road distance recorded by hand, so the
     * journey a route card advertised is the journey that comes back. A pair
     * that is not in the table but whose cities are both on the map gets the
     * straight-line distance opened out by the winding factor.
     *
     * It used to fall back to `250 + Math.random() * 200`, which is why
     * Islamabad to Murree and Lahore to Karachi could come back the same
     * length. Nothing here is random any more.
     */
    const straightLineKm =
      originAt && destinationAt ? haversineKm(originAt, destinationAt) : null
    const totalDistanceKm =
      getRoadDistanceKm(origin, destination) ??
      (straightLineKm !== null ? Math.round(straightLineKm * ROAD_WINDING_FACTOR) : null)

    if (totalDistanceKm === null) {
      setError(
        `We do not have ${!originAt ? origin.trim() : destination.trim()} on the map yet, so we cannot work out this journey.`,
      )
      setIsCalculating(false)
      return
    }

    const estimatedDriveTimeMinutes = estimateDriveMinutes(totalDistanceKm)

    /*
      ── The stops, chosen because they are on the way ──────────────────

      Every station is placed against the line between the two cities: how far
      to the side of it, and how far along it. Anything outside the corridor,
      behind the start or past the destination is dropped, and what survives is
      spread across the journey rather than taken in the order it happens to
      appear.

      This replaces `[...MOCK_STATIONS].sort(() => Math.random() - 0.5)`, which
      is what sent a Faisalabad-to-Murree run to charge in Lahore.
    */
    const corridor =
      originAt && destinationAt
        ? stationsAlongRoute(
            originAt,
            destinationAt,
            MOCK_STATIONS,
            (station) => station.coordinates,
          )
        : []

    const wanted = stopCountForDistance(totalDistanceKm)
    const picked = spreadStopsAlongRoute(corridor, wanted)

    const stops: RouteStop[] = []
    let batteryOnArrival = batteryPercent
    let previousAlong = 0

    for (const [index, candidate] of picked.entries()) {
      const arrivalBatteryPercent = Math.max(
        batteryOnArrival - LEG_CONSUMPTION_PERCENT,
        MIN_ARRIVAL_BATTERY,
      )
      const chargingTimeMinutes = estimateChargingMinutes(selectedVehicle, arrivalBatteryPercent)

      stops.push({
        order: index + 1,
        station: candidate.item,
        arrivalBatteryPercent,
        departureBatteryPercent: DEPARTURE_BATTERY,
        chargingTimeMinutes,
        // The real gap to the stop before, from how far apart they fall along
        // the journey — not the total divided by the number of stops.
        distanceFromPreviousKm: Math.max(
          1,
          Math.round((candidate.along - previousAlong) * totalDistanceKm),
        ),
      })

      previousAlong = candidate.along
      batteryOnArrival = DEPARTURE_BATTERY
    }

    const totalChargingTimeMinutes = stops.reduce((sum, stop) => sum + stop.chargingTimeMinutes, 0)

    setPlannedRoute({
      id: `route-${origin.trim().toLowerCase()}-${destination.trim().toLowerCase()}`,
      origin: origin.trim(),
      destination: destination.trim(),
      totalDistanceKm,
      estimatedDriveTimeMinutes,
      totalChargingTimeMinutes,
      stops,
      vehicle: selectedVehicle,
    })

    setIsCalculating(false)
    setHasCalculated(true)
  }, [origin, destination, selectedVehicle, batteryPercent])

  const resetRoute = useCallback(() => {
    setPlannedRoute(null)
    setHasCalculated(false)
    setIsSaved(false)
    setError(null)
  }, [])

  const saveRoute = useCallback(() => {
    setIsSaved(true)
  }, [])

  return {
    origin,
    destination,
    selectedVehicle,
    batteryPercent,
    setOrigin,
    setDestination,
    setSelectedVehicle,
    setBatteryPercent,
    swapLocations,
    plannedRoute,
    isCalculating,
    hasCalculated,
    error,
    canCalculate,
    calculateRoute,
    resetRoute,
    saveRoute,
    isSaved,
  }
}

/** Vehicles offered in the selector, grouped by make in the UI. */
export const ROUTE_VEHICLES: EVModel[] = MOCK_EV_MODELS

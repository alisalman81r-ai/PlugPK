// src/hooks/useRoutePlanner.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { getCityCoordinates } from '@/lib/city-coordinates'
import { haversineKm } from '@/lib/route-corridor'
import { estimateDriveMinutes, getRoadDistanceKm } from '@/lib/route-distances'
import {
  planRoute,
  resolveJourney,
  toPlanVehicle,
  type RoutePlan,
  type RouteVehicle,
} from '@/lib/route-plan'
import type { Station } from '@/lib/types'

/**
 * A planned journey: where, in what, from what charge — and the plan itself.
 *
 * The charge the trip starts on is part of the result, not read back from the
 * slider. The results screen used to reconstruct it as "first stop's arrival
 * + 25", which is how it came to show a number the driver never chose.
 */
export interface PlannedTrip {
  id: string
  origin: string
  destination: string
  totalDistanceKm: number
  estimatedDriveTimeMinutes: number
  totalChargingTimeMinutes: number
  vehicle: RouteVehicle
  startPercent: number
  plan: RoutePlan<Station>
}

export interface UseRoutePlannerReturn {
  origin: string
  destination: string
  selectedVehicle: RouteVehicle | null
  batteryPercent: number
  setOrigin: (value: string) => void
  setDestination: (value: string) => void
  setSelectedVehicle: (value: RouteVehicle | null) => void
  setBatteryPercent: (value: number) => void
  swapLocations: () => void

  plannedRoute: PlannedTrip | null
  isCalculating: boolean
  hasCalculated: boolean
  error: string | null
  canCalculate: boolean

  calculateRoute: () => Promise<void>
  resetRoute: () => void
  saveRoute: () => void
  /** Back to unsaved, when the account refused the save. */
  unsaveRoute: () => void
  isSaved: boolean
}

/**
 * The planner's state, around the pure planRoute in lib/route-plan.ts.
 *
 * Everything that decides a number lives there — this hook only holds the
 * form, resolves the two places, and keeps the result. It used to do the
 * planning inline, from six fixture stations, with a stop count chosen from
 * the distance alone and a flat 25% per leg; see route-plan.ts for what that
 * got wrong and what replaced it.
 *
 * `stations` is every listing the map shows (database stations plus approved
 * businesses), loaded by the /routes server page.
 */
export function useRoutePlanner(stations: readonly Station[]): UseRoutePlannerReturn {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<RouteVehicle | null>(null)
  const [batteryPercent, setBatteryPercent] = useState(80)

  const [plannedRoute, setPlannedRoute] = useState<PlannedTrip | null>(null)
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

    const journey = resolveJourney(origin, destination, getCityCoordinates, getRoadDistanceKm, haversineKm)
    if (!journey.ok) {
      setError(journey.message)
      setIsCalculating(false)
      return
    }

    const plan = planRoute({
      origin: journey.origin,
      destination: journey.destination,
      originName: origin.trim(),
      destinationName: destination.trim(),
      totalDistanceKm: journey.totalDistanceKm,
      vehicle: toPlanVehicle(selectedVehicle),
      startPercent: batteryPercent,
      stations,
    })

    setPlannedRoute({
      id: `route-${origin.trim().toLowerCase()}-${destination.trim().toLowerCase()}`,
      origin: origin.trim(),
      destination: destination.trim(),
      totalDistanceKm: journey.totalDistanceKm,
      estimatedDriveTimeMinutes: estimateDriveMinutes(journey.totalDistanceKm),
      totalChargingTimeMinutes: plan.totalChargingMinutes,
      vehicle: selectedVehicle,
      startPercent: batteryPercent,
      plan,
    })

    setIsSaved(false)
    setIsCalculating(false)
    setHasCalculated(true)
  }, [origin, destination, selectedVehicle, batteryPercent, stations])

  const resetRoute = useCallback(() => {
    setPlannedRoute(null)
    setHasCalculated(false)
    setIsSaved(false)
    setError(null)
  }, [])

  const saveRoute = useCallback(() => {
    setIsSaved(true)
  }, [])

  const unsaveRoute = useCallback(() => {
    setIsSaved(false)
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
    unsaveRoute,
    isSaved,
  }
}

// src/hooks/useRoutePlanner.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { MOCK_EV_MODELS, MOCK_STATIONS } from '@/lib/mock-data'
import type { EVModel, PlannedRoute, RouteStop } from '@/lib/types'

const AVERAGE_SPEED_KMH = 80
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

function stopCountForDistance(distanceKm: number): number {
  if (distanceKm < 300) return 1
  if (distanceKm <= 400) return 2
  return 3
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

    // Stands in for the routing API.
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const totalDistanceKm = Math.round(250 + Math.random() * 200)
    const estimatedDriveTimeMinutes = Math.round((totalDistanceKm / AVERAGE_SPEED_KMH) * 60)
    const stopCount = stopCountForDistance(totalDistanceKm)
    const legDistance = Math.round(totalDistanceKm / (stopCount + 1))

    // Pick distinct stations without mutating the source array.
    const pool = [...MOCK_STATIONS].sort(() => Math.random() - 0.5)

    const stops: RouteStop[] = []
    let batteryOnArrival = batteryPercent

    for (let index = 0; index < stopCount; index += 1) {
      const station = pool[index % pool.length]
      if (!station) break

      const arrivalBatteryPercent = Math.max(
        batteryOnArrival - LEG_CONSUMPTION_PERCENT,
        MIN_ARRIVAL_BATTERY,
      )
      const chargingTimeMinutes = estimateChargingMinutes(selectedVehicle, arrivalBatteryPercent)

      stops.push({
        order: index + 1,
        station,
        arrivalBatteryPercent,
        departureBatteryPercent: DEPARTURE_BATTERY,
        chargingTimeMinutes,
        distanceFromPreviousKm: legDistance,
      })

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

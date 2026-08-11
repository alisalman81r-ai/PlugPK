// src/hooks/useDashboard.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import { MOCK_ACTIVITY, MOCK_STATIONS, MOCK_USER, MOCK_USER_REVIEWS } from '@/lib/mock-data'
import type { ActivityItem, EVModel, Review, Station, User, UserVehicle } from '@/lib/types'

export interface DashboardStats {
  totalSaved: number
  totalReviews: number
  totalRoutes: number
  memberDays: number
}

export interface ProfileUpdate {
  name?: string
  city?: string
  avatar?: string
}

export interface UseDashboardReturn {
  user: User
  isLoading: boolean

  vehicles: UserVehicle[]
  addVehicle: (model: EVModel) => void
  removeVehicle: (vehicleId: string) => void
  setDefaultVehicle: (vehicleId: string) => void

  savedStations: Station[]
  unsaveStation: (stationId: string) => void

  userReviews: Review[]
  deleteReview: (reviewId: string) => void

  activity: ActivityItem[]

  updateProfile: (data: ProfileUpdate) => void

  stats: DashboardStats
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function useDashboard(): UseDashboardReturn {
  const [user, setUser] = useState<User>(MOCK_USER)
  const [userReviews, setUserReviews] = useState<Review[]>(MOCK_USER_REVIEWS)
  const [isLoading] = useState(false)

  const savedStations = useMemo(
    () => MOCK_STATIONS.filter((station) => user.savedStations.includes(station.id)),
    [user.savedStations],
  )

  const addVehicle = useCallback((model: EVModel) => {
    setUser((current) => {
      const vehicle: UserVehicle = {
        id: `vehicle-${current.vehicles.length + 1}-${model.id}`,
        userId: current.id,
        evModel: model,
        isDefault: current.vehicles.length === 0,
      }
      return { ...current, vehicles: [...current.vehicles, vehicle] }
    })
  }, [])

  const removeVehicle = useCallback((vehicleId: string) => {
    setUser((current) => {
      const remaining = current.vehicles.filter((vehicle) => vehicle.id !== vehicleId)
      // Removing the default promotes the next vehicle so one is always set.
      const needsDefault = remaining.length > 0 && !remaining.some((v) => v.isDefault)
      return {
        ...current,
        vehicles: needsDefault
          ? remaining.map((vehicle, index) => ({ ...vehicle, isDefault: index === 0 }))
          : remaining,
      }
    })
  }, [])

  const setDefaultVehicle = useCallback((vehicleId: string) => {
    setUser((current) => ({
      ...current,
      vehicles: current.vehicles.map((vehicle) => ({
        ...vehicle,
        isDefault: vehicle.id === vehicleId,
      })),
    }))
  }, [])

  const unsaveStation = useCallback((stationId: string) => {
    setUser((current) => ({
      ...current,
      savedStations: current.savedStations.filter((id) => id !== stationId),
    }))
  }, [])

  const deleteReview = useCallback((reviewId: string) => {
    setUserReviews((current) => current.filter((review) => review.id !== reviewId))
  }, [])

  const updateProfile = useCallback((data: ProfileUpdate) => {
    setUser((current) => ({ ...current, ...data }))
  }, [])

  const stats = useMemo<DashboardStats>(() => {
    const joined = Date.parse(user.joinedAt)
    const memberDays = Number.isFinite(joined)
      ? Math.max(Math.floor((Date.now() - joined) / MS_PER_DAY), 0)
      : 0

    return {
      totalSaved: savedStations.length,
      totalReviews: userReviews.length,
      totalRoutes: user.savedRoutes.length,
      memberDays,
    }
  }, [savedStations.length, userReviews.length, user.savedRoutes.length, user.joinedAt])

  return {
    user,
    isLoading,
    vehicles: user.vehicles,
    addVehicle,
    removeVehicle,
    setDefaultVehicle,
    savedStations,
    unsaveStation,
    userReviews,
    deleteReview,
    activity: MOCK_ACTIVITY,
    updateProfile,
    stats,
  }
}

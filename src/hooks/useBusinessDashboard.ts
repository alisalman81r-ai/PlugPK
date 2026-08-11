// src/hooks/useBusinessDashboard.ts
'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  MOCK_BUSINESS,
  MOCK_BUSINESS_ANALYTICS,
  MOCK_BUSINESS_REVIEWS,
  type BusinessAnalytics,
} from '@/lib/mock-data'
import type { Business, Connector, Review } from '@/lib/types'

export interface UseBusinessDashboardReturn {
  business: Business
  analytics: BusinessAnalytics
  isLoading: boolean

  chargers: Connector[]
  addCharger: (charger: Omit<Connector, 'id'>) => void
  updateCharger: (id: string, data: Partial<Connector>) => void
  removeCharger: (id: string) => void
  toggleChargerStatus: (id: string) => void

  updateProfile: (data: Partial<Business>) => void

  businessReviews: Review[]

  totalViews: number
  totalClicks: number
  conversionRate: string
  viewsGrowth: number
  clicksGrowth: number
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function useBusinessDashboard(): UseBusinessDashboardReturn {
  const [business, setBusiness] = useState<Business>(MOCK_BUSINESS)
  const [chargers, setChargers] = useState<Connector[]>(
    () => MOCK_BUSINESS.stations[0]?.connectors ?? [],
  )
  const [isLoading] = useState(false)

  const analytics = MOCK_BUSINESS_ANALYTICS

  const addCharger = useCallback((charger: Omit<Connector, 'id'>) => {
    setChargers((current) => [
      ...current,
      { ...charger, id: `biz-charger-${current.length + 1}-${charger.type}` },
    ])
  }, [])

  const updateCharger = useCallback((id: string, data: Partial<Connector>) => {
    setChargers((current) =>
      current.map((charger) => (charger.id === id ? { ...charger, ...data } : charger)),
    )
  }, [])

  const removeCharger = useCallback((id: string) => {
    setChargers((current) => current.filter((charger) => charger.id !== id))
  }, [])

  const toggleChargerStatus = useCallback((id: string) => {
    setChargers((current) =>
      current.map((charger) =>
        charger.id === id
          ? { ...charger, status: charger.status === 'offline' ? 'available' : 'offline' }
          : charger,
      ),
    )
  }, [])

  const updateProfile = useCallback((data: Partial<Business>) => {
    setBusiness((current) => ({ ...current, ...data }))
  }, [])

  const totalViews = analytics.thisMonth.profileViews
  const totalClicks = analytics.thisMonth.navigateClicks

  const conversionRate = useMemo(
    () => (totalViews === 0 ? '0.0%' : `${((totalClicks / totalViews) * 100).toFixed(1)}%`),
    [totalViews, totalClicks],
  )

  const viewsGrowth = useMemo(
    () => percentChange(analytics.thisMonth.profileViews, analytics.lastMonth.profileViews),
    [analytics],
  )

  const clicksGrowth = useMemo(
    () => percentChange(analytics.thisMonth.navigateClicks, analytics.lastMonth.navigateClicks),
    [analytics],
  )

  return {
    business,
    analytics,
    isLoading,
    chargers,
    addCharger,
    updateCharger,
    removeCharger,
    toggleChargerStatus,
    updateProfile,
    businessReviews: MOCK_BUSINESS_REVIEWS,
    totalViews,
    totalClicks,
    conversionRate,
    viewsGrowth,
    clicksGrowth,
  }
}

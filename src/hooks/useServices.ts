// src/hooks/useServices.ts
'use client'

import { useMemo, useState } from 'react'

import { MOCK_SERVICES } from '@/lib/mock-data'
import type { EVService, ServiceCategory } from '@/lib/types'

export type ServiceSort = 'rating' | 'name' | 'reviews'

export interface UseServicesReturn {
  services: EVService[]
  filteredServices: EVService[]
  isLoading: boolean
  selectedCategory: ServiceCategory | 'all'
  setSelectedCategory: (category: ServiceCategory | 'all') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCity: string
  setSelectedCity: (city: string) => void
  sortBy: ServiceSort
  setSortBy: (sort: ServiceSort) => void
  totalCount: number
  categoryCount: Record<string, number>
}

export interface UseServicesOptions {
  /** Seeds from the URL so the hero's search form actually drives results. */
  initialQuery?: string
  initialCity?: string
}

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState(options.initialQuery ?? '')
  const [selectedCity, setSelectedCity] = useState(options.initialCity ?? 'all')
  const [sortBy, setSortBy] = useState<ServiceSort>('rating')
  /**
   * Filtering happens locally and synchronously, so there is nothing to wait
   * for. This previously flashed a 300ms skeleton on every keystroke and
   * every filter change, which read as lag rather than as feedback.
   *
   * The flag stays in the return type: when this becomes a real fetch, set it
   * around the request and no consuming component needs to change.
   */
  const isLoading = false

  const services = MOCK_SERVICES

  /** Counts come from the unfiltered list so tab badges never change. */
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: services.length }
    for (const service of services) {
      counts[service.category] = (counts[service.category] ?? 0) + 1
    }
    return counts
  }, [services])

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matched = services.filter((service) => {
      if (selectedCategory !== 'all' && service.category !== selectedCategory) return false
      if (selectedCity !== 'all' && service.address.city !== selectedCity) return false

      if (query.length > 0) {
        const haystack = [
          service.name,
          service.description,
          service.address.city,
          service.address.area,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })

    const sorted = [...matched]
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'reviews':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount)
      case 'rating':
      default:
        return sorted.sort((a, b) => b.rating - a.rating)
    }
  }, [services, selectedCategory, selectedCity, searchQuery, sortBy])

  return {
    services,
    filteredServices,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    sortBy,
    setSortBy,
    totalCount: services.length,
    categoryCount,
  }
}

// src/hooks/useServices.ts
'use client'

import { useEffect, useMemo, useState } from 'react'

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

const LOADING_MS = 300

export function useServices(): UseServicesReturn {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [sortBy, setSortBy] = useState<ServiceSort>('rating')
  const [isLoading, setIsLoading] = useState(false)

  const services = MOCK_SERVICES

  // Brief skeleton pass whenever the query changes, so swapping this for a
  // real fetch later needs no other change.
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), LOADING_MS)
    return () => clearTimeout(timer)
  }, [selectedCategory, searchQuery, selectedCity])

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

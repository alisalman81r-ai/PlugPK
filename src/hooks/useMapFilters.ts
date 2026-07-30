// src/hooks/useMapFilters.ts
'use client'

import { useCallback, useState } from 'react'

export interface UseMapFiltersReturn {
  isFilterOpen: boolean
  openFilters: () => void
  closeFilters: () => void
  toggleFilters: () => void
  isMobileSheetOpen: boolean
  openMobileSheet: () => void
  closeMobileSheet: () => void
}

export function useMapFilters(): UseMapFiltersReturn {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)

  const openFilters = useCallback(() => setIsFilterOpen(true), [])
  const closeFilters = useCallback(() => setIsFilterOpen(false), [])
  const toggleFilters = useCallback(() => setIsFilterOpen((open) => !open), [])

  const openMobileSheet = useCallback(() => setIsMobileSheetOpen(true), [])
  const closeMobileSheet = useCallback(() => setIsMobileSheetOpen(false), [])

  return {
    isFilterOpen,
    openFilters,
    closeFilters,
    toggleFilters,
    isMobileSheetOpen,
    openMobileSheet,
    closeMobileSheet,
  }
}

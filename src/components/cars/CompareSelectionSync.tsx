// src/components/cars/CompareSelectionSync.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { readComparedIds, writeComparedIds } from './compare-selection'

/**
 * Keeps the comparison page and the remembered selection in step. Renders
 * nothing.
 *
 *   - With ids in the URL, they become the remembered selection, so a car
 *     added or removed here is still picked when the visitor goes back to
 *     the catalogue — and a shared link seeds the recipient's tray.
 *   - With none, a remembered selection is restored into the URL, so
 *     /cars/compare opened from the nav or a bookmark shows the cars the
 *     visitor picked instead of an empty state.
 *
 * `ids` are the ones the server resolved to real cars, so a delisted car is
 * dropped from storage too rather than lingering in the tray.
 */
export function CompareSelectionSync({ ids, requested }: { ids: string[]; requested: boolean }) {
  const router = useRouter()
  const key = ids.join(',')

  React.useEffect(() => {
    // The URL named cars, so it wins — even when none of them resolved.
    // Restoring in that case could bounce between two dead selections forever.
    if (requested) {
      writeComparedIds(ids)
      return
    }
    const remembered = readComparedIds()
    if (remembered.length > 0) router.replace(`/cars/compare?ids=${remembered.join(',')}`)
    // `key` stands in for `ids`, whose identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, requested, router])

  return null
}

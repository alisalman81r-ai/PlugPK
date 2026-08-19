// src/components/business/BusinessViewTracker.tsx
'use client'

import * as React from 'react'

import { recordBusinessView } from '@/lib/db/business-actions'

export interface BusinessViewTrackerProps {
  businessId: string
}

/**
 * Records that someone opened this listing.
 *
 * A client component rather than a call inside the server render, for two
 * reasons. The detail page is prerendered, so counting during render would
 * credit the build with a visit nobody made; and a render can run more than
 * once for a single visit. Mounting in the browser means one count per person
 * who actually opened the page.
 *
 * It renders nothing and never blocks — if the call fails the page is
 * unaffected, because a missed count matters far less than a broken listing.
 */
export function BusinessViewTracker({ businessId }: BusinessViewTrackerProps) {
  const counted = React.useRef(false)

  React.useEffect(() => {
    // Strict Mode mounts effects twice in development. Without this guard the
    // owner's view count would read double locally and single in production,
    // which is the sort of discrepancy that wastes an afternoon.
    if (counted.current) return
    counted.current = true

    void recordBusinessView(businessId).catch(() => {})
  }, [businessId])

  return null
}

'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

export function CommunityViewedRefresh() {
  const router = useRouter()

  React.useEffect(() => {
    router.refresh()
  }, [router])

  return null
}
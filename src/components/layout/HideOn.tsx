// src/components/layout/HideOn.tsx
'use client'

import { usePathname } from 'next/navigation'
import * as React from 'react'

/**
 * Renders its children except under the given route prefixes. The account
 * pages (/dashboard) have no footer in the design, so the (main) layout wraps
 * the footer in this.
 */
export function HideOn({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const pathname = usePathname()
  if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null
  return <>{children}</>
}

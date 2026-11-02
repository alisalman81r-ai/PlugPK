// src/hooks/useMyCar.ts
'use client'

import * as React from 'react'

/**
 * The signed-in driver's own car — the primary in their garage — so every car
 * tool on the site can start with it instead of asking again.
 *
 * `undefined` while it is being asked, `null` when nobody is signed in or the
 * garage is empty. One request per page, however many tools ask: the answer
 * is shared by every caller until the page is left.
 */

export interface MyCar {
  slug: string
  name: string
}

let pending: Promise<MyCar | null> | null = null
let askedAt = 0
/**
 * Long enough for every tool on one page to share a request, short enough
 * that a car changed on the dashboard is picked up on the next page — the
 * site navigates without reloading, so a cache kept for the visit would not be.
 */
const SHARE_MS = 5000

function loadMyCar(): Promise<MyCar | null> {
  if (!pending || Date.now() - askedAt > SHARE_MS) {
    askedAt = Date.now()
    pending = fetch('/api/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((body: { user?: { car?: MyCar | null } | null }) => body.user?.car ?? null)
      .catch(() => null)
  }
  return pending
}

export function useMyCar(): MyCar | null | undefined {
  const [car, setCar] = React.useState<MyCar | null | undefined>(undefined)
  React.useEffect(() => {
    let live = true
    void loadMyCar().then((found) => {
      if (live) setCar(found)
    })
    return () => {
      live = false
    }
  }, [])
  return car
}

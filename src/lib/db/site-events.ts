// src/lib/db/site-events.ts
import 'server-only'

import { randomUUID } from 'node:crypto'

import { headers } from 'next/headers'

import { prisma } from './client'

/**
 * The website's half of the member timeline.
 *
 * The app logs each action itself in /api/app/* (recordAppEvent, source
 * 'app'). Those routes call the same server actions the website does, so the
 * actions cannot simply log everything — every app action would appear twice.
 * Instead an action logs only when it was invoked as a Server Action from a
 * browser page, which Next marks with the `Next-Action` request header; a
 * route handler calling the function directly never carries it.
 *
 * Never throws: a failed log must not fail the action it describes.
 */

export interface SiteEventInput {
  /** Who did it. Null for a visitor who was not signed in. */
  userId?: string | null
  type: string
  targetType?: string
  targetId?: string | null
  /**
   * The line the admin reads. Given the member's name ("Someone" when signed
   * out) so it is written the way the app's events are: "Ayesha posted …".
   */
  summary: (who: string) => string
  /** Name to use when there is no account (e.g. typed into a public form). */
  fallbackName?: string
}

/** Whether this request is a Server Action from a website page (not the app's API). */
export function isWebsiteRequest(): boolean {
  return fromWebsite()
}

function fromWebsite(): boolean {
  try {
    return headers().get('next-action') !== null
  } catch {
    // Outside a request (scripts, tests): nothing to attribute.
    return false
  }
}

export async function recordSiteEvent(event: SiteEventInput): Promise<void> {
  if (!fromWebsite()) return
  try {
    const user = event.userId
      ? await prisma.user.findUnique({ where: { id: event.userId }, select: { name: true, email: true } })
      : null
    const who = user?.name ?? event.fallbackName ?? 'Someone'
    await prisma.appEvent.create({
      data: {
        id: randomUUID(),
        source: 'web',
        userId: event.userId ?? null,
        userEmail: user?.email ?? null,
        type: event.type,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        summary: event.summary(who).slice(0, 300),
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[site-events] could not record event', event.type, error)
  }
}

// src/lib/db/route-actions.ts
'use server'

import { randomUUID } from 'node:crypto'


import { revalidatePath } from 'next/cache'

import { getSessionUserId } from './session'

import { prisma } from './client'

/**
 * Saved routes: keep a planned trip on the account, list it, remove it.
 *
 * What is stored is a snapshot of the plan (see SavedRoute in the schema).
 * Opening one goes back to /routes with origin, destination, car and battery
 * in the URL, and the planner works it out again from today's chargers.
 */

export interface SaveRouteInput {
  origin: string
  destination: string
  carId: string | null
  carName: string
  batteryPercent: number
  distanceKm: number
  durationMin: number
  stops: number
}

export interface RouteResult {
  ok: boolean
  message?: string
  id?: string
}

const MAX_ROUTES = 50

function currentUserId(): Promise<string | null> {
  return getSessionUserId()
}

// A non-number (NaN from a hand-built request) clamps to the minimum rather
// than reaching the insert, where it would throw.
const clamp = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min

export async function saveMyRoute(input: SaveRouteInput): Promise<RouteResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Sign in to save a route.' }

  if (!input || typeof input.origin !== 'string' || typeof input.destination !== 'string') {
    return { ok: false, message: 'This route has no start or destination.' }
  }
  const carId = typeof input.carId === 'string' && input.carId.length <= 100 ? input.carId : null
  const carName = typeof input.carName === 'string' ? input.carName.trim().slice(0, 120) : ''
  const origin = input.origin.trim().slice(0, 120)
  const destination = input.destination.trim().slice(0, 120)
  if (!origin || !destination) return { ok: false, message: 'This route has no start or destination.' }

  const id = randomUUID()
  // One statement: the cap check and the insert together, one round trip.
  const inserted = await prisma.$executeRaw`
    INSERT INTO "SavedRoute"
      ("id", "userId", "origin", "destination", "carId", "carName", "batteryPercent", "distanceKm", "durationMin", "stops", "createdAt")
    SELECT ${id}, ${userId}, ${origin}, ${destination}, ${carId}, ${carName},
      ${clamp(input.batteryPercent, 0, 100)}, ${clamp(input.distanceKm, 0, 5000)}, ${clamp(input.durationMin, 0, 10000)},
      ${clamp(input.stops, 0, 50)}, now()
    WHERE (SELECT count(*) FROM "SavedRoute" WHERE "userId" = ${userId}) < ${MAX_ROUTES}`
  if (!inserted) return { ok: false, message: `You can keep up to ${MAX_ROUTES} routes. Remove one first.` }

  revalidatePath('/dashboard/routes')
  return { ok: true, id }
}

export async function removeMyRoute(id: string): Promise<RouteResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Sign in first.' }
  await prisma.savedRoute.deleteMany({ where: { id, userId } })
  return { ok: true }
}

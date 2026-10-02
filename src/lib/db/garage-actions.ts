// src/lib/db/garage-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { USER_COOKIE_NAME, readUserSession } from '@/lib/user-auth'

import { prisma } from './client'
import { LEGACY_ID, mirrorCar } from './garage'

/**
 * Add, swap, remove and promote the cars on the signed-in account.
 *
 * ── Why each one is a single statement ────────────────────────────────
 *
 * The database is a region away: one round trip costs ~0.8s from Pakistan.
 * The first version of these did seven or eight queries in a row — look up the
 * car, mirror it, check for a duplicate, update, re-read the garage, fix the
 * primary flag, copy the name onto the account — so swapping a car took seven
 * seconds. Each action below is now one SQL statement: the write, the primary
 * bookkeeping and the account's `vehicle` name happen together, in one trip
 * and atomically.
 *
 * UserVehicle points at Vehicle, which mirrors the catalogue (same ids). Every
 * catalogue car is mirrored in advance; a car added to the catalogue later is
 * mirrored the first time someone picks it (the foreign-key retry below).
 *
 * The account's `vehicle` holds the primary car's name, so everything that
 * already reads it keeps working without knowing about the garage.
 */

export interface GarageResult {
  ok: boolean
  message?: string
  /** For an add: the new row's id, so the page can swap its placeholder. */
  id?: string
}

const MAX_CARS = 10

function currentUserId(): string | null {
  return readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
}

/**
 * The overview and settings show the primary car. The vehicles page itself
 * is not revalidated: it already shows the change, and revalidating the page
 * an action was called from makes the response carry a full re-render of it
 * (the 104-car catalogue included), which is what made each pick slow.
 */
function done(extra?: Partial<GarageResult>): GarageResult {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { ok: true, ...extra }
}

const isUniqueViolation = (error: unknown) => (error as { code?: string })?.code === '23505' || String(error).includes('23505')
const isForeignKeyViolation = (error: unknown) => (error as { code?: string })?.code === '23503' || String(error).includes('23503')

/** Runs a statement; if the car has no Vehicle mirror yet, makes one and retries once. */
async function withMirror<T>(carId: string, statement: () => Promise<T>): Promise<T> {
  try {
    return await statement()
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error
    if (!(await mirrorCar(carId))) throw error
    return statement()
  }
}

export async function addMyCar(carId: string): Promise<GarageResult> {
  const userId = currentUserId()
  if (!userId) return { ok: false, message: 'Sign in to add a car.' }
  const id = randomUUID()

  try {
    // Insert (first car becomes primary, capped at MAX_CARS) and, if it is the
    // primary, put its name on the account — one statement.
    const rows = await withMirror(carId, () =>
      prisma.$queryRaw<{ n: number }[]>`
        WITH c AS (SELECT count(*)::int AS n FROM "UserVehicle" WHERE "userId" = ${userId}),
        ins AS (
          INSERT INTO "UserVehicle" ("id", "userId", "vehicleId", "isDefault", "createdAt")
          SELECT ${id}, ${userId}, ${carId}, (SELECT n FROM c) = 0, now()
          WHERE (SELECT n FROM c) < ${MAX_CARS}
          RETURNING "isDefault"
        ),
        acct AS (
          UPDATE "User" SET "vehicle" = (SELECT "brand" || ' ' || "model" FROM "Vehicle" WHERE "id" = ${carId})
          WHERE "id" = ${userId} AND EXISTS (SELECT 1 FROM ins WHERE "isDefault")
          RETURNING 1
        )
        SELECT (SELECT count(*)::int FROM ins) AS n`,
    )
    if (!rows[0]?.n) return { ok: false, message: `You can keep up to ${MAX_CARS} cars.` }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: 'That car is already in your list.' }
    if (isForeignKeyViolation(error)) return { ok: false, message: 'That car is not in the catalogue.' }
    throw error
  }
  return done({ id })
}

/** Swaps one car for another, keeping its place and whether it is primary. */
export async function replaceMyCar(rowId: string, carId: string): Promise<GarageResult> {
  const userId = currentUserId()
  if (!userId) return { ok: false, message: 'Sign in to change your car.' }

  // The account's old free-text car (no row yet): this pick becomes its first row.
  if (rowId === LEGACY_ID) {
    const added = await addMyCar(carId)
    return added
  }

  try {
    const rows = await withMirror(carId, () =>
      prisma.$queryRaw<{ n: number }[]>`
        WITH u AS (
          UPDATE "UserVehicle" SET "vehicleId" = ${carId}
          WHERE "id" = ${rowId} AND "userId" = ${userId}
          RETURNING "isDefault"
        ),
        acct AS (
          UPDATE "User" SET "vehicle" = (SELECT "brand" || ' ' || "model" FROM "Vehicle" WHERE "id" = ${carId})
          WHERE "id" = ${userId} AND EXISTS (SELECT 1 FROM u WHERE "isDefault")
          RETURNING 1
        )
        SELECT (SELECT count(*)::int FROM u) AS n`,
    )
    if (!rows[0]?.n) return { ok: false, message: 'That car is no longer on your account. Refresh the page.' }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: 'That car is already in your list.' }
    if (isForeignKeyViolation(error)) return { ok: false, message: 'That car is not in the catalogue.' }
    throw error
  }
  return done()
}

export async function removeMyCar(rowId: string): Promise<GarageResult> {
  const userId = currentUserId()
  if (!userId) return { ok: false, message: 'Sign in to remove a car.' }

  if (rowId === LEGACY_ID) {
    await prisma.user.update({ where: { id: userId }, data: { vehicle: null } })
    return done()
  }

  // Delete; if it was the primary, promote the oldest remaining car and put its
  // name on the account (or clear the name when no car is left). Every part of
  // one statement sees the table as it was before the delete, hence `<> rowId`.
  await prisma.$executeRaw`
    WITH d AS (
      DELETE FROM "UserVehicle" WHERE "id" = ${rowId} AND "userId" = ${userId} RETURNING "isDefault"
    ),
    nxt AS (
      SELECT "id", "vehicleId" FROM "UserVehicle"
      WHERE "userId" = ${userId} AND "id" <> ${rowId}
      ORDER BY "isDefault" DESC, "createdAt" ASC LIMIT 1
    ),
    promote AS (
      UPDATE "UserVehicle" SET "isDefault" = true
      WHERE "id" = (SELECT "id" FROM nxt) AND EXISTS (SELECT 1 FROM d WHERE "isDefault")
      RETURNING 1
    )
    UPDATE "User" SET "vehicle" = (
      SELECT v."brand" || ' ' || v."model" FROM nxt JOIN "Vehicle" v ON v."id" = nxt."vehicleId"
    )
    WHERE "id" = ${userId} AND EXISTS (SELECT 1 FROM d WHERE "isDefault")`
  return done()
}

export async function makePrimaryCar(rowId: string): Promise<GarageResult> {
  const userId = currentUserId()
  if (!userId) return { ok: false, message: 'Sign in first.' }

  const rows = await prisma.$queryRaw<{ n: number }[]>`
    WITH t AS (SELECT "vehicleId" FROM "UserVehicle" WHERE "id" = ${rowId} AND "userId" = ${userId}),
    flags AS (
      UPDATE "UserVehicle" SET "isDefault" = ("id" = ${rowId})
      WHERE "userId" = ${userId} AND EXISTS (SELECT 1 FROM t)
      RETURNING 1
    ),
    acct AS (
      UPDATE "User" SET "vehicle" = (SELECT v."brand" || ' ' || v."model" FROM t JOIN "Vehicle" v ON v."id" = t."vehicleId")
      WHERE "id" = ${userId} AND EXISTS (SELECT 1 FROM t)
      RETURNING 1
    )
    SELECT (SELECT count(*)::int FROM t) AS n`
  if (!rows[0]?.n) return { ok: false, message: 'That car is no longer on your account. Refresh the page.' }
  return done()
}

/**
 * Onboarding's pick: the catalogue car becomes the primary, added if it is not
 * on the account yet. Not on the hot path, so plain queries are fine here.
 */
export async function setPrimaryCatalogueCar(carId: string): Promise<GarageResult> {
  const userId = currentUserId()
  if (!userId) return { ok: false, message: 'Sign in to save your vehicle.' }
  if (!(await mirrorCar(carId))) return { ok: false, message: 'That car is not in the catalogue.' }

  let row = await prisma.userVehicle.findFirst({ where: { userId, vehicleId: carId } })
  if (!row) row = await prisma.userVehicle.create({ data: { id: randomUUID(), userId, vehicleId: carId } })
  const made = await makePrimaryCar(row.id)
  return made.ok ? done() : made
}

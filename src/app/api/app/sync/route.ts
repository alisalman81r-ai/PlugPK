// src/app/api/app/sync/route.ts
//
// Every write the mobile app makes, one `type` at a time: saved stations,
// garage, clubs, posts, comments, likes, reviews, routes, partner meeting
// requests and the profile photo. Each one goes through the website's own
// server action — the same validation, rate limits and revalidation — and is
// written to the admin's "Mobile app" feed (AppEvent).
//
// Toggles on the website (save, like) are sent here as the state the app wants
// ("on": true/false), so a retried request can never flip it back.

import { prisma } from '@/lib/db/client'
import { FORBIDDEN, json, recordAppEvent, sameOrigin } from '@/lib/db/app-api'
import { createComment, createPost, joinClub, leaveClub, togglePostLike } from '@/lib/db/community-actions'
import { addMyCar, removeMyCar, setPrimaryCatalogueCar } from '@/lib/db/garage-actions'
import { requestMeeting } from '@/lib/db/meeting-actions'
import { submitReview } from '@/lib/db/review-actions'
import { removeMyRoute, saveMyRoute } from '@/lib/db/route-actions'
import { getSessionUserId } from '@/lib/db/session'
import { toggleSavedStation } from '@/lib/db/session-actions'
import { removeMyAvatar, uploadMyAvatar } from '@/lib/db/upload-actions'

export const dynamic = 'force-dynamic'

type Body = Record<string, unknown>

const str = (value: unknown, max = 200) => (typeof value === 'string' ? value.slice(0, max) : '')
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const id = (value: unknown) => {
  const s = str(value, 100)
  return s && /^[\w-]+$/.test(s) ? s : ''
}

/** `data:image/jpeg;base64,…` → a File the upload action accepts. */
function fileFromDataUrl(dataUrl: string): File | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) return null
  const bytes = Buffer.from(match[2]!, 'base64')
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) return null
  const extension = match[1] === 'image/png' ? 'png' : match[1] === 'image/webp' ? 'webp' : 'jpg'
  return new File([bytes], `avatar.${extension}`, { type: match[1] })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return FORBIDDEN()

  let body: Body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, message: 'Something went wrong. Please try again.' }, 400)
  }

  const userId = await getSessionUserId()
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } })
    : null
  const log = (type: string, targetType: string, targetId: string | null | undefined, summary: string) =>
    recordAppEvent({ userId: user?.id, userEmail: user?.email, type, targetType, targetId, summary })
  const who = user?.name ?? 'Someone'

  switch (body.type) {
    // ── Saved stations ───────────────────────────────────────────────
    case 'station.save': {
      const listingId = id(body.id)
      if (!user) return json({ ok: false, message: 'Sign in to save a station.' })
      const want = body.on === true
      const has = (await prisma.savedStation.count({ where: { userId: user.id, listingId } })) > 0
      if (want !== has) {
        const result = await toggleSavedStation(listingId)
        if (!result.ok) return json(result)
      }
      await log(want ? 'station.save' : 'station.unsave', 'station', listingId, `${who} ${want ? 'saved' : 'unsaved'} a station`)
      return json({ ok: true })
    }

    // ── Garage: the app sends its whole list and the main car ────────
    case 'garage.set': {
      if (!user) return json({ ok: false, message: 'Sign in to keep your garage.' })
      const want = Array.isArray(body.cars) ? body.cars.map(id).filter(Boolean).slice(0, 10) : []
      const primary = id(body.primary)
      const rows = await prisma.userVehicle.findMany({ where: { userId: user.id }, select: { id: true, vehicleId: true } })
      for (const row of rows) {
        if (!want.includes(row.vehicleId)) await removeMyCar(row.id)
      }
      const have = new Set(rows.map((row) => row.vehicleId))
      for (const carId of want) {
        if (!have.has(carId)) await addMyCar(carId)
      }
      if (primary && want.includes(primary)) await setPrimaryCatalogueCar(primary)
      await log('garage.update', 'member', user.id, `${who} updated their garage (${want.length} car${want.length === 1 ? '' : 's'})`)
      return json({ ok: true })
    }

    // ── Clubs ────────────────────────────────────────────────────────
    case 'club.join':
    case 'club.leave': {
      const clubId = id(body.id)
      const result = body.type === 'club.join' ? await joinClub(clubId) : await leaveClub(clubId)
      if (result.ok) {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } })
        await log(body.type, 'club', clubId, `${who} ${body.type === 'club.join' ? 'joined' : 'left'} ${club?.name ?? 'a club'}`)
      }
      return json(result)
    }

    // ── Community ────────────────────────────────────────────────────
    case 'post.create': {
      const form = new FormData()
      form.set('title', str(body.title, 300))
      form.set('content', str(body.content, 10_000))
      form.set('category', str(body.category, 40))
      const result = await createPost(form)
      if (!result.ok || !result.slug) return json(result)
      const post = await prisma.communityPost.findUnique({ where: { slug: result.slug }, select: { id: true, title: true } })
      await log('post.create', 'post', post?.id, `${who} posted “${post?.title ?? ''}”`)
      return json({ ok: true, id: post?.id, slug: result.slug })
    }

    case 'comment.create': {
      const postId = id(body.postId)
      const result = await createComment(postId, str(body.text, 4_000))
      if (result.ok) {
        const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { title: true } })
        await log('comment.create', 'post', postId, `${who} replied on “${post?.title ?? 'a post'}”`)
      }
      return json(result)
    }

    case 'post.like': {
      const postId = id(body.id)
      if (!user) return json({ ok: false, message: 'Sign in to like posts.' })
      const want = body.on === true
      const has = (await prisma.postLike.count({ where: { postId, userId: user.id } })) > 0
      if (want !== has) {
        const result = await togglePostLike(postId)
        if (!result.ok) return json(result)
      }
      await log(want ? 'post.like' : 'post.unlike', 'post', postId, `${who} ${want ? 'liked' : 'unliked'} a post`)
      return json({ ok: true })
    }

    // ── Reviews ──────────────────────────────────────────────────────
    case 'review.create': {
      const stationId = id(body.stationId)
      const rating = Math.round(num(body.rating))
      const result = await submitReview('station', stationId, rating, str(body.text, 1_000), str(body.car, 120))
      if (result.ok) {
        const station = await prisma.station.findUnique({ where: { id: stationId }, select: { name: true } })
        await log('review.create', 'review', stationId, `${who} rated ${station?.name ?? 'a station'} ${rating}★`)
      }
      return json(result)
    }

    // ── Saved routes ─────────────────────────────────────────────────
    case 'route.save': {
      const result = await saveMyRoute({
        origin: str(body.from, 80),
        destination: str(body.to, 80),
        carId: id(body.carId) || null,
        carName: str(body.carName, 120) || 'No car chosen',
        batteryPercent: Math.round(num(body.start)),
        distanceKm: Math.round(num(body.km)),
        durationMin: Math.round(num(body.min)),
        stops: Math.round(num(body.stops)),
      })
      if (result.ok) await log('route.save', 'route', result.id, `${who} saved ${str(body.from, 80)} → ${str(body.to, 80)}`)
      return json(result)
    }

    case 'route.remove': {
      const routeId = id(body.sid)
      const result = await removeMyRoute(routeId)
      if (result.ok) await log('route.remove', 'route', routeId, `${who} removed a saved route`)
      return json(result)
    }

    // ── Partner Up: meeting request (no account needed) ─────────────
    case 'meeting.request': {
      const form = new FormData()
      form.set('name', str(body.name, 120))
      form.set('company', str(body.company, 160))
      form.set('email', str(body.email, 254))
      form.set('phone', str(body.phone, 40))
      form.set('note', str(body.note, 2_000))
      const result = await requestMeeting(form)
      if (result.ok) {
        await recordAppEvent({
          userId: user?.id,
          userEmail: user?.email ?? str(body.email, 254),
          type: 'meeting.request',
          targetType: 'meeting',
          summary: `${str(body.name, 120)} (${str(body.company, 160)}) asked for a partner meeting`,
        })
      }
      return json(result)
    }

    // ── Profile photo ────────────────────────────────────────────────
    case 'profile.photo': {
      const file = fileFromDataUrl(str(body.dataUrl, 3_000_000))
      if (!file) return json({ ok: false, message: 'That photo could not be used. Try another.' })
      const form = new FormData()
      form.set('file', file)
      const result = await uploadMyAvatar(form)
      if (result.ok) await log('profile.photo', 'member', user?.id, `${who} changed their profile photo`)
      return json(result)
    }

    case 'profile.photoRemove': {
      const result = await removeMyAvatar()
      if (result.ok) await log('profile.photoRemove', 'member', user?.id, `${who} removed their profile photo`)
      return json(result)
    }

    default:
      return json({ ok: false, message: 'Unknown request.' }, 400)
  }
}

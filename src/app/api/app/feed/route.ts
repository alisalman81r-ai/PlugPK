// src/app/api/app/feed/route.ts
//
// The community as it is now, for the mobile app: the latest posts with their
// replies and like counts, and each club's member count. The app ships with a
// snapshot of these (data.js) for instant, offline first paint, then swaps this
// in — so a post made on the website or another phone shows up, and an admin's
// edit or deletion reaches the app too.

import { prisma } from '@/lib/db/client'
import { json } from '@/lib/db/app-api'

export const dynamic = 'force-dynamic'

const parsePhotos = (raw: string) => {
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((p): p is string => typeof p === 'string') : []
  } catch {
    return []
  }
}
// "/images/x.jpg" → "x.jpg", as data.js stores it; uploads keep their full path.
const photo = (path: string) => path.replace(/^\/images\//, '')

export async function GET() {
  const [posts, likes, clubs, clubMembers, paidMembers] = await Promise.all([
    prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { comments: { orderBy: { createdAt: 'asc' }, take: 100 } },
    }),
    prisma.postLike.groupBy({ by: ['postId'], _count: { _all: true } }),
    prisma.club.findMany({ select: { id: true, name: true, city: true, description: true } }),
    prisma.clubMember.groupBy({ by: ['clubId'], _count: { _all: true } }),
    prisma.membership.groupBy({ by: ['scopeId'], where: { scope: 'club', status: 'active' }, _count: { _all: true } }),
  ])

  const likeCount = new Map(likes.map((row) => [row.postId, row._count._all]))
  const members = new Map(clubMembers.map((row) => [row.clubId, row._count._all]))
  const paid = new Map(paidMembers.map((row) => [row.scopeId, row._count._all]))

  return json({
    posts: posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      name: post.userName,
      car: post.userVehicle,
      title: post.title,
      body: post.content,
      category: post.category,
      photos: parsePhotos(post.photos).map(photo),
      likes: likeCount.get(post.id) ?? 0,
      date: post.createdAt,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        name: comment.userName,
        text: comment.content,
        likes: 0,
        date: comment.createdAt,
      })),
    })),
    clubs: clubs.map((club) => ({
      ...club,
      members: (members.get(club.id) ?? 0) + (paid.get(club.id) ?? 0),
    })),
  })
}

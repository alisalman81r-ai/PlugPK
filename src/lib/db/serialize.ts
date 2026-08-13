// src/lib/db/serialize.ts
import type {
  Comment as CommentRow,
  CommunityPost as PostRow,
  Connector as ConnectorRow,
  EVService as ServiceRow,
  Review as ReviewRow,
  Station as StationRow,
} from '@prisma/client'

import type {
  Amenity,
  Comment,
  CommunityPost,
  Connector,
  ConnectorStatus,
  ConnectorType,
  EVService,
  OperatingHours,
  PostCategory,
  Review,
  ServiceCategory,
  Station,
  StationStatus,
} from '@/lib/types'

/**
 * The only place database rows become domain objects.
 *
 * Everything downstream — pages, components, hooks — keeps consuming the
 * exact interfaces from src/lib/types.ts that it consumed when the data came
 * from mock-data.ts. That is what made the migration off mock data a change
 * to imports rather than a rewrite of the UI.
 *
 * Two conversions happen here and nowhere else: JSON text columns are parsed
 * back into objects, and Date columns are turned back into the ISO strings
 * the interfaces declare. Dates matter especially — a Prisma Date cannot
 * cross the server/client boundary in a Server Component payload without
 * being serialised, so leaking one would surface as a confusing runtime
 * error far from its cause.
 */

/** Parses a JSON text column, falling back rather than throwing on bad data. */
function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toConnector(row: ConnectorRow): Connector {
  return {
    id: row.id,
    type: row.type as ConnectorType,
    maxPowerKw: row.maxPowerKw,
    ports: row.ports,
    availablePorts: row.availablePorts,
    status: row.status as ConnectorStatus,
    compatibleVehicles: parseJson<string[]>(row.compatibleVehicles, []),
  }
}

export function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userAvatar: row.userAvatar ?? undefined,
    userVehicle: row.userVehicle,
    rating: row.rating,
    comment: row.comment,
    photos: parseJson<string[]>(row.photos, []),
    date: row.date.toISOString(),
    helpfulCount: row.helpfulCount,
    isVerified: row.isVerified,
  }
}

export type StationWithRelations = StationRow & {
  connectors: ConnectorRow[]
  reviews?: ReviewRow[]
}

export function toStation(row: StationWithRelations): Station {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    address: {
      street: row.street,
      area: row.area,
      city: row.city,
      province: row.province,
      country: row.country,
      postalCode: row.postalCode ?? undefined,
    },
    coordinates: { lat: row.lat, lng: row.lng },
    connectors: row.connectors.map(toConnector),
    amenities: parseJson<Amenity[]>(row.amenities, []),
    operatingHours: parseJson<OperatingHours>(row.operatingHours, {} as OperatingHours),
    photos: parseJson<string[]>(row.photos, []),
    coverPhoto: row.coverPhoto ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    status: row.status as StationStatus,
    isVerified: row.isVerified,
    network: row.network,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    businessId: row.businessId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.reviews ? { reviews: row.reviews.map(toReview) } : {}),
  }
}

export function toService(row: ServiceRow): EVService {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ServiceCategory,
    description: row.description,
    address: {
      street: row.street,
      area: row.area,
      city: row.city,
      province: row.province,
      country: row.country,
      postalCode: row.postalCode ?? undefined,
    },
    coordinates: { lat: row.lat, lng: row.lng },
    phone: row.phone,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    photos: parseJson<string[]>(row.photos, []),
    coverPhoto: row.coverPhoto ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    operatingHours: parseJson<OperatingHours>(row.operatingHours, {} as OperatingHours),
    isVerified: row.isVerified,
    createdAt: row.createdAt.toISOString(),
  }
}

export function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    userName: row.userName,
    userAvatar: row.userAvatar ?? undefined,
    content: row.content,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
  }
}

export type PostWithRelations = PostRow & { comments?: CommentRow[] }

export function toPost(row: PostWithRelations): CommunityPost {
  return {
    id: row.id,
    slug: row.slug,
    userId: row.userId,
    userName: row.userName,
    userAvatar: row.userAvatar ?? undefined,
    userVehicle: row.userVehicle ?? undefined,
    title: row.title,
    content: row.content,
    category: row.category as PostCategory,
    photos: parseJson<string[]>(row.photos, []),
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.comments ? { comments: row.comments.map(toComment) } : {}),
  }
}

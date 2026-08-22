// src/lib/db/serialize.ts
import type {
  Comment as CommentRow,
  CommunityPost as PostRow,
  Connector as ConnectorRow,
  EVService as ServiceRow,
  Review as ReviewRow,
  Station as StationRow,
  Vehicle as VehicleRow,
} from '@prisma/client'

import type { Vehicle } from '@/data/pakistanVehicles'
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

// ─── Vehicles ───────────────────────────────────────

/**
 * A catalogue row with whatever figures have been verified for it.
 *
 * Extends the static catalogue's `Vehicle` rather than redeclaring it, so the
 * module in src/data and the table stay one shape — a component can take
 * either. Every spec is optional because most rows genuinely have none, and
 * `undefined` says that where a 0 would read as "no range".
 */
export interface DbVehicle extends Vehicle {
  modelYear?: number
  rangeKm?: number
  batteryCapacityKwh?: number
  connectorTypes?: ConnectorType[]
  dcChargingKw?: number
  acChargingKw?: number
  pricePkr?: number
  imageUrl?: string
}

/** The comma-separated column, back into a list. */
function parseConnectors(value: string | null): ConnectorType[] | undefined {
  if (!value) return undefined
  const list = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) as ConnectorType[]
  return list.length > 0 ? list : undefined
}

/**
 * The unions are cast rather than validated.
 *
 * powertrain, availability and bodyType are strings in SQLite — the schema
 * notes why — and the only writers are the seed and the admin actions, both of
 * which take typed values. A runtime guard here would be a second place to
 * update every time a body type is added, for a case the type system already
 * covers at the write end.
 */
export function toVehicle(row: VehicleRow): DbVehicle {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    powertrain: row.powertrain as Vehicle['powertrain'],
    availability: row.availability as Vehicle['availability'],
    bodyType: row.bodyType as Vehicle['bodyType'],
    ...(row.modelYear !== null ? { modelYear: row.modelYear } : {}),
    ...(row.rangeKm !== null ? { rangeKm: row.rangeKm } : {}),
    ...(row.batteryCapacityKwh !== null
      ? { batteryCapacityKwh: row.batteryCapacityKwh }
      : {}),
    ...(parseConnectors(row.connectors) ? { connectorTypes: parseConnectors(row.connectors) } : {}),
    ...(row.dcChargingKw !== null ? { dcChargingKw: row.dcChargingKw } : {}),
    ...(row.acChargingKw !== null ? { acChargingKw: row.acChargingKw } : {}),
    ...(row.pricePkr !== null ? { pricePkr: row.pricePkr } : {}),
    ...(row.imageUrl !== null ? { imageUrl: row.imageUrl } : {}),
  }
}

/** A car a driver has added, with the catalogue row behind it. */
export interface OwnedVehicle {
  id: string
  userId: string
  vehicle: DbVehicle
  customName?: string
  color?: string
  licensePlate?: string
  isDefault: boolean
}

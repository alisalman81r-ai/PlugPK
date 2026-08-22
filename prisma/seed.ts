// prisma/seed.ts
//
// Moves the contents of src/lib/mock-data.ts into the database. This is the
// one-way door for the project's content: after this runs, the database is
// the source of truth and mock-data.ts is only a seed fixture.
//
// Idempotent by design — it clears the tables it owns first, so running it
// twice yields the same database rather than duplicate rows. Cascades handle
// connectors, reviews and comments, but they are deleted explicitly anyway so
// the intent is readable and the script does not depend on cascade ordering.

import { PrismaClient } from '@prisma/client'

import { pakistanEVVehicles } from '../src/data/pakistanVehicles'
import { MOCK_CLUBS, MOCK_EV_MODELS, MOCK_POSTS, MOCK_SERVICES, MOCK_STATIONS } from '../src/lib/mock-data'

const prisma = new PrismaClient()

/** Complex fields are stored whole as JSON text — see schema.prisma. */
const json = (value: unknown) => JSON.stringify(value ?? null)

async function main() {
  console.log('Clearing existing content...')
  await prisma.comment.deleteMany()
  await prisma.communityPost.deleteMany()
  await prisma.review.deleteMany()
  await prisma.connector.deleteMany()
  await prisma.station.deleteMany()
  await prisma.eVService.deleteMany()
  // Vehicle and Club are not cleared. Vehicle is restricted-on-delete from
  // UserVehicle so a car somebody owns cannot be removed from under them, and
  // Club cascades to ClubMember, which would quietly un-join every member on a
  // re-seed. Both are upserted below instead.

  console.log(`Seeding ${MOCK_STATIONS.length} stations...`)
  for (const station of MOCK_STATIONS) {
    await prisma.station.create({
      data: {
        id: station.id,
        slug: station.slug,
        name: station.name,
        description: station.description ?? null,

        street: station.address.street,
        area: station.address.area,
        city: station.address.city,
        province: station.address.province,
        country: station.address.country,
        postalCode: station.address.postalCode ?? null,

        lat: station.coordinates.lat,
        lng: station.coordinates.lng,

        amenities: json(station.amenities),
        operatingHours: json(station.operatingHours),
        photos: json(station.photos),

        coverPhoto: station.coverPhoto ?? null,
        rating: station.rating,
        reviewCount: station.reviewCount,
        status: station.status,
        isVerified: station.isVerified,
        network: station.network,
        phone: station.phone ?? null,
        website: station.website ?? null,
        businessId: station.businessId ?? null,

        createdAt: new Date(station.createdAt),
        updatedAt: new Date(station.updatedAt),

        connectors: {
          create: station.connectors.map((connector) => ({
            id: connector.id,
            type: connector.type,
            maxPowerKw: connector.maxPowerKw,
            ports: connector.ports,
            availablePorts: connector.availablePorts,
            status: connector.status,
            compatibleVehicles: json(connector.compatibleVehicles),
          })),
        },

        reviews: {
          create: (station.reviews ?? []).map((review) => ({
            id: review.id,
            userId: review.userId,
            userName: review.userName,
            userAvatar: review.userAvatar ?? null,
            userVehicle: review.userVehicle,
            rating: review.rating,
            comment: review.comment,
            photos: json(review.photos ?? []),
            date: new Date(review.date),
            helpfulCount: review.helpfulCount,
            isVerified: review.isVerified,
          })),
        },
      },
    })
  }

  console.log(`Seeding ${MOCK_SERVICES.length} services...`)
  for (const service of MOCK_SERVICES) {
    await prisma.eVService.create({
      data: {
        id: service.id,
        slug: service.slug,
        name: service.name,
        category: service.category,
        description: service.description,

        street: service.address.street,
        area: service.address.area,
        city: service.address.city,
        province: service.address.province,
        country: service.address.country,
        postalCode: service.address.postalCode ?? null,

        lat: service.coordinates.lat,
        lng: service.coordinates.lng,

        phone: service.phone,
        email: service.email ?? null,
        website: service.website ?? null,
        photos: json(service.photos),
        coverPhoto: service.coverPhoto ?? null,

        rating: service.rating,
        reviewCount: service.reviewCount,
        operatingHours: json(service.operatingHours),
        isVerified: service.isVerified,

        createdAt: new Date(service.createdAt),
      },
    })
  }

  console.log(`Seeding ${MOCK_POSTS.length} community posts...`)
  for (const post of MOCK_POSTS) {
    await prisma.communityPost.create({
      data: {
        id: post.id,
        slug: post.slug,
        userId: post.userId,
        userName: post.userName,
        userAvatar: post.userAvatar ?? null,
        userVehicle: post.userVehicle ?? null,
        title: post.title,
        content: post.content,
        category: post.category,
        photos: json(post.photos ?? []),
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),

        comments: {
          create: (post.comments ?? []).map((comment) => ({
            id: comment.id,
            userId: comment.userId,
            userName: comment.userName,
            userAvatar: comment.userAvatar ?? null,
            content: comment.content,
            likeCount: comment.likeCount,
            createdAt: new Date(comment.createdAt),
          })),
        },
      },
    })
  }

  /**
   * The vehicle catalogue.
   *
   * Upserted rather than deleted and recreated: UserVehicle points at these
   * rows, so wiping the table would either fail on the foreign key or take
   * somebody's car with it. Upsert also means a re-run picks up edits to the
   * seed module without disturbing rows nobody changed.
   *
   * Specifications come from MOCK_EV_MODELS, which carries verified figures for
   * a handful of these, matched by its vehicleId. Everything else stays NULL —
   * the catalogue would rather say nothing than guess a range.
   */
  console.log(`Seeding ${pakistanEVVehicles.length} vehicles...`)
  const specsByVehicleId = new Map(
    MOCK_EV_MODELS.filter((model) => model.vehicleId).map((model) => [model.vehicleId, model]),
  )

  for (const vehicle of pakistanEVVehicles) {
    const specs = specsByVehicleId.get(vehicle.id)

    const data = {
      brand: vehicle.brand,
      model: vehicle.model,
      powertrain: vehicle.powertrain,
      availability: vehicle.availability,
      bodyType: vehicle.bodyType,
      modelYear: specs?.year ?? null,
      rangeKm: specs?.rangeKm ?? null,
      batteryCapacityKwh: specs?.batteryCapacityKwh ?? null,
      connectors: specs ? specs.connectorTypes.join(',') : null,
      dcChargingKw: specs?.chargingSpeedKw ?? null,
      // Not in any fixture, so left unknown rather than filled with a number
      // that reads as verified.
      acChargingKw: null,
      pricePkr: null,
      imageUrl: null,
    }

    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      create: { id: vehicle.id, ...data },
      update: data,
    })
  }

  console.log(`Seeding ${MOCK_CLUBS.length} clubs...`)
  for (const club of MOCK_CLUBS) {
    const data = {
      name: club.name,
      city: club.city,
      description: club.description,
      coverPhoto: club.coverPhoto ?? null,
      memberCount: club.memberCount,
    }

    await prisma.club.upsert({
      where: { id: club.id },
      create: { id: club.id, ...data },
      update: data,
    })
  }

  const counts = {
    stations: await prisma.station.count(),
    connectors: await prisma.connector.count(),
    reviews: await prisma.review.count(),
    services: await prisma.eVService.count(),
    posts: await prisma.communityPost.count(),
    comments: await prisma.comment.count(),
    vehicles: await prisma.vehicle.count(),
    vehiclesWithSpecs: await prisma.vehicle.count({ where: { rangeKm: { not: null } } }),
    clubs: await prisma.club.count(),
  }
  console.log('Done:', counts)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

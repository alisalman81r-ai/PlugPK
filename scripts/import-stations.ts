// scripts/import-stations.ts
//
// Imports real charging stations for Pakistan from OpenChargeMap, the open
// registry of charging infrastructure, into the database.
//
// This exists because the alternative was inventing them. Generating a
// hundred plausible-looking stations with plausible names and coordinates
// would put addresses on a map that nobody can drive to — the one failure
// mode an EV charging product cannot afford. Everything this writes comes
// from OpenChargeMap and can be traced back to a record there.
//
//   1. Get a free key at https://openchargemap.org/site/develop/api
//   2. Put OPENCHARGEMAP_API_KEY=... in .env
//   3. npm run import:stations
//
// Safe to run repeatedly: stations are matched on their OpenChargeMap id, so
// a second run updates what changed rather than duplicating everything.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const API = 'https://api.openchargemap.io/v3/poi/'
const COUNTRY = 'PK'
const MAX_RESULTS = 500

/** Their connection-type ids mapped onto the five this product knows about. */
const CONNECTOR_BY_ID: Record<number, string> = {
  1: 'Type1',
  2: 'CHAdeMO',
  25: 'Type2',
  33: 'CCS2',
  32: 'CCS2',
  27: 'CCS2',
  1036: 'GBT',
  1039: 'GBT',
}

interface OcmConnection {
  ConnectionTypeID?: number
  PowerKW?: number | null
  Quantity?: number | null
  StatusType?: { IsOperational?: boolean } | null
}

interface OcmPoi {
  ID: number
  AddressInfo?: {
    Title?: string
    AddressLine1?: string | null
    Town?: string | null
    StateOrProvince?: string | null
    Postcode?: string | null
    Latitude?: number
    Longitude?: number
    ContactTelephone1?: string | null
    RelatedURL?: string | null
  } | null
  OperatorInfo?: { Title?: string | null } | null
  Connections?: OcmConnection[] | null
  StatusType?: { IsOperational?: boolean } | null
  DateLastVerified?: string | null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

async function main() {
  const key = process.env.OPENCHARGEMAP_API_KEY
  if (!key) {
    console.error(
      '\n  OPENCHARGEMAP_API_KEY is not set.\n' +
        '  Get a free key at https://openchargemap.org/site/develop/api\n' +
        '  then add it to .env and run this again.\n',
    )
    process.exit(1)
  }

  const url =
    `${API}?output=json&countrycode=${COUNTRY}&maxresults=${MAX_RESULTS}` +
    `&compact=true&verbose=false&key=${encodeURIComponent(key)}`

  console.log(`Fetching charging stations for ${COUNTRY}...`)
  const response = await fetch(url)

  if (!response.ok) {
    console.error(`  OpenChargeMap returned ${response.status}: ${await response.text()}`)
    process.exit(1)
  }

  const pois = (await response.json()) as OcmPoi[]
  console.log(`  ${pois.length} records returned.\n`)

  if (pois.length === 0) {
    console.log(
      '  Nothing to import. OpenChargeMap has no entries for this country yet,\n' +
        '  which is a real answer rather than an error — coverage there depends on\n' +
        '  people submitting stations. You can add them yourself at /admin/stations,\n' +
        '  and contribute them back at https://openchargemap.org.\n',
    )
    await prisma.$disconnect()
    return
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const poi of pois) {
    const info = poi.AddressInfo
    const name = info?.Title?.trim()
    const lat = info?.Latitude
    const lng = info?.Longitude

    // A station without a name or a position cannot be shown on a map or
    // linked to, so it is dropped rather than stored half-formed.
    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      skipped++
      continue
    }

    const id = `ocm-${poi.ID}`
    const city = info?.Town?.trim() || 'Unknown'
    const isOperational = poi.StatusType?.IsOperational !== false

    const connections = (poi.Connections ?? []).filter(
      (connection) => connection.ConnectionTypeID !== undefined,
    )

    const data = {
      slug: `${slugify(name)}-${poi.ID}`,
      name,
      description: null,
      street: info?.AddressLine1?.trim() || '',
      area: city,
      city,
      province: info?.StateOrProvince?.trim() || '',
      country: 'Pakistan',
      postalCode: info?.Postcode?.trim() || null,
      lat,
      lng,
      amenities: '[]',
      operatingHours: '{}',
      photos: '[]',
      coverPhoto: null,
      // Ratings are earned from reviews here, so an imported station starts
      // at zero rather than borrowing a score it has not been given.
      rating: 0,
      reviewCount: 0,
      status: isOperational ? 'available' : 'offline',
      isVerified: Boolean(poi.DateLastVerified),
      network: poi.OperatorInfo?.Title?.trim() || '',
      phone: info?.ContactTelephone1?.trim() || null,
      website: info?.RelatedURL?.trim() || null,
    }

    const existing = await prisma.station.findUnique({ where: { id } })

    if (existing) {
      await prisma.station.update({ where: { id }, data })
      // Connectors are replaced wholesale: the upstream record is the truth,
      // and matching them individually would need ids it does not provide.
      await prisma.connector.deleteMany({ where: { stationId: id } })
      updated++
    } else {
      await prisma.station.create({ data: { ...data, id } })
      created++
    }

    for (const [index, connection] of connections.entries()) {
      const ports = Math.max(1, connection.Quantity ?? 1)
      await prisma.connector.create({
        data: {
          id: `${id}-c${index}`,
          stationId: id,
          type: CONNECTOR_BY_ID[connection.ConnectionTypeID ?? 0] ?? 'Type2',
          maxPowerKw: connection.PowerKW ?? 0,
          ports,
          // Live availability is not in this feed. Starting at full and
          // letting an operator correct it beats inventing an occupancy.
          availablePorts: connection.StatusType?.IsOperational === false ? 0 : ports,
          status: connection.StatusType?.IsOperational === false ? 'offline' : 'available',
          compatibleVehicles: '[]',
        },
      })
    }
  }

  console.log(`  created ${created}, updated ${updated}, skipped ${skipped}`)
  console.log(`  stations in database: ${await prisma.station.count()}`)
  console.log(`  connectors in database: ${await prisma.connector.count()}\n`)
  console.log('  Data from OpenChargeMap, licensed under CC BY-SA 4.0.\n')

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})

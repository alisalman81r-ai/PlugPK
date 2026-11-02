// src/lib/db/service-owner-queries.ts
import 'server-only'

import { redirect } from 'next/navigation'

import type { OperatingHours } from '@/lib/types'

import { prisma } from './client'
import { getCurrentUser } from './session-actions'

/**
 * Reads for the services side of the business portal: the service listings an
 * account applied for, only ever the signed-in account's own.
 */

export interface OwnerService {
  id: string
  slug: string
  name: string
  category: string
  description: string
  city: string
  area: string
  street: string
  lat: number
  lng: number
  phone: string
  email: string | null
  website: string | null
  contactName: string | null
  contactRole: string | null
  whatsapp: string | null
  socialUrl: string | null
  yearEstablished: number | null
  brands: string | null
  pricing: string | null
  operatingHours: Partial<OperatingHours> | null
  status: string
  reviewNote: string | null
  createdAt: string
}

function parseHours(raw: string): Partial<OperatingHours> | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0 ? (parsed as Partial<OperatingHours>) : null
  } catch {
    return null
  }
}

export async function getOwnerServices(userId: string): Promise<OwnerService[]> {
  const rows = await prisma.eVService.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    city: row.city,
    area: row.area,
    street: row.street,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    website: row.website,
    contactName: row.contactName,
    contactRole: row.contactRole,
    whatsapp: row.whatsapp,
    socialUrl: row.socialUrl,
    yearEstablished: row.yearEstablished,
    brands: row.brands,
    pricing: row.pricing,
    operatingHours: parseHours(row.operatingHours),
    status: row.status,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
  }))
}

/** How many charger listings and service listings an account has. */
export async function countPortalSides(userId: string): Promise<{ chargers: number; services: number }> {
  const [chargers, services] = await Promise.all([
    prisma.business.count({ where: { userId } }),
    prisma.eVService.count({ where: { userId } }),
  ])
  return { chargers, services }
}

export interface ServicePortal {
  user: { id: string; name: string; email: string }
  services: OwnerService[]
  service: OwnerService
  /** The account also lists chargers, so the portal offers the switch. */
  hasChargers: boolean
}

/**
 * Gate and loader for every services page of the portal. Signed out goes to
 * sign-in and back; an account with no service listing goes to the portal's
 * front door, which offers both ways to list.
 */
export async function requireServicePortal(path: string, requested?: string | string[]): Promise<ServicePortal> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(path)}`)

  const [services, chargers] = await Promise.all([
    getOwnerServices(user.id),
    prisma.business.count({ where: { userId: user.id } }),
  ])
  const first = services[0]
  if (!first) redirect('/business')

  const wanted = Array.isArray(requested) ? requested[0] : requested
  const service = services.find((item) => item.id === wanted) ?? first
  return { user, services, service, hasChargers: chargers > 0 }
}

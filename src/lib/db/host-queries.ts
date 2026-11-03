// src/lib/db/host-queries.ts
import 'server-only'

import {
  DEFAULT_HOST_SETTINGS,
  type BookingCar,
  type BookingStatus,
  type HostSettingsView,
  type PayoutAccountView,
  type PayoutMethod,
} from '@/lib/charger-host'

import { isSampleListing } from '@/lib/sample-listings'

import { prisma } from './client'
import { getPaymentAccounts } from './listing-fee'

/**
 * Reads for running a listing: its price and booking rules, where it is paid,
 * and who has booked. Receipt and QR bytes are never selected here; each has
 * its own route that checks who is asking.
 */

/**
 * Cars a driver can pick when booking: anything with a plug and a battery size
 * on record, the same set the charging calculator offers. Five numbers a car.
 */
export async function getBookingCars(): Promise<BookingCar[]> {
  const rows = await prisma.car.findMany({
    where: { category: { in: ['EV', 'PHEV', 'REEV'] }, batteryCapacity: { gt: 0 } },
    select: { slug: true, fullName: true, brand: true, batteryCapacity: true, acCharging: true, dcCharging: true },
  })
  return rows
    .map((row) => ({
      slug: row.slug,
      name: row.fullName,
      brand: row.brand,
      batteryKwh: row.batteryCapacity as number,
      acKw: row.acCharging,
      dcKw: row.dcCharging,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))
    .map(({ brand: _brand, ...car }) => car)
}

export async function getHostSettings(businessId: string): Promise<HostSettingsView> {
  const row = await prisma.hostSettings.findUnique({ where: { businessId } })
  if (!row) return DEFAULT_HOST_SETTINGS
  return {
    pricePerKwh: row.pricePerKwh,
    bookingEnabled: row.bookingEnabled,
    bookingFee: row.bookingFee,
    slotMinutes: row.slotMinutes,
    openTime: row.openTime,
    closeTime: row.closeTime,
  }
}

export async function getPayoutAccounts(businessId: string): Promise<PayoutAccountView[]> {
  const rows = await prisma.payoutAccount.findMany({
    where: { businessId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      method: true,
      provider: true,
      accountTitle: true,
      accountNumber: true,
      iban: true,
      qrMime: true,
    },
  })
  return rows.map((row) => ({
    id: row.id,
    method: row.method as PayoutMethod,
    provider: row.provider,
    accountTitle: row.accountTitle,
    accountNumber: row.accountNumber,
    iban: row.iban,
    hasQr: Boolean(row.qrMime),
  }))
}

/**
 * What the public station page shows for a partner listing: the price, and —
 * only when the host takes bookings and has somewhere to be paid — the booking
 * terms and payout accounts. A listing that is not live shows nothing.
 */
export async function getPublicHostOffer(businessId: string): Promise<{
  settings: HostSettingsView
  accounts: PayoutAccountView[]
} | null> {
  // The station page is public and pre-rendered. If this lookup fails the
  // listing still renders, just without a price or booking panel.
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { status: true } })
    if (business?.status !== 'approved') return null
    const [settings, accounts] = await Promise.all([getHostSettings(businessId), getPayoutAccounts(businessId)])
    return { settings, accounts }
  } catch (error) {
    console.error('[host] could not load the booking offer', businessId, error)
    return null
  }
}

const BOOKING_LIST_SELECT = {
  id: true,
  businessId: true,
  stationId: true,
  chargerId: true,
  chargerLabel: true,
  date: true,
  startTime: true,
  endTime: true,
  status: true,
  fee: true,
  pricePerKwh: true,
  payMethod: true,
  payerName: true,
  reference: true,
  vehicle: true,
  fromPct: true,
  toPct: true,
  energyKwh: true,
  durationMinutes: true,
  hostNote: true,
  decidedAt: true,
  createdAt: true,
} as const

export interface BookingView {
  id: string
  businessId: string | null
  stationId: string | null
  chargerId: string
  chargerLabel: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  fee: number
  pricePerKwh: number | null
  payMethod: string
  payerName: string
  reference: string
  vehicle: string | null
  fromPct: number | null
  toPct: number | null
  energyKwh: number | null
  durationMinutes: number | null
  hostNote: string | null
  decidedAt: string | null
  createdAt: string
}

type BookingRecord = {
  [K in keyof typeof BOOKING_LIST_SELECT]: unknown
}

function toView(row: BookingRecord & { decidedAt: Date | null; createdAt: Date }): BookingView {
  return {
    ...(row as unknown as BookingView),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export interface HostBookingView extends BookingView {
  driver: { name: string; email: string }
}

/** A host's bookings from a day onwards, soonest first. */
export async function getHostBookings(businessId: string, fromDate: string): Promise<HostBookingView[]> {
  const rows = await prisma.chargerBooking.findMany({
    where: { businessId, date: { gte: fromDate } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 300,
    select: { ...BOOKING_LIST_SELECT, user: { select: { name: true, email: true } } },
  })
  return rows.map((row) => ({ ...toView(row), driver: row.user }))
}

export interface DriverBookingView extends BookingView {
  listingName: string
  listingCity: string
  /** The public page of the station or partner listing it was booked at. */
  listingHref: string
}

/** A driver's own bookings, newest first. */
export async function getMyBookings(userId: string): Promise<DriverBookingView[]> {
  const rows = await prisma.chargerBooking.findMany({
    where: { userId },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    take: 100,
    select: {
      ...BOOKING_LIST_SELECT,
      business: { select: { id: true, businessName: true, city: true } },
      station: { select: { slug: true, name: true, city: true } },
    },
  })
  return rows.map((row) => ({
    ...toView(row),
    listingName: row.station?.name ?? row.business?.businessName ?? 'Charger',
    listingCity: row.station?.city ?? row.business?.city ?? '',
    listingHref: row.station ? `/station/${row.station.slug}` : `/station/${row.business?.id ?? ''}`,
  }))
}

export interface StationBookingView extends HostBookingView {
  stationName: string
  stationSlug: string
}

/** Bookings at operator stations from a day onwards, for the team to decide. */
export async function getStationBookings(fromDate: string): Promise<StationBookingView[]> {
  const rows = await prisma.chargerBooking.findMany({
    where: { stationId: { not: null }, date: { gte: fromDate } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 300,
    select: {
      ...BOOKING_LIST_SELECT,
      user: { select: { name: true, email: true } },
      station: { select: { name: true, slug: true } },
    },
  })
  return rows.map((row) => ({
    ...toView(row),
    driver: row.user,
    stationName: row.station?.name ?? '',
    stationSlug: row.station?.slug ?? '',
  }))
}

/** A station's booking rules for the admin form; defaults when never set. */
export async function getStationBookingSettings(stationId: string): Promise<HostSettingsView> {
  const row = await prisma.stationBookingSettings.findUnique({ where: { stationId } })
  if (!row) return { ...DEFAULT_HOST_SETTINGS, slotMinutes: 30 }
  return {
    pricePerKwh: row.pricePerKwh,
    bookingEnabled: row.bookingEnabled,
    bookingFee: row.bookingFee,
    slotMinutes: row.slotMinutes,
    openTime: row.openTime,
    closeTime: row.closeTime,
  }
}

/**
 * The public booking offer for an operator station: its rules and plugpk's
 * own payment accounts. Null when it takes no bookings — off, a sample
 * listing, or no plugpk account configured. Never throws: the station page
 * still renders without it.
 */
export async function getPublicStationOffer(stationId: string): Promise<{
  settings: HostSettingsView
  accounts: PayoutAccountView[]
} | null> {
  if (isSampleListing(stationId)) return null
  try {
    const settings = await getStationBookingSettings(stationId)
    const accounts: PayoutAccountView[] = getPaymentAccounts().map((account) => ({
      id: `plugpk-${account.method}`,
      method: account.method,
      provider: account.method === 'bank' ? account.provider : null,
      accountTitle: account.accountTitle,
      accountNumber: account.accountNumber,
      iban: account.iban,
      hasQr: false,
    }))
    return { settings, accounts }
  } catch (error) {
    console.error('[station] could not load the booking offer', stationId, error)
    return null
  }
}

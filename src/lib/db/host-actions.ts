// src/lib/db/host-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import {
  bookableDates,
  CHARGER_CONDITIONS,
  chargerLabel,
  formatSpan,
  HOLDING_STATUSES,
  isClockTime,
  isDateKey,
  MAX_BOOKING_FEE,
  MAX_BOOKING_MINUTES,
  MAX_PAYOUT_ACCOUNTS,
  MAX_PRICE_PER_KWH,
  MIN_BOOKING_MINUTES,
  PAYOUT_METHODS,
  peakOverlap,
  planCharge,
  START_STEPS,
  startTimes,
  slotHasStarted,
  toClock,
  toMinutes,
  type ChargerCondition,
  type HostSettingsView,
  type PayoutAccountView,
  type PayoutMethod,
} from '@/lib/charger-host'
import { normalizeReference } from '@/lib/listing-application'
import { isSampleListing } from '@/lib/sample-listings'
import { checkText } from '@/lib/validate'

import { parseChargers, type ListingCharger } from './business-listing'
import { getAdminActor } from './admin-access'
import { logAdminAction } from './audit'
import { prisma } from './client'
import { readPrivateFile } from './document-store'
import { getHostSettings, getPayoutAccounts } from './host-queries'
import { getPaymentAccounts } from './listing-fee'
import { checkLimits, retryMessage } from './rate-limit'
import { getSessionUserId } from './session'
import { recordSiteEvent } from './site-events'

/**
 * Running a listing: the host's side (charger status, price, booking rules,
 * payout accounts, deciding bookings) and the driver's side (seeing free slots,
 * booking one, cancelling it).
 *
 * Every export is a POST endpoint. Host actions re-read the session and check
 * the listing is theirs; driver actions act only as the signed-in account.
 * Nothing here trusts a price, a fee or a status from the browser.
 */

export interface HostResult {
  ok: boolean
  message?: string
}

const NOT_YOURS: HostResult = { ok: false, message: 'That listing is not yours to manage.' }

async function loadOwnedListing(businessId: unknown) {
  const userId = await getSessionUserId()
  if (!userId || typeof businessId !== 'string' || !businessId) return null
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, userId: true, status: true, businessName: true, chargers: true },
  })
  if (!business || business.userId !== userId) return null
  return { ...business, userId }
}

function refreshListing(businessId: string): void {
  revalidatePath(`/station/${businessId}`)
  revalidatePath('/map')
  revalidatePath('/business/dashboard')
  revalidatePath('/business/chargers')
  revalidatePath('/business/bookings')
  revalidatePath('/business/profile')
  revalidatePath('/business/payouts')
}

// ─── Charger status ─────────────────────────────────────

/**
 * One tap from the host: this charger is working, being maintained, or broken.
 * Written into the charger list with the time, compare-and-swap on the column
 * so it never overwrites a photo decision or charger edit made a moment ago.
 */
export async function setChargerCondition(
  businessId: string,
  chargerId: string,
  condition: ChargerCondition,
): Promise<HostResult> {
  if (!CHARGER_CONDITIONS.includes(condition)) return { ok: false, message: 'Choose a status.' }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const business = await loadOwnedListing(businessId)
    if (!business) return NOT_YOURS

    const chargers = parseChargers(business.chargers)
    // A listing saved before chargers had ids gets them now, positionally —
    // nothing can refer to them yet, so this is the moment to fix them.
    const withIds = chargers.map((charger, index) => ({ ...charger, id: charger.id ?? `c-legacy-${index}` }))
    const target = withIds.find((charger) => charger.id === chargerId)
    if (!target) return { ok: false, message: 'That charger is no longer on this listing. Reload the page.' }

    const next: ListingCharger[] = withIds.map((charger) =>
      charger.id === chargerId ? { ...charger, condition, conditionAt: new Date().toISOString() } : charger,
    )
    const written = await prisma.business.updateMany({
      where: { id: business.id, chargers: business.chargers },
      data: { chargers: JSON.stringify(next) },
    })
    if (written.count === 1) {
      await recordSiteEvent({
        userId: business.userId,
        type: 'business.charger.status',
        targetType: 'business',
        targetId: business.id,
        summary: (who) => `${who} marked a charger at ${business.businessName} as ${condition.replace('-', ' ')}`,
      })
      refreshListing(business.id)
      return { ok: true }
    }
  }
  return { ok: false, message: 'This listing was being changed at the same moment. Try again.' }
}

// ─── Price and booking rules ────────────────────────────

/**
 * Price, advance, start step and hours, checked the same way whoever sets
 * them — a partner for their listing or the team for a station.
 */
function checkBookingRules(
  input: HostSettingsView,
): { ok: true; value: HostSettingsView } | { ok: false; message: string } {
  const price = input?.pricePerKwh === null || input?.pricePerKwh === undefined ? null : Number(input.pricePerKwh)
  if (price !== null && (!Number.isInteger(price) || price < 1 || price > MAX_PRICE_PER_KWH)) {
    return { ok: false, message: `Enter the price per unit as whole rupees, between 1 and ${MAX_PRICE_PER_KWH}.` }
  }
  const bookingEnabled = input?.bookingEnabled === true
  const fee = Number(input?.bookingFee ?? 0)
  if (!Number.isInteger(fee) || fee < 0 || fee > MAX_BOOKING_FEE) {
    return { ok: false, message: `Enter the booking advance in whole rupees, up to ${MAX_BOOKING_FEE.toLocaleString()}.` }
  }
  const slotMinutes = Number(input?.slotMinutes)
  if (!(START_STEPS as readonly number[]).includes(slotMinutes)) return { ok: false, message: 'Choose how often bookings can start.' }
  if (!isClockTime(input?.openTime) || !isClockTime(input?.closeTime)) {
    return { ok: false, message: 'Enter opening and closing times.' }
  }
  if (toMinutes(input.closeTime) - toMinutes(input.openTime) < MIN_BOOKING_MINUTES) {
    return { ok: false, message: 'Closing time must be after opening time.' }
  }
  if (bookingEnabled) {
    if (price === null) return { ok: false, message: 'Set the price per unit before taking bookings.' }
    if (fee < 1) return { ok: false, message: 'Set the advance a driver pays to book a slot.' }
  }
  return {
    ok: true,
    value: { pricePerKwh: price, bookingEnabled, bookingFee: fee, slotMinutes, openTime: input.openTime, closeTime: input.closeTime },
  }
}

export async function saveHostSettings(businessId: string, input: HostSettingsView): Promise<HostResult> {
  const business = await loadOwnedListing(businessId)
  if (!business) return NOT_YOURS

  const checked = checkBookingRules(input)
  if (!checked.ok) return checked
  if (checked.value.bookingEnabled) {
    const accounts = await prisma.payoutAccount.count({ where: { businessId: business.id } })
    if (accounts === 0) {
      return { ok: false, message: 'Add a payout account under Payout accounts first — that is where advances are paid.' }
    }
  }

  const data = checked.value
  await prisma.hostSettings.upsert({
    where: { businessId: business.id },
    create: { businessId: business.id, ...data },
    update: data,
  })

  // A booking names its charger by id. Chargers saved before ids existed get
  // theirs now, the same positional ids the status buttons use.
  const chargers = parseChargers(business.chargers)
  if (chargers.some((charger) => !charger.id)) {
    await prisma.business.updateMany({
      where: { id: business.id, chargers: business.chargers },
      data: {
        chargers: JSON.stringify(chargers.map((charger, index) => ({ ...charger, id: charger.id ?? `c-legacy-${index}` }))),
      },
    })
  }

  refreshListing(business.id)
  return { ok: true }
}

// ─── Payout accounts ────────────────────────────────────

/**
 * Adds or updates one payout account, with an optional QR code image. The QR
 * is shown to drivers who are booking, so it is read as a picture only.
 */
export async function savePayoutAccount(businessId: string, form: FormData): Promise<HostResult & { id?: string }> {
  const business = await loadOwnedListing(businessId)
  if (!business) return NOT_YOURS

  const id = String(form.get('id') ?? '')
  const method = String(form.get('method') ?? '') as PayoutMethod
  if (!PAYOUT_METHODS.includes(method)) return { ok: false, message: 'Choose where you want to be paid.' }

  const title = checkText(form.get('accountTitle'), 'the account title', { max: 120, required: true })
  if (!title.ok) return title
  const number = String(form.get('accountNumber') ?? '').trim()
  if (method === 'bank') {
    if (!/^[A-Za-z0-9 -]{6,34}$/.test(number)) return { ok: false, message: 'Enter the bank account number.' }
  } else if (!/^03\d{2}-?\d{7}$/.test(number.replace(/\s/g, ''))) {
    return { ok: false, message: 'Enter the mobile account number, like 0300-1234567.' }
  }
  const provider = method === 'bank' ? checkText(form.get('provider'), 'the bank name', { max: 80, required: true }) : null
  if (provider && !provider.ok) return provider
  const ibanRaw = method === 'bank' ? String(form.get('iban') ?? '').replace(/\s/g, '').toUpperCase() : ''
  if (ibanRaw && !/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(ibanRaw)) {
    return { ok: false, message: 'That IBAN does not look right. A Pakistani IBAN is PK, 2 digits, 4 letters, 16 characters.' }
  }

  let qr: { qrMime: string; qrBytes: Uint8Array<ArrayBuffer> } | { qrMime: null; qrBytes: null } | null = null
  const file = form.get('qr')
  if (file instanceof File && file.size > 0) {
    const read = await readPrivateFile(file, { allowPdf: false })
    if (!read.ok) return { ok: false, message: read.message }
    qr = { qrMime: read.mimeType, qrBytes: new Uint8Array(read.bytes) }
  } else if (form.get('removeQr') === '1') {
    qr = { qrMime: null, qrBytes: null }
  }

  const fields = {
    method,
    provider: provider?.value ?? null,
    accountTitle: title.value,
    accountNumber: number,
    iban: ibanRaw || null,
    ...(qr ?? {}),
  }

  if (id) {
    const written = await prisma.payoutAccount.updateMany({ where: { id, businessId: business.id }, data: fields })
    if (written.count !== 1) return { ok: false, message: 'That account no longer exists. Reload the page.' }
    refreshListing(business.id)
    return { ok: true, id }
  }

  const count = await prisma.payoutAccount.count({ where: { businessId: business.id } })
  if (count >= MAX_PAYOUT_ACCOUNTS) {
    return { ok: false, message: `A listing can have up to ${MAX_PAYOUT_ACCOUNTS} payout accounts.` }
  }
  const newId = randomUUID()
  await prisma.payoutAccount.create({ data: { id: newId, businessId: business.id, ...fields } })
  refreshListing(business.id)
  return { ok: true, id: newId }
}

export async function deletePayoutAccount(businessId: string, accountId: string): Promise<HostResult> {
  const business = await loadOwnedListing(businessId)
  if (!business) return NOT_YOURS

  const remaining = await prisma.payoutAccount.count({ where: { businessId: business.id, id: { not: accountId } } })
  const settings = await prisma.hostSettings.findUnique({ where: { businessId: business.id }, select: { bookingEnabled: true } })
  if (remaining === 0 && settings?.bookingEnabled) {
    return { ok: false, message: 'Bookings are on and this is your only payout account. Turn bookings off first, or add another account.' }
  }
  await prisma.payoutAccount.deleteMany({ where: { id: accountId, businessId: business.id } })
  refreshListing(business.id)
  return { ok: true }
}

// ─── Host: deciding bookings ────────────────────────────

/**
 * Confirm once the advance is in your account; decline with a reason when it
 * is not, or the slot cannot be honoured. The driver reads the reason.
 */
export async function decideBooking(
  bookingId: string,
  decision: 'confirmed' | 'declined',
  note?: string,
): Promise<HostResult> {
  if (decision !== 'confirmed' && decision !== 'declined') return { ok: false, message: 'Choose a decision.' }
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in again to manage bookings.' }

  const booking = await prisma.chargerBooking.findUnique({
    where: { id: String(bookingId ?? '') },
    select: { id: true, status: true, stationId: true, business: { select: { userId: true } } },
  })
  if (!booking) return { ok: false, message: 'That booking no longer exists.' }
  // A partner listing's owner decides its bookings; a station's are decided by
  // the Plug.pk team, re-checked as an operator here.
  const actor = booking.stationId ? await getAdminActor() : null
  const allowed = booking.stationId ? actor !== null : booking.business?.userId === userId
  if (!allowed) return { ok: false, message: 'That booking is not yours to decide.' }
  if (booking.status === 'cancelled') return { ok: false, message: 'The driver has cancelled this booking.' }

  const hostNote = typeof note === 'string' ? note.trim().slice(0, 300) : ''
  if (decision === 'declined' && !hostNote) {
    return { ok: false, message: 'Tell the driver why — for example, the advance did not arrive.' }
  }

  await prisma.chargerBooking.update({
    where: { id: booking.id },
    data: { status: decision, hostNote: hostNote || null, decidedAt: new Date() },
  })
  if (actor) {
    await logAdminAction(actor, `booking.${decision === 'confirmed' ? 'confirm' : 'decline'}`, 'station', booking.stationId, hostNote || undefined)
  }
  revalidatePath('/business/bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard/bookings')
  return { ok: true }
}

// ─── Operator: booking rules for a station ──────────────

/**
 * The Plug.pk team turns bookings on for one of its own stations and sets the
 * price, advance and hours. Same rules as a host's, except the advance is paid
 * to Plug.pk's accounts, so at least one must be configured.
 */
export async function saveStationBookingSettings(
  stationId: string,
  input: HostSettingsView,
): Promise<HostResult> {
  const actor = await getAdminActor()
  if (!actor) return { ok: false, message: 'Your admin session has expired. Sign in again and retry.' }
  const station = await prisma.station.findUnique({ where: { id: String(stationId ?? '') }, select: { id: true, slug: true, name: true } })
  if (!station) return { ok: false, message: 'That station no longer exists.' }
  if (input?.bookingEnabled && isSampleListing(station.id)) {
    return { ok: false, message: 'This is a sample listing, not a real site, so it cannot take bookings.' }
  }

  const checked = checkBookingRules(input)
  if (!checked.ok) return checked
  if (checked.value.bookingEnabled && getPaymentAccounts().length === 0) {
    return { ok: false, message: 'Set a Plug.pk payment account (PAYMENT_* in the environment) before taking bookings.' }
  }

  await prisma.stationBookingSettings.upsert({
    where: { stationId: station.id },
    create: { stationId: station.id, ...checked.value },
    update: checked.value,
  })
  await logAdminAction(
    actor,
    'station.bookings',
    'station',
    station.id,
    `${station.name}: bookings ${checked.value.bookingEnabled ? `on, PKR ${checked.value.bookingFee} advance` : 'off'}`,
  )
  revalidatePath(`/station/${station.slug}`)
  revalidatePath('/map')
  revalidatePath(`/admin/stations/${station.id}`)
  return { ok: true }
}

// ─── Driver: availability and booking ───────────────────

export interface BookableCharger {
  id: string
  label: string
  connectorType: string
  maxPowerKw: number
  /** How many cars it can charge at the same time. */
  ports: number
  bookable: boolean
  condition: ChargerCondition | null
}

export interface StartOption {
  start: string
  end: string
  /** Ports still free for the whole of this booking. */
  portsLeft: number
}

export interface Availability {
  ok: boolean
  message?: string
  chargers: BookableCharger[]
  /** Only when a charger and duration were asked about. */
  starts: StartOption[]
  closeTime: string
}

const NO_AVAILABILITY = (message: string): Availability => ({ ok: false, message, chargers: [], starts: [], closeTime: '' })

type HeldInterval = { start: number; end: number }

/**
 * Where a booking is made: a partner listing (hosted by its owner) or an
 * operator station (hosted by the Plug.pk team). Sent from the browser as
 * "business:<id>" or "station:<id>"; a bare id is a partner listing.
 */
type Venue = { kind: 'business' | 'station'; id: string }

function parseVenue(raw: unknown): Venue | null {
  if (typeof raw !== 'string' || !raw || raw.length > 80) return null
  if (raw.startsWith('station:')) return { kind: 'station', id: raw.slice(8) }
  if (raw.startsWith('business:')) return { kind: 'business', id: raw.slice(9) }
  return { kind: 'business', id: raw }
}

/**
 * Plug.pk's own accounts (PAYMENT_* in the environment — the same ones the
 * listing fee is paid into), in the shape the booking panel shows. Stations
 * are hosted by the team, so their advances go here.
 */
function plugpkAccounts(): PayoutAccountView[] {
  return getPaymentAccounts().map((account) => ({
    id: `plugpk-${account.method}`,
    method: account.method,
    provider: account.method === 'bank' ? account.provider : null,
    accountTitle: account.accountTitle,
    accountNumber: account.accountNumber,
    iban: account.iban,
    hasQr: false,
  }))
}

/** The booking rows of this venue, for a Prisma where clause. */
const venueWhere = (venue: Venue) => (venue.kind === 'station' ? { stationId: venue.id } : { businessId: venue.id })

interface BookableVenue {
  name: string
  /** The host's account; null for a station, which Plug.pk hosts. */
  ownerUserId: string | null
  settings: HostSettingsView
  chargers: BookableCharger[]
  accounts: PayoutAccountView[]
}

/**
 * A venue's bookable chargers and where its advance is paid, or null when it
 * takes no bookings. A station is bookable only when the team has turned
 * bookings on, it is a real site (not a sample listing), and Plug.pk has an
 * account configured to be paid into.
 */
async function loadBookableVenue(venue: Venue): Promise<BookableVenue | null> {
  if (venue.kind === 'station') {
    if (isSampleListing(venue.id)) return null
    const station = await prisma.station.findUnique({
      where: { id: venue.id },
      select: { name: true, connectors: { orderBy: { id: 'asc' } }, bookingSettings: true },
    })
    const settings = station?.bookingSettings
    if (!station || !settings?.bookingEnabled || settings.bookingFee < 1) return null
    const accounts = plugpkAccounts()
    if (accounts.length === 0) return null
    return {
      name: station.name,
      ownerUserId: null,
      settings: {
        pricePerKwh: settings.pricePerKwh,
        bookingEnabled: settings.bookingEnabled,
        bookingFee: settings.bookingFee,
        slotMinutes: settings.slotMinutes,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
      },
      accounts,
      chargers: station.connectors.map((connector, index) => ({
        id: connector.id,
        label: chargerLabel({ connectorType: connector.type, maxPowerKw: connector.maxPowerKw }, index),
        connectorType: connector.type,
        maxPowerKw: connector.maxPowerKw,
        ports: Math.max(1, connector.ports || 1),
        condition: connector.status === 'offline' ? ('not-working' as const) : null,
        bookable: connector.status !== 'offline' && connector.maxPowerKw > 0,
      })),
    }
  }

  const business = await prisma.business.findUnique({
    where: { id: venue.id },
    select: { status: true, chargers: true, userId: true, businessName: true },
  })
  if (!business || business.status !== 'approved') return null
  const settings = await getHostSettings(venue.id)
  if (!settings.bookingEnabled || settings.bookingFee < 1) return null
  const accounts = await getPayoutAccounts(venue.id)
  if (accounts.length === 0) return null

  const chargers: BookableCharger[] = parseChargers(business.chargers)
    .map((charger, index) => ({ charger, index }))
    .filter(({ charger }) => charger.id)
    .map(({ charger, index }) => ({
      id: charger.id as string,
      label: chargerLabel(charger, index),
      connectorType: charger.connectorType,
      maxPowerKw: charger.maxPowerKw,
      ports: Math.max(1, charger.ports || 1),
      condition: charger.condition ?? null,
      bookable: (!charger.condition || charger.condition === 'working') && charger.maxPowerKw > 0,
    }))
  return { name: business.businessName, ownerUserId: business.userId, settings, chargers, accounts }
}

/**
 * Every start time on this day where a booking of `minutes` fits on this
 * charger: inside opening hours, not already begun, and with a port free for
 * the whole of it. A charger with two ports can take two overlapping bookings;
 * the third is refused for every minute the first two share.
 */
function fittingStarts(
  settings: HostSettingsView,
  date: string,
  minutes: number,
  ports: number,
  held: HeldInterval[],
  mine: HeldInterval[],
): StartOption[] {
  const close = toMinutes(settings.closeTime)
  const options: StartOption[] = []
  for (const start of startTimes(settings)) {
    const from = toMinutes(start)
    const to = from + minutes
    if (to > close) break
    if (slotHasStarted(date, start)) continue
    // One driver, one car: never two of their own bookings at the same time.
    if (peakOverlap(mine, from, to) > 0) continue
    const busy = peakOverlap(held, from, to)
    if (busy >= ports) continue
    options.push({ start, end: toClock(to), portsLeft: ports - busy })
  }
  return options
}

const toInterval = (row: { startTime: string; endTime: string }): HeldInterval => ({
  start: toMinutes(row.startTime),
  end: toMinutes(row.endTime),
})

/**
 * The chargers a listing takes bookings on and, once a charger and a duration
 * are chosen, every start time that fits. Public; when the visitor is signed
 * in, times that would clash with their own bookings here are left out too.
 */
export async function getAvailability(
  venueRef: string,
  date: string,
  plan?: { chargerId: string; minutes: number },
): Promise<Availability> {
  const venue = parseVenue(venueRef)
  if (!venue || !isDateKey(date)) return NO_AVAILABILITY('Choose a date.')
  if (!bookableDates().includes(date)) return NO_AVAILABILITY('Bookings open up to two weeks ahead.')

  const listing = await loadBookableVenue(venue)
  if (!listing) return NO_AVAILABILITY('This charger is not taking bookings.')
  const base = { ok: true, chargers: listing.chargers, starts: [], closeTime: listing.settings.closeTime }
  if (!plan) return base

  const charger = listing.chargers.find((item) => item.id === plan.chargerId)
  const minutes = Number(plan.minutes)
  if (!charger?.bookable || !Number.isInteger(minutes) || minutes < MIN_BOOKING_MINUTES || minutes > MAX_BOOKING_MINUTES) {
    return base
  }

  const userId = await getSessionUserId()
  const [held, mine] = await Promise.all([
    prisma.chargerBooking.findMany({
      where: { chargerId: charger.id, ...venueWhere(venue), date, status: { in: HOLDING_STATUSES } },
      select: { startTime: true, endTime: true },
    }),
    userId
      ? prisma.chargerBooking.findMany({
          where: { userId, ...venueWhere(venue), date, status: { in: HOLDING_STATUSES } },
          select: { startTime: true, endTime: true },
        })
      : Promise.resolve([]),
  ])

  return {
    ...base,
    starts: fittingStarts(listing.settings, date, minutes, charger.ports, held.map(toInterval), mine.map(toInterval)),
  }
}

/**
 * Books a charger for as long as the driver's charge needs.
 *
 * The duration is worked out here, from the car and the charge levels the
 * driver gave — the same arithmetic the panel showed them — so a booking can
 * never be stretched or squeezed by editing the request.
 *
 * Every booking on one charger on one day goes through a single advisory lock.
 * Inside it the overlap check and the insert happen together, so however many
 * drivers press Book at the same moment, a charger never holds more cars at
 * once than it has ports.
 */
export async function createBooking(form: FormData): Promise<HostResult & { bookingId?: string }> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to book a slot.' }

  const venue = parseVenue(form.get('venue') ?? form.get('businessId'))
  if (!venue) return { ok: false, message: 'This charger is not taking bookings.' }
  const chargerId = String(form.get('chargerId') ?? '')
  const date = String(form.get('date') ?? '')
  const start = String(form.get('start') ?? '')
  const accountId = String(form.get('payoutAccountId') ?? '')
  if (!isDateKey(date) || !bookableDates().includes(date)) return { ok: false, message: 'Choose a day within the next two weeks.' }
  if (!isClockTime(start)) return { ok: false, message: 'Choose a start time.' }

  const listing = await loadBookableVenue(venue)
  if (!listing) return { ok: false, message: 'This charger is not taking bookings.' }
  if (listing.ownerUserId === userId) return { ok: false, message: 'You cannot book a slot on your own listing.' }
  const charger = listing.chargers.find((item) => item.id === chargerId)
  if (!charger) return { ok: false, message: 'Choose a charger.' }
  if (!charger.bookable) return { ok: false, message: 'That charger is not working right now. Choose another.' }

  // The car: from the catalogue, or a battery size the driver typed.
  const carSlug = String(form.get('carSlug') ?? '')
  let car: { name: string; batteryKwh: number | null; acKw: number | null; dcKw: number | null }
  if (carSlug) {
    const row = await prisma.car.findUnique({
      where: { slug: carSlug },
      select: { fullName: true, batteryCapacity: true, acCharging: true, dcCharging: true },
    })
    if (!row?.batteryCapacity) return { ok: false, message: 'Choose your car again — that one has no battery size on record.' }
    car = { name: row.fullName, batteryKwh: row.batteryCapacity, acKw: row.acCharging, dcKw: row.dcCharging }
  } else {
    const battery = Number(form.get('batteryKwh'))
    if (!Number.isFinite(battery) || battery < 5 || battery > 250) {
      return { ok: false, message: 'Enter your battery size in kWh, between 5 and 250.' }
    }
    const typed = checkText(form.get('carName'), 'your car', { max: 80 })
    car = { name: (typed.ok && typed.value) || `Car with ${battery} kWh battery`, batteryKwh: battery, acKw: null, dcKw: null }
  }

  const plan = planCharge({
    ...car,
    connectorType: charger.connectorType,
    chargerKw: charger.maxPowerKw,
    fromPct: Number(form.get('fromPct')),
    toPct: Number(form.get('toPct')),
  })
  if (!plan.ok) return { ok: false, message: plan.message }

  const from = toMinutes(start)
  const to = from + plan.minutes
  const settings = listing.settings
  if (!startTimes(settings).includes(start) || from < toMinutes(settings.openTime)) {
    return { ok: false, message: 'Choose one of the start times shown.' }
  }
  if (to > toMinutes(settings.closeTime)) {
    return { ok: false, message: `This charge needs ${formatSpan(plan.minutes)} and would run past closing. Choose an earlier time.` }
  }
  if (slotHasStarted(date, start)) return { ok: false, message: 'That time has already passed. Choose a later one.' }

  const account = listing.accounts.find((item) => item.id === accountId)
  if (!account) return { ok: false, message: 'Choose the account you paid the advance into.' }

  const payerName = checkText(form.get('payerName'), 'the name on the account you paid from', { max: 120, required: true })
  if (!payerName.ok) return payerName
  const reference = normalizeReference(form.get('reference'))
  if (!reference) return { ok: false, message: 'Enter the transaction ID exactly as it appears on your receipt.' }

  const receipt = await readPrivateFile(form.get('file'), { allowPdf: true })
  if (!receipt.ok) return { ok: false, message: receipt.message === 'Choose a file to upload.' ? 'Upload your payment receipt.' : receipt.message }

  const limit = await checkLimits([{ key: `booking:user:${userId}`, limit: 10, windowSeconds: 60 * 60 }])
  if (!limit.allowed) return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many bookings') }

  const id = randomUUID()
  const endTime = toClock(to)

  const outcome = await prisma.$transaction(async (tx) => {
    // One lock per charger per day: bookings cannot cross midnight, so every
    // booking that could overlap this one waits on the same key.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking|${venue.kind}|${venue.id}|${chargerId}|${date}`}))::text`

    const [held, mine] = await Promise.all([
      tx.chargerBooking.findMany({
        where: { ...venueWhere(venue), chargerId, date, status: { in: HOLDING_STATUSES } },
        select: { startTime: true, endTime: true },
      }),
      tx.chargerBooking.findMany({
        where: { userId, ...venueWhere(venue), date, status: { in: HOLDING_STATUSES } },
        select: { startTime: true, endTime: true },
      }),
    ])
    if (peakOverlap(mine.map(toInterval), from, to) > 0) return 'mine' as const
    if (peakOverlap(held.map(toInterval), from, to) >= charger.ports) return 'full' as const

    await tx.chargerBooking.create({
      data: {
        id,
        ...venueWhere(venue),
        chargerId,
        chargerLabel: charger.label,
        userId,
        date,
        startTime: start,
        endTime,
        fee: settings.bookingFee,
        pricePerKwh: settings.pricePerKwh,
        payMethod: account.method,
        payerName: payerName.value,
        reference,
        receiptMime: receipt.mimeType,
        receiptBytes: new Uint8Array(receipt.bytes),
        vehicle: car.name.slice(0, 80),
        fromPct: Number(form.get('fromPct')),
        toPct: Number(form.get('toPct')),
        energyKwh: plan.energyKwh,
        durationMinutes: plan.minutes,
      },
    })
    return 'booked' as const
  })

  if (outcome === 'mine') {
    return { ok: false, message: 'You already have a booking here that overlaps this time.' }
  }
  if (outcome === 'full') {
    return { ok: false, message: 'Someone booked this charger for part of that time a moment ago. Choose another start time.' }
  }

  await recordSiteEvent({
    userId,
    type: 'booking.create',
    targetType: venue.kind,
    targetId: venue.id,
    summary: (who) => `${who} booked ${date} ${start}–${endTime} at ${listing.name}`,
  })
  revalidatePath('/business/bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard/bookings')
  return { ok: true, bookingId: id }
}

/** A driver gives up their slot. Any refund of the advance is between them and the host. */
export async function cancelMyBooking(bookingId: string): Promise<HostResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in again to manage your bookings.' }
  const booking = await prisma.chargerBooking.findUnique({
    where: { id: String(bookingId ?? '') },
    select: { id: true, userId: true, status: true, date: true, startTime: true },
  })
  if (!booking || booking.userId !== userId) return { ok: false, message: 'That booking is not yours.' }
  if (!HOLDING_STATUSES.includes(booking.status as 'pending')) return { ok: false, message: 'This booking is no longer active.' }
  if (slotHasStarted(booking.date, booking.startTime)) return { ok: false, message: 'This slot has already started.' }

  await prisma.chargerBooking.update({ where: { id: booking.id }, data: { status: 'cancelled', decidedAt: new Date() } })
  revalidatePath('/business/bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard/bookings')
  return { ok: true }
}

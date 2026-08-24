// src/lib/db/car-actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

import { prisma } from './client'
import { discardCarPhoto } from './upload-actions'

/**
 * Writes to the car catalogue, from the admin portal.
 *
 * ── Every action checks the admin session itself ───────────────────────
 *
 * The admin layout already redirects an unauthenticated request to the login
 * page, but a layout guard protects *pages*, not server actions. An action is a
 * POST endpoint that anyone can call directly once they know it exists; relying
 * on the layout would mean the whole catalogue was editable by anybody who read
 * the client bundle. So the check is here, in every exported action, and it is
 * the first thing each one does.
 *
 * ── Nulls are values, not omissions ───────────────────────────────────
 *
 * The catalogue's governing rule is that nothing is invented: a car with no
 * published DC figure stores null, never a plausible number. So an empty form
 * field has to write null rather than being skipped, and `numberOrNull` below
 * treats blank as a deliberate "not published" instead of "leave as it was".
 * Getting this wrong would make a figure impossible to *remove* once entered,
 * which is how a wrong number becomes permanent.
 */

export interface CarActionResult {
  ok: boolean
  message?: string
  /** Per-field messages, keyed by form field name. */
  errors?: Record<string, string>
  slug?: string
}

async function requireAdmin(): Promise<boolean> {
  return verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)
}

const DENIED: CarActionResult = {
  ok: false,
  message: 'Your admin session has expired. Sign in again and retry.',
}

const CATEGORIES = ['EV', 'PHEV', 'REEV', 'Hybrid'] as const
const CONNECTORS = ['CCS2', 'Type 2', 'GB/T', 'CHAdeMO'] as const

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim()
}

/**
 * A blank field is null, not zero and not "unchanged".
 *
 * Returns `undefined` only when the value is present but unparseable, so the
 * caller can tell a bad input from a deliberately empty one.
 */
function numberOrNull(form: FormData, key: string): number | null | undefined {
  const raw = text(form, key)
  if (raw === '') return null

  const value = Number(raw.replace(/,/g, ''))
  if (!Number.isFinite(value) || value < 0) return undefined
  return value
}

function intOrNull(form: FormData, key: string): number | null | undefined {
  const value = numberOrNull(form, key)
  if (value === undefined || value === null) return value
  return Math.round(value)
}

/** `Dera Ghazi` → `dera-ghazi`. Used when an id or slug is generated. */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Every column the form is allowed to write.
 *
 * Spelled out rather than inferred, so Prisma checks the object at the call
 * site: a `Record<string, unknown>` spread into `prisma.car.create` compiles
 * happily and fails at runtime with a missing-column error, which is the worst
 * possible place to find out.
 *
 * `id`, `slug` and `image` are absent on purpose. The first two are derived and
 * uniqueness-checked by the caller, and the photograph has its own action.
 */
export interface CarWritableFields {
  brand: string
  model: string
  fullName: string
  category: string
  priceMin: number
  priceMax: number
  priceDisplay: string
  batteryCapacity: number | null
  range: number | null
  rangeMax: number | null
  electricRange: number | null
  electricRangeMax: number | null
  power: number | null
  acceleration: number | null
  topSpeed: number | null
  torque: number | null
  seats: number | null
  dcCharging: number | null
  acCharging: number | null
  engineCapacity: number | null
  connectors: string
  notes: string | null
}

interface ParsedCar {
  data: CarWritableFields
  errors: Record<string, string>
}

/**
 * Reads the form into a row, collecting every problem rather than stopping at
 * the first — a form that reports one error at a time makes filling in
 * twenty-three fields an exercise in patience.
 */
function parse(form: FormData): ParsedCar {
  const errors: Record<string, string> = {}

  const brand = text(form, 'brand')
  const model = text(form, 'model')
  const category = text(form, 'category')
  const priceDisplay = text(form, 'priceDisplay')

  if (!brand) errors.brand = 'Required.'
  if (!model) errors.model = 'Required.'
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    errors.category = 'Choose a powertrain.'
  }

  const fullName = text(form, 'fullName') || `${brand} ${model}`.trim()

  const priceMin = intOrNull(form, 'priceMin')
  const priceMax = intOrNull(form, 'priceMax')

  if (priceMin === undefined) errors.priceMin = 'Enter a number of rupees.'
  else if (priceMin === null) errors.priceMin = 'Required — every car needs a price.'

  if (priceMax === undefined) errors.priceMax = 'Enter a number of rupees.'

  const resolvedMin = typeof priceMin === 'number' ? priceMin : 0
  const resolvedMax = typeof priceMax === 'number' ? priceMax : resolvedMin

  if (resolvedMax < resolvedMin) {
    errors.priceMax = 'The upper price cannot be below the lower one.'
  }
  if (!priceDisplay) {
    errors.priceDisplay = 'Required — this is the string shown on every card.'
  }

  // Ranges quoted as a span keep both ends; an upper figure below the lower one
  // would render as "450–380 km".
  const range = intOrNull(form, 'range')
  const rangeMax = intOrNull(form, 'rangeMax')
  if (
    typeof range === 'number' &&
    typeof rangeMax === 'number' &&
    rangeMax < range
  ) {
    errors.rangeMax = 'The upper figure cannot be below the lower one.'
  }

  const electricRange = intOrNull(form, 'electricRange')
  const electricRangeMax = intOrNull(form, 'electricRangeMax')
  if (
    typeof electricRange === 'number' &&
    typeof electricRangeMax === 'number' &&
    electricRangeMax < electricRange
  ) {
    errors.electricRangeMax = 'The upper figure cannot be below the lower one.'
  }

  const numeric = {
    batteryCapacity: numberOrNull(form, 'batteryCapacity'),
    range,
    rangeMax,
    electricRange,
    electricRangeMax,
    power: intOrNull(form, 'power'),
    acceleration: numberOrNull(form, 'acceleration'),
    topSpeed: intOrNull(form, 'topSpeed'),
    torque: intOrNull(form, 'torque'),
    seats: intOrNull(form, 'seats'),
    dcCharging: numberOrNull(form, 'dcCharging'),
    acCharging: numberOrNull(form, 'acCharging'),
    engineCapacity: intOrNull(form, 'engineCapacity'),
  }

  for (const [key, value] of Object.entries(numeric)) {
    if (value === undefined) errors[key] = 'Enter a number, or leave blank for “not published”.'
  }

  const connectors = CONNECTORS.filter((entry) => form.getAll('connectors').includes(entry))

  // A hybrid has no plug. Letting one carry a connector or a charging speed
  // would put it in the DC filter's results on the public catalogue.
  if (category === 'Hybrid') {
    if (connectors.length > 0) {
      errors.connectors = 'A full hybrid has no charging port — leave these unticked.'
    }
    if (numeric.dcCharging !== null && numeric.dcCharging !== undefined) {
      errors.dcCharging = 'A full hybrid cannot be charged. Leave this blank.'
    }
    if (numeric.acCharging !== null && numeric.acCharging !== undefined) {
      errors.acCharging = 'A full hybrid cannot be charged. Leave this blank.'
    }
  }

  const notes = text(form, 'notes')

  /*
    `undefined` in `numeric` means the field was filled in with something that
    is not a number, and every one of those is already in `errors` — the caller
    returns before touching `data`. Collapsing them to null here is what lets
    the row be typed rather than a bag of unknowns.
  */
  const orNull = (value: number | null | undefined): number | null => value ?? null

  return {
    errors,
    data: {
      brand,
      model,
      fullName,
      category,
      priceMin: resolvedMin,
      priceMax: resolvedMax,
      priceDisplay,
      batteryCapacity: orNull(numeric.batteryCapacity),
      range: orNull(numeric.range),
      rangeMax: orNull(numeric.rangeMax),
      electricRange: orNull(numeric.electricRange),
      electricRangeMax: orNull(numeric.electricRangeMax),
      power: orNull(numeric.power),
      acceleration: orNull(numeric.acceleration),
      topSpeed: orNull(numeric.topSpeed),
      torque: orNull(numeric.torque),
      seats: orNull(numeric.seats),
      dcCharging: orNull(numeric.dcCharging),
      acCharging: orNull(numeric.acCharging),
      engineCapacity: orNull(numeric.engineCapacity),
      connectors: connectors.join(','),
      notes: notes === '' ? null : notes,
    },
  }
}

/** Revalidates everywhere a car appears, so an edit is visible immediately. */
function revalidateCar(slug: string) {
  revalidatePath('/cars')
  revalidatePath(`/cars/${slug}`)
  revalidatePath('/cars/compare')
  revalidatePath('/admin/cars')
  revalidatePath(`/admin/cars/${slug}`)
  // The home page carries a car rail.
  revalidatePath('/')
}

export async function updateCar(id: string, form: FormData): Promise<CarActionResult> {
  if (!(await requireAdmin())) return DENIED

  const existing = await prisma.car.findUnique({ where: { id } })
  if (!existing) return { ok: false, message: 'That car no longer exists.' }

  const { data, errors } = parse(form)
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Some fields need attention.', errors }
  }

  // The slug is editable but must stay unique — it is the public URL.
  const slug = slugify(text(form, 'slug')) || existing.slug
  if (slug !== existing.slug) {
    const clash = await prisma.car.findUnique({ where: { slug } })
    if (clash) {
      return { ok: false, message: 'Some fields need attention.', errors: { slug: 'Already taken by another car.' } }
    }
  }

  await prisma.car.update({ where: { id }, data: { ...data, slug } })

  revalidateCar(existing.slug)
  if (slug !== existing.slug) revalidateCar(slug)

  return { ok: true, message: 'Saved.', slug }
}

export async function createCar(form: FormData): Promise<CarActionResult> {
  if (!(await requireAdmin())) return DENIED

  const { data, errors } = parse(form)

  const brand = text(form, 'brand')
  const model = text(form, 'model')
  const slug = slugify(text(form, 'slug')) || slugify(`${brand} ${model}`)

  if (!slug) errors.slug = 'Required — this becomes the public URL.'

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Some fields need attention.', errors }
  }

  const clash = await prisma.car.findFirst({ where: { OR: [{ id: slug }, { slug }] } })
  if (clash) {
    return {
      ok: false,
      message: 'Some fields need attention.',
      errors: { slug: 'A car already uses that slug.' },
    }
  }

  // id mirrors the slug, as every seeded row does, so the two stay predictable.
  await prisma.car.create({ data: { ...data, id: slug, slug, image: null } })

  revalidateCar(slug)
  return { ok: true, message: 'Car created.', slug }
}

export async function deleteCar(id: string): Promise<CarActionResult> {
  if (!(await requireAdmin())) return DENIED

  const existing = await prisma.car.findUnique({ where: { id } })
  if (!existing) return { ok: false, message: 'That car no longer exists.' }

  await prisma.car.delete({ where: { id } })

  // Only an uploaded file is removed. A seeded path under /images/cars is a
  // repository asset shared with the seed module, and deleting one because a row
  // was removed would leave the module pointing at a missing file.
  if (existing.image) await discardCarPhoto(existing.image)

  revalidateCar(existing.slug)
  return { ok: true, message: `${existing.fullName} deleted.` }
}

/**
 * Points a car at an image path, or clears it.
 *
 * Separate from updateCar so the photograph can be changed without
 * re-submitting and re-validating twenty-three other fields — and so a failed
 * upload cannot take a whole edit with it.
 */
export async function setCarImage(id: string, image: string | null): Promise<CarActionResult> {
  if (!(await requireAdmin())) return DENIED

  const existing = await prisma.car.findUnique({ where: { id } })
  if (!existing) return { ok: false, message: 'That car no longer exists.' }

  await prisma.car.update({ where: { id }, data: { image } })

  if (existing.image && existing.image !== image) {
    await discardCarPhoto(existing.image)
  }

  revalidateCar(existing.slug)
  return { ok: true, message: image ? 'Photograph updated.' : 'Photograph removed.', slug: existing.slug }
}

// src/lib/db/service-form.ts
import 'server-only'

import { SERVICE_CATEGORY_KEYS } from '@/lib/constants'
import { checkEmail, checkPhone, checkText, checkWebsite, isInPakistan } from '@/lib/validate'

/**
 * The core of a service listing, read from a form — what drivers see and how
 * to reach the business. Shared by the application and the owner's edit form,
 * so a listing can never be saved under looser rules than it was applied with.
 * The optional extras (contact person, hours, prices…) are readServiceDetails.
 */

export interface ServiceCore {
  name: string
  category: string
  description: string
  city: string
  area: string
  street: string
  phone: string
  email: string | null
  website: string | null
  lat: number
  lng: number
}

export type ServiceCoreResult = { ok: true; value: ServiceCore } | { ok: false; field: string; message: string }

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

export function readServiceCore(form: FormData): ServiceCoreResult {
  const name = checkText(form.get('name'), 'the business name', { max: 120, min: 2, required: true })
  if (!name.ok) return { ok: false, field: 'name', message: name.message }

  const category = text(form, 'category')
  if (!SERVICE_CATEGORY_KEYS.includes(category as (typeof SERVICE_CATEGORY_KEYS)[number])) {
    return { ok: false, field: 'category', message: 'Choose the kind of service you offer.' }
  }

  const city = checkText(form.get('city'), 'your city', { max: 80, min: 2, required: true })
  if (!city.ok) return { ok: false, field: 'city', message: city.message }
  const area = checkText(form.get('area'), 'the area', { max: 120 })
  if (!area.ok) return { ok: false, field: 'area', message: area.message }
  const street = checkText(form.get('street'), 'the street address', { max: 200 })
  if (!street.ok) return { ok: false, field: 'street', message: street.message }

  const description = checkText(form.get('description'), 'a description', { max: 1000, required: true })
  if (!description.ok) return { ok: false, field: 'description', message: description.message }
  if (description.value.length < 20) {
    return {
      ok: false,
      field: 'description',
      message: 'A sentence or two about what you do — at least 20 characters.',
    }
  }

  const phone = checkPhone(form.get('phone'))
  if (!phone.ok) return { ok: false, field: 'phone', message: phone.message }
  const rawEmail = text(form, 'email')
  const email = rawEmail ? checkEmail(rawEmail) : null
  if (email && !email.ok) return { ok: false, field: 'email', message: email.message }
  if (!phone.value && !email) {
    return { ok: false, field: 'phone', message: 'Leave a phone number or an email so we can reach you.' }
  }

  const website = checkWebsite(form.get('website'))
  if (!website.ok) return { ok: false, field: 'website', message: website.message }

  const lat = Number(text(form, 'lat'))
  const lng = Number(text(form, 'lng'))
  if (!text(form, 'lat') || !text(form, 'lng') || !isInPakistan(lat, lng)) {
    return {
      ok: false,
      field: 'location',
      message: 'Set your location on the map — it has to be inside Pakistan.',
    }
  }

  return {
    ok: true,
    value: {
      name: name.value,
      category,
      description: description.value,
      city: city.value,
      area: area.value,
      street: street.value,
      // The column is required; an email-only applicant has no phone to store.
      phone: phone.value ?? '',
      email: email && email.ok ? email.value : null,
      website: website.value,
      lat,
      lng,
    },
  }
}

// src/lib/db/service-details.ts
import 'server-only'

import { parseHoursForm } from '@/lib/service-hours'
import { checkPhone, checkText, checkWebsite } from '@/lib/validate'

/**
 * The detail fields of a service listing, read and checked the same way for
 * the public application (applyToListService) and the admin editor
 * (saveService), so neither can store something the other would refuse.
 */

export interface ServiceDetails {
  contactName: string | null
  contactRole: string | null
  whatsapp: string | null
  socialUrl: string | null
  yearEstablished: number | null
  brands: string | null
  pricing: string | null
  operatingHours: string
}

export type DetailsResult =
  | { ok: true; value: ServiceDetails }
  | { ok: false; field: string; message: string }

export function readServiceDetails(form: FormData, { contactRequired = false } = {}): DetailsResult {
  const contactName = checkText(form.get('contactName'), 'the contact person’s name', { max: 120, required: contactRequired })
  if (!contactName.ok) return { ok: false, field: 'contactName', message: contactName.message ?? 'Enter a name.' }
  const contactRole = checkText(form.get('contactRole'), 'their role', { max: 80 })
  if (!contactRole.ok) return { ok: false, field: 'contactRole', message: contactRole.message ?? 'Check the role.' }

  const whatsapp = checkPhone(form.get('whatsapp'))
  if (!whatsapp.ok) return { ok: false, field: 'whatsapp', message: whatsapp.message ?? 'Check the WhatsApp number.' }

  const social = checkWebsite(form.get('socialUrl'))
  if (!social.ok) return { ok: false, field: 'socialUrl', message: social.message ?? 'Check the social media link.' }

  const rawYear = String(form.get('yearEstablished') ?? '').trim()
  let yearEstablished: number | null = null
  if (rawYear) {
    const year = Number(rawYear)
    const now = new Date().getFullYear()
    if (!Number.isInteger(year) || year < 1947 || year > now) {
      return { ok: false, field: 'yearEstablished', message: `Enter the year you started, between 1947 and ${now}.` }
    }
    yearEstablished = year
  }

  const brands = checkText(form.get('brands'), 'the EV makes you work with', { max: 300 })
  if (!brands.ok) return { ok: false, field: 'brands', message: brands.message ?? 'Check the makes.' }
  const pricing = checkText(form.get('pricing'), 'your prices', { max: 600 })
  if (!pricing.ok) return { ok: false, field: 'pricing', message: pricing.message ?? 'Check the prices.' }

  const hours = parseHoursForm(form)
  if (!hours.ok) return { ok: false, field: 'hours', message: hours.message }

  return {
    ok: true,
    value: {
      contactName: contactName.value || null,
      contactRole: contactRole.value || null,
      whatsapp: whatsapp.value,
      socialUrl: social.value,
      yearEstablished,
      brands: brands.value || null,
      pricing: pricing.value || null,
      operatingHours: hours.value,
    },
  }
}

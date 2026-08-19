// src/lib/geocode-actions.ts
'use server'

import { PAKISTAN_CITIES } from '@/lib/constants'

/**
 * Turning a pin into a street address.
 *
 * Runs on the server rather than in the page for three reasons: Nominatim asks
 * callers to identify themselves with a User-Agent, which a browser will not
 * let a script set; the endpoint does not serve CORS headers for arbitrary
 * origins; and keeping it here means a Google key, if one is ever configured,
 * is never shipped to the client.
 *
 * What comes back is a suggestion, not a fact. Reverse geocoding in Pakistan is
 * patchy — many streets are unnamed in OpenStreetMap, and a pin in a housing
 * society often resolves to the society rather than the house. So this returns
 * its best reading and the caller shows it for confirmation; nothing is
 * submitted on its say-so.
 */

export interface GeocodeResult {
  ok: boolean
  /** A street line, suitable for the address field. */
  address?: string
  /** Matched against the city list, so it can select the dropdown. Null if no match. */
  city?: string | null
  message?: string
}

interface NominatimAddress {
  house_number?: string
  road?: string
  neighbourhood?: string
  suburb?: string
  quarter?: string
  village?: string
  town?: string
  city?: string
  county?: string
  state?: string
}

/**
 * Nominatim names the same thing differently depending on the place, so the
 * city is looked for across several fields, most specific first.
 */
function readCity(address: NominatimAddress): string | null {
  const candidates = [address.city, address.town, address.village, address.county, address.state]

  for (const candidate of candidates) {
    if (!candidate) continue
    const match = PAKISTAN_CITIES.find(
      (city) => city.toLowerCase() === candidate.trim().toLowerCase(),
    )
    if (match) return match
  }
  return null
}

/**
 * The street line: house number and road where they exist, then the
 * neighbourhood. The city is deliberately left out — the form has its own city
 * field, and repeating it makes the address read as "5 Mall Road, Lahore,
 * Lahore" once the two are shown together.
 */
function readAddress(address: NominatimAddress, fallback: string): string {
  const street = [address.house_number, address.road].filter(Boolean).join(' ')
  const area = address.neighbourhood ?? address.suburb ?? address.quarter

  const parts = [street, area].filter((part) => part && part.trim().length > 0)
  if (parts.length === 0) {
    // Nothing usable in the structured fields. The display name is long and
    // includes the country, but it is better than an empty suggestion.
    return fallback.split(',').slice(0, 3).join(',').trim()
  }
  return parts.join(', ')
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: 'Those coordinates are not a position.' }
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  // 18 is building level. Lower would return the suburb for every pin on it.
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')

  // Bounded, because a slow lookup must not leave someone staring at a spinner
  // when they could simply type the address themselves.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Nominatim's usage policy requires identifying the application.
        'User-Agent': 'PlugPK/1.0 (EV charging directory; contact via plug.pk)',
        'Accept-Language': 'en',
      },
      // The address of a given point does not change; caching keeps repeated
      // taps off someone else's free service.
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!response.ok) {
      return { ok: false, message: 'Address lookup is unavailable right now.' }
    }

    const data = (await response.json()) as {
      address?: NominatimAddress
      display_name?: string
      error?: string
    }

    if (data.error || !data.address) {
      return { ok: false, message: 'No address is recorded for that spot.' }
    }

    return {
      ok: true,
      address: readAddress(data.address, data.display_name ?? ''),
      city: readCity(data.address),
    }
  } catch (error) {
    // An abort is the timeout above; anything else is the network.
    const aborted = error instanceof Error && error.name === 'AbortError'
    return {
      ok: false,
      message: aborted
        ? 'Address lookup took too long.'
        : 'Could not reach the address service.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

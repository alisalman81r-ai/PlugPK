// src/lib/city-photos.ts
import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

/**
 * Resolves the cover image for a club, when that image is a photograph.
 *
 * Three places, tried in order, first that exists wins:
 *
 *   1. `club.coverPhoto` — the club's own picture, from the database. A club
 *      that has uploaded one should show itself and nothing else.
 *   2. `public/images/cities/<city>.jpg` — a photograph *of that city*. This is
 *      the slot to fill; see that folder's README for the spec.
 *   3. Nothing, and the card draws the city instead (CityScene).
 *
 * There was briefly a step between 2 and 3 that handed out the project's own EV
 * photography — real, licensed pictures of chargers from public/images/stations.
 * It is gone. Those are photographs of charging hardware, shot in Europe, and a
 * cover is supposed to tell you which city a club is in at a glance. A German
 * parking sign on the Rawalpindi card does the opposite, and no amount of
 * caveat in a chip fixes it. A drawing of the right city beats a photograph of
 * the wrong one.
 *
 * Resolution is by looking at the folder rather than from a hand-written list of
 * filenames. A registry has to be edited in lockstep with the folder, and the
 * failure mode when it drifts is a 404 through next/image on a production page.
 * So: drop `lahore.jpg` into public/images/cities and the Lahore cards use it.
 * No import, no registration, no deploy of code.
 *
 * Server-only, because it reads the filesystem. The clubs directory is a server
 * component, which is where this is called.
 */

const PUBLIC_IMAGES = path.join(process.cwd(), 'public', 'images')

/** What next/image can actually optimise. */
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

let cityCache: Map<string, string> | null = null

/** True in production only, where the folders cannot change under the server. */
function cachingAllowed(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** `Dera Ghazi Khan` → `dera-ghazi-khan`, so the filename is predictable. */
export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Image files in one folder under public/images, sorted for a stable order. */
function readImageDir(folder: string): string[] {
  let entries: string[]
  try {
    entries = fs.readdirSync(path.join(PUBLIC_IMAGES, folder))
  } catch {
    // No folder, which is not an error — the chain simply moves to the next
    // step and the page renders.
    return []
  }

  return entries
    .filter((entry) => EXTENSIONS.includes(path.extname(entry).toLowerCase()))
    .sort()
}

function readCityDir(): Map<string, string> {
  const found = new Map<string, string>()

  for (const entry of readImageDir('cities')) {
    const extension = path.extname(entry).toLowerCase()
    found.set(path.basename(entry, extension).toLowerCase(), `/images/cities/${entry}`)
  }

  return found
}

/**
 * The public path to a city's photograph, or null if there is not one.
 *
 * Cached for the life of the process in production, where the folder cannot
 * change under a running server. Re-read every call in development, so a photo
 * dropped in appears on the next refresh instead of after a restart.
 */
export function cityPhoto(city: string): string | null {
  if (cityCache === null || !cachingAllowed()) {
    cityCache = readCityDir()
  }

  return cityCache.get(citySlug(city)) ?? null
}

// src/lib/app-url.ts
import 'server-only'

/**
 * The public address of this deployment, for links that leave the site —
 * above all the link in a verification email, which has to open the same
 * deployment that sent it.
 *
 * In order:
 *   APP_URL                         set it in Vercel to pin the address
 *                                   (e.g. https://plug-pk.vercel.app, or a
 *                                   custom domain once one is attached)
 *   VERCEL_PROJECT_PRODUCTION_URL   provided by Vercel on production builds
 *   VERCEL_URL                      provided by Vercel on preview builds
 *   http://localhost:3000           local development only
 *
 * Never hardcodes localhost in production: on Vercel one of the system
 * variables is always present.
 */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const production = process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : undefined
  const host = production || process.env.VERCEL_URL
  if (host) return `https://${host.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}

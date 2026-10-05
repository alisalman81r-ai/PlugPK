// src/components/auth/auth-links.ts

/**
 * An auth page's address, carrying the ?redirect= the visitor arrived with.
 *
 * Somebody sent to /login from the route planner who then clicks "Create one"
 * or "Forgot password?" used to lose the redirect at that click, and land on
 * the dashboard at the end instead of back at their route. Every cross-link
 * between login, signup and forgot-password goes through here so none of them
 * can drop it.
 *
 * The value has already been through safeRedirect on the page that read it,
 * so this only re-encodes it. The default landings are left off the URL —
 * they are what the destination page would pick anyway.
 */
const DEFAULT_LANDINGS = new Set(['', '/dashboard', '/onboarding/vehicle'])

export function authHref(path: string, redirect?: string | null): string {
  if (!redirect || DEFAULT_LANDINGS.has(redirect)) return path
  const joiner = path.includes('?') ? '&' : '?'
  return `${path}${joiner}redirect=${encodeURIComponent(redirect)}`
}

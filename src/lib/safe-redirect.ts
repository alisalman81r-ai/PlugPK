// src/lib/safe-redirect.ts

/**
 * Cleans a `?redirect=` value before it is used to navigate.
 *
 * Auth pages carry the page you were trying to reach so you land back there
 * after signing in. That value comes from the URL, so anybody can choose it —
 * and an off-site value would turn the login page into a way of bouncing people
 * elsewhere under Plug.pk's name.
 *
 * Prefix checks alone were not enough: URL parsers strip tabs and newlines, so
 * `/\t/evil.com` passed a "no second slash" test and still resolved to
 * https://evil.com. The value is therefore resolved against a placeholder
 * origin exactly as a browser would, and accepted only if it stays on it.
 */
const PLACEHOLDER_ORIGIN = 'https://plug.invalid'

export function safeRedirect(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string') return fallback

  const path = value.trim()
  if (!path.startsWith('/')) return fallback
  // Control characters and backslashes have no place in a path we issued.
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return fallback
  if (path.startsWith('//')) return fallback

  let url: URL
  try {
    url = new URL(path, PLACEHOLDER_ORIGIN)
  } catch {
    return fallback
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback

  return `${url.pathname}${url.search}${url.hash}`
}

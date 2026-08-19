// src/lib/safe-redirect.ts

/**
 * Cleans a `?redirect=` value before it is used to navigate.
 *
 * Auth pages carry the page you were trying to reach so you land back there
 * after signing in. That value comes from the URL, which means anybody can
 * choose it — so `https://elsewhere.example` in the query string would turn
 * the login page into a way of bouncing people off the site under Plug.pk's
 * name, which is how phishing links get their credibility.
 *
 * Only a plain internal path is allowed through: one leading slash, and no
 * second one, since `//host` is a protocol-relative URL that browsers treat as
 * another origin. Anything else falls back.
 */
export function safeRedirect(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string') return fallback

  const path = value.trim()
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//')) return fallback
  // A backslash is treated as a slash by some browsers when resolving URLs.
  if (path.startsWith('/\\')) return fallback

  return path
}

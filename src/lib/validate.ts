// src/lib/validate.ts

/**
 * Server-side input checks shared by every public form.
 *
 * The browser's maxlength and type="url" are conveniences; a server action is
 * a POST endpoint anyone can call, so every limit that matters is re-applied
 * here.
 */

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string }

/**
 * A website a member typed, made safe to render as a link.
 *
 * Only http and https survive. Anything else — `javascript:`, `data:` — would
 * run script in the visitor's browser (or an operator's, in the admin portal)
 * when the link is clicked. A bare domain gets https:// so "plug.pk" works.
 * Blank is fine and returns null.
 */
export function checkWebsite(raw: unknown): Checked<string | null> {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return { ok: true, value: null }
  if (text.length > 300) return { ok: false, message: 'That website address is too long.' }

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return { ok: false, message: 'Enter a valid website address, like https://example.com.' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, message: 'Website addresses must start with http:// or https://.' }
  }
  if (!url.hostname.includes('.')) {
    return { ok: false, message: 'Enter a valid website address, like https://example.com.' }
  }
  return { ok: true, value: url.toString() }
}

/**
 * For rendering a stored website. Returns the URL only when it is http(s), so
 * a value written before validation existed can never become a script link.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Trimmed text, capped at max characters. Over-long input is refused, not cut. */
export function checkText(
  raw: unknown,
  label: string,
  { max, required = false, min = 0 }: { max: number; required?: boolean; min?: number },
): Checked<string> {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (required && !text) return { ok: false, message: `Enter ${label}.` }
  if (text && text.length < min) {
    return { ok: false, message: `${capitalise(label)} must be at least ${min} characters.` }
  }
  if (text.length > max) {
    return { ok: false, message: `${capitalise(label)} must be ${max} characters or fewer.` }
  }
  return { ok: true, value: text }
}

/** A deliberately simple shape check; real verification needs a sent email. */
export function checkEmail(raw: unknown): Checked<string> {
  const text = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (!text) return { ok: false, message: 'Enter your email address.' }
  if (text.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) {
    return { ok: false, message: 'Enter a valid email address.' }
  }
  return { ok: true, value: text }
}

/** Pakistani or international phone numbers: digits, spaces, +, -, (). */
export function checkPhone(raw: unknown, { required = false } = {}): Checked<string | null> {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return required ? { ok: false, message: 'Enter a phone number.' } : { ok: true, value: null }
  const digits = text.replace(/\D/g, '')
  if (!/^[\d\s+()-]+$/.test(text) || digits.length < 7 || digits.length > 15) {
    return { ok: false, message: 'Enter a valid phone number, like 0300 1234567.' }
  }
  return { ok: true, value: text }
}

/** Coordinates inside Pakistan's bounding box (with a small margin). */
export function isInPakistan(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= 23 && lat <= 37.5 && lng >= 60.5 && lng <= 78
  )
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

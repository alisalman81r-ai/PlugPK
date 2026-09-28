// src/lib/remembered-car.ts

/**
 * The car a visitor last picked in either EV tool, kept in their own browser.
 *
 * A convenience and nothing more: the charging calculator and the range
 * converter both open on it, so a driver picks their car once rather than on
 * every visit and every tool. It is a slug, never personal data, and it lives
 * only on this device.
 *
 * Storage can be missing or throw — private windows, blocked site data,
 * previews — so every access is guarded and a failure simply means nothing is
 * remembered. A shared link's ?car= always wins over this: someone opening a
 * link should see the car it was sent with.
 */

const KEY = 'plugpk:tools:car'

export function readRememberedCar(): string | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return value && /^[a-z0-9-]{1,120}$/.test(value) ? value : null
  } catch {
    return null
  }
}

export function rememberCar(slug: string | null): void {
  try {
    if (slug) window.localStorage.setItem(KEY, slug)
    else window.localStorage.removeItem(KEY)
  } catch {
    // Not remembered this time; the tools work the same without it.
  }
}

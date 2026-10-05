// src/components/admin/list-params.ts

/**
 * URL state for the admin lists.
 *
 * Search, filters and page live in the query string rather than in component
 * state, so the server can read one page instead of shipping the table, a
 * filtered view can be bookmarked or pasted to a colleague, and Back returns to
 * the same screen. Pure functions with no hooks, so server pages and client
 * controls build links the same way.
 */

export type ListParams = Record<string, string | undefined>

/** Normalises Next's searchParams (which may carry arrays) to plain strings. */
export function flattenParams(raw: Record<string, string | string[] | undefined>): ListParams {
  const out: ListParams = {}
  for (const [key, value] of Object.entries(raw)) {
    const single = Array.isArray(value) ? value[0] : value
    if (single) out[key] = single
  }
  return out
}

/**
 * A link to `path` with `params` changed by `patch`.
 *
 * Any change other than the page itself resets to page 1: a filter applied on
 * page 4 of the old result would otherwise land on a page that may not exist
 * in the new one. Empty values and the defaults ('all', page 1) are dropped so
 * the plain URL stays plain.
 */
export function buildHref(path: string, params: ListParams, patch: ListParams = {}): string {
  const next: ListParams = { ...params, ...patch }
  if (!('page' in patch)) delete next.page

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(next)) {
    if (!value || value === 'all' || (key === 'page' && value === '1')) continue
    search.set(key, value)
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

/** One allowed value from the URL, or the fallback. */
export function pick<T extends string>(raw: string | undefined, allowed: readonly T[], fallback: T): T {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}

// crawler/extract.ts

import type { Locator, Page } from '@playwright/test'

import type { Field } from './types'

/**
 * Reading fields off a page, with the failure reported rather than swallowed.
 *
 * ── The rule these helpers exist to enforce ───────────────────────────
 *
 * A field that cannot be found returns a `Field` carrying its selector and an
 * error, never a bare null. The difference matters more than it sounds: nulls
 * are indistinguishable from "the page genuinely does not state this", so a
 * crawler that returns them silently converts a broken selector into an absent
 * fact. Weeks later the catalogue is missing every battery figure and nothing
 * ever reported an error.
 *
 * ── And the rule for writing selectors ────────────────────────────────
 *
 * Anchor on meaning, never on styling. This project's own pages are the
 * cautionary example: a car card carries no `<article>`, no `data-*` hook and no
 * semantic class — only generated utility classes like
 * `rounded-[calc(1.5rem-1.5px)]`. A selector written against those is a selector
 * that breaks the next time somebody adjusts a corner radius.
 *
 * What survives a redesign: URL shape (`a[href^="/cars/"]`), headings, `alt`
 * text, label text, and the document's own structure. Prefer those, in that
 * order, and when a site leaves no choice but a fragile selector, say so in a
 * comment where the rule is written.
 */

/** Collapses the whitespace a rendered page is full of. */
export function clean(text: string | null | undefined): string | null {
  if (text === null || text === undefined) return null
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * The text of the first match, or a `Field` explaining why there is none.
 *
 * `timeout` is short by default. A missing element is an expected outcome here
 * rather than an error, and waiting thirty seconds to conclude that a page has
 * no price would make a hundred-page crawl take an hour of nothing.
 */
export async function text(
  scope: Page | Locator,
  selector: string,
  timeout = 2_000,
): Promise<Field<string>> {
  try {
    const raw = clean(await scope.locator(selector).first().textContent({ timeout }))
    if (raw === null) {
      return { raw: null, value: null, selector, error: 'matched, but the element is empty' }
    }
    return { raw, value: raw, selector }
  } catch {
    return { raw: null, value: null, selector, error: 'no element matched' }
  }
}

/** The same, for an attribute — `href`, `src`, `alt`, `content`. */
export async function attribute(
  scope: Page | Locator,
  selector: string,
  name: string,
  timeout = 2_000,
): Promise<Field<string>> {
  const where = `${selector}[${name}]`
  try {
    const raw = clean(await scope.locator(selector).first().getAttribute(name, { timeout }))
    if (raw === null) {
      return { raw: null, value: null, selector: where, error: `element has no ${name}` }
    }
    return { raw, value: raw, selector: where }
  } catch {
    return { raw: null, value: null, selector: where, error: 'no element matched' }
  }
}

/**
 * Turns a relative URL absolute.
 *
 * Scraped links are relative far more often than not, and a stored `/cars/x` is
 * useless the moment it leaves the page it came from.
 */
export function absolute(href: string | null, base: string): string | null {
  if (href === null) return null
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

/**
 * Reads a definition-list-shaped block into label → value.
 *
 * Specification tables are the one part of a car page worth taking wholesale: an
 * unrecognised label is still worth keeping, because it is how a source tells
 * you it has started publishing something new. Parsing each into a typed field
 * is a later step's problem — this keeps the strings.
 */
export async function pairs(
  scope: Page | Locator,
  rowSelector: string,
  labelSelector: string,
  valueSelector: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const rows = await scope.locator(rowSelector).all()

  for (const row of rows) {
    const label = clean(await row.locator(labelSelector).first().textContent().catch(() => null))
    const value = clean(await row.locator(valueSelector).first().textContent().catch(() => null))
    if (label !== null && value !== null) out[label] = value
  }

  return out
}

/** How many fields on a record actually carry a value — a per-page health check. */
export function fieldHealth(fields: Field<unknown>[]): { filled: number; total: number } {
  return { filled: fields.filter((f) => f.value !== null).length, total: fields.length }
}

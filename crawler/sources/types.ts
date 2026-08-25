// crawler/sources/types.ts

import type { NormalisedVehicle } from '../model'

/**
 * What every data source implements.
 *
 * One interface for a public dataset, an authenticated API and an HTML page, so
 * the runner does not care which it is talking to — and so a source can be
 * swapped from scraping to an official API later without anything downstream
 * noticing.
 *
 * ── `access()` is the part that matters ───────────────────────────────
 *
 * Every adapter must be able to say, before fetching anything, whether it is
 * allowed to run. Not whether it *can* — whether it *may*. A source with no
 * licence, no API key, or a robots.txt that forbids the path returns `blocked`
 * with a reason, and the runner stops there.
 *
 * This is why an adapter for an inaccessible source is still worth writing: it
 * records what was investigated and what would be needed, in code, instead of in
 * somebody's memory of a conversation.
 */

export type AccessKind =
  /** A published dataset under a licence permitting this use. */
  | 'open-dataset'
  /** An official API, with or without a key. */
  | 'official-api'
  /** HTML, permitted by robots.txt and terms. */
  | 'permitted-scrape'
  /** Reachable, but not permitted — or not verifiable as permitted. */
  | 'blocked'

export interface AccessVerdict {
  kind: AccessKind
  /** True only when the runner may proceed. */
  allowed: boolean
  /** Plain-language justification, stored on the run. */
  reason: string
  /** The licence governing reuse, when one was found and read. */
  licence?: string
  /** Attribution this source's licence requires wherever the data appears. */
  attribution?: string
  /** What is missing, when blocked: a key, a contract, a domain that resolves. */
  requires?: string[]
}

export interface FetchOptions {
  /** Cap on records for a controlled test. Adapters must honour it. */
  limit?: number
  /** Restrict to specific models, for targeted verification. */
  only?: string[]
}

export interface SourceAdapter {
  /** Stable id, used as `CarSource.id`. */
  id: string
  name: string
  baseUrl: string
  /** Default field-level trust. See ../priority.ts. */
  defaultTrust: number
  /**
   * Fields this source is authoritative about, which override defaultTrust.
   * A Pakistani price aggregator may be the best source for a local price and a
   * poor one for a battery chemistry; a global EV dataset is the reverse.
   */
  fieldTrust?: Partial<Record<string, number>>

  /** Whether this adapter may run at all, checked before any fetch. */
  access(): Promise<AccessVerdict>

  /** Fetches and normalises. Only called when access().allowed is true. */
  fetch(options?: FetchOptions): Promise<NormalisedVehicle[]>
}

/** A source that cannot run, with the reason recorded in code. */
export function blockedAdapter(
  config: Pick<SourceAdapter, 'id' | 'name' | 'baseUrl' | 'defaultTrust'> & {
    reason: string
    requires: string[]
    fieldTrust?: Partial<Record<string, number>>
  },
): SourceAdapter {
  return {
    id: config.id,
    name: config.name,
    baseUrl: config.baseUrl,
    defaultTrust: config.defaultTrust,
    ...(config.fieldTrust ? { fieldTrust: config.fieldTrust } : {}),
    access: async () => ({
      kind: 'blocked',
      allowed: false,
      reason: config.reason,
      requires: config.requires,
    }),
    fetch: async () => {
      // Refuses rather than returning empty. An adapter that quietly returns
      // nothing looks like a source with no data, and the run would be recorded
      // as a success that found zero cars.
      throw new Error(`${config.name} is not accessible: ${config.reason}`)
    },
  }
}

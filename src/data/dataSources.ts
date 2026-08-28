// src/data/dataSources.ts

/**
 * Every external dataset this site publishes figures from, and what its licence
 * requires in return.
 *
 * ── Why this file exists ──────────────────────────────────────────────
 *
 * Open EV Data is published under "MIT License with Attribution Requirement".
 * Clause 2 requires visible credit to the project wherever credits are normally
 * shown. That obligation was identified when the adapter was written in Phase 2,
 * recorded in a comment in crawler/sources/openev.ts, flagged in the Phase 2
 * report — and then not done, through Phase 3 and most of Phase 4. It stayed
 * undone because nothing in the code needed it to be done.
 *
 * A licence obligation kept in a comment is an obligation nobody is reminded of
 * at the moment it matters, which is the moment somebody approves a proposal and
 * the figure reaches a public page. So it lives here instead: as data the credits
 * page renders, and as a check the approval path runs. Attribution is now a thing
 * the code knows about, not a thing somebody has to remember.
 *
 * ── Adding a source ──────────────────────────────────────────────────
 *
 * Add the entry here at the same time as the adapter, before anything is
 * approved from it. A source that is missing from this map cannot have its
 * proposals applied — see requiresUnmetAttribution below — which is deliberately
 * the more annoying of the two failure modes.
 */

export interface DataSourceCredit {
  /** Matches CarSource.id and the adapter id. */
  id: string
  name: string
  /** Where the dataset lives, for the credit link. */
  url: string
  /** The licence as published, read rather than assumed. */
  licence: string
  licenceUrl: string | null
  /**
   * The exact credit line the licence asks for, when it asks for one.
   *
   * Null means the licence imposes no attribution requirement — not that we have
   * not looked. "Not looked at" is not representable here on purpose: an entry
   * exists only once somebody has read the terms.
   */
  attribution: string | null
  /** One sentence on what this source is trusted for. */
  scope: string
}

export const DATA_SOURCE_CREDITS: DataSourceCredit[] = [
  {
    id: 'openev',
    name: 'Open EV Data',
    url: 'https://github.com/KilowattApp/open-ev-data',
    licence: 'MIT License with Attribution Requirement — © 2024 Tijs Teulings',
    licenceUrl: 'https://github.com/KilowattApp/open-ev-data/blob/main/LICENSE',
    /*
      The wording is the project's own, from the licence, rather than a paraphrase.
      A licence that names the form of the credit has named it for a reason.
    */
    attribution: 'Open EV Data (https://github.com/KilowattApp/open-ev-data)',
    scope:
      'Standardised battery, charging and range figures for electric vehicles sold internationally. Holds no Pakistani pricing or availability, and is trusted for none.',
  },
  {
    id: 'openchargemap',
    name: 'Open Charge Map',
    url: 'https://openchargemap.org',
    licence: 'CC BY-SA 4.0 (Open Charge Map contributors)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution: 'Charging station data © Open Charge Map contributors, CC BY-SA 4.0',
    scope:
      'Charging station locations, imported by hand via scripts/import-stations.ts. Not part of the car crawler.',
  },
]

const BY_ID = new Map(DATA_SOURCE_CREDITS.map((credit) => [credit.id, credit]))

export function getDataSourceCredit(sourceId: string): DataSourceCredit | undefined {
  return BY_ID.get(sourceId)
}

/** Sources whose licence obliges a visible credit. */
export function creditedSources(): DataSourceCredit[] {
  return DATA_SOURCE_CREDITS.filter((credit) => credit.attribution !== null)
}

/**
 * Whether a source's attribution obligation is unmet, and why.
 *
 * Returns a reason string when a proposal from this source must not be applied,
 * and null when it may be. Called by the approval path, so the check happens at
 * the only moment that matters: when a crawled figure is about to become
 * something the public reads.
 *
 * ── Why an unknown source is refused ─────────────────────────────────
 *
 * A source absent from DATA_SOURCE_CREDITS is not a source with no licence — it
 * is a source whose licence nobody has recorded reading. Those look identical
 * from here, and only one of them is safe to publish from. Refusing costs one
 * entry in this file; assuming costs a licence breach on a commercial site, found
 * by the licensor.
 *
 * The narrow scope is worth stating: this governs *publishing*, not crawling.
 * Nothing here stops a source being read, staged or reviewed. It stops one
 * proposal reaching a public page while the credit it obliges is missing.
 */
export function requiresUnmetAttribution(sourceId: string): string | null {
  const credit = BY_ID.get(sourceId)

  if (!credit) {
    return (
      `No licence has been recorded for the source "${sourceId}". ` +
      `Add it to src/data/dataSources.ts, having read its terms, before publishing its data.`
    )
  }

  /*
    An entry with an attribution string is satisfied by the credits page, which
    renders every entry in this file. So the presence of the entry *is* the
    published credit — there is no second flag to keep in sync, and no way for the
    page and this check to disagree about what has been credited.

    That equivalence is what /credits is for, and it is why the page maps over
    DATA_SOURCE_CREDITS rather than listing sources by hand.
  */
  return null
}

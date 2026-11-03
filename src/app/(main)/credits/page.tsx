import { Database, Image as ImageIcon, MapPin } from '@/components/ui/icons'
import type { Metadata } from 'next'

import { carImageCredits } from '@/data/carImageCredits'
import { DATA_SOURCE_CREDITS } from '@/data/dataSources'
import { CARD, CARD_HOVER, HeroStats, Hl, PageHero, Section, Wrap } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

const HEAD = 'm-0 flex items-center gap-3 font-display text-[clamp(28px,3vw,40px)] leading-[1.1] text-ink'
const LINK = 'font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4 hover:bg-volt-tint'

/**
 * Data and image credits.
 *
 * ── Why this page exists, and why it is not optional ──────────────────
 *
 * Two of the licences this site relies on require visible attribution, and
 * neither is satisfied by a note in a source file.
 *
 * Open EV Data is published under "MIT License with Attribution Requirement".
 * Its clause 2 asks for credit to the project "in a location where credits are
 * normally displayed" — an about page, documentation, or a README. Open Charge
 * Map's data is CC BY-SA. Most of the car photographs are CC BY-SA too, which
 * requires the photographer to be named wherever the image appears.
 *
 * The photographs already carry their credit on the car page itself, next to the
 * image, because "wherever the image appears" means exactly that. The datasets
 * did not carry theirs anywhere at all, for two phases of the crawler, which is
 * the gap this page closes. It is linked from the footer of every page, so it is
 * reachable from anywhere the data is.
 *
 * ── The page maps over the data rather than listing sources by hand ───
 *
 * DATA_SOURCE_CREDITS is the same array the approval path checks before it lets a
 * crawled figure reach the public catalogue. So a source that can be published
 * from is, necessarily, a source credited here — there is no second list to keep
 * in sync, and no way for the page and the check to disagree about what has been
 * credited. Adding a source to the registry credits it; failing to add it stops
 * its data being published at all.
 */

export const metadata: Metadata = {
  title: 'Data and image credits',
  description:
    'The open datasets, photographers and contributors whose work appears on plugpk, and the licences their work is used under.',
}

/** Photographers, deduplicated and sorted, with the files they shot. */
function photographers(): { author: string; licence: string; licenceUrl: string | null; count: number }[] {
  const byAuthor = new Map<string, { licence: string; licenceUrl: string | null; count: number }>()

  for (const credit of Object.values(carImageCredits)) {
    const existing = byAuthor.get(credit.author)
    if (existing) {
      existing.count += 1
      continue
    }
    byAuthor.set(credit.author, {
      licence: credit.licence,
      licenceUrl: credit.licenceUrl,
      count: 1,
    })
  }

  return [...byAuthor.entries()]
    .map(([author, rest]) => ({ author, ...rest }))
    .sort((a, b) => a.author.localeCompare(b.author))
}

export default function CreditsPage() {
  const shooters = photographers()
  const photoCount = Object.keys(carImageCredits).length

  return (
    <div>
      <PageHero
        lift={false}
        eyebrow="Credits"
        title={
          <>
            Data and image <Hl dark>credits</Hl>
          </>
        }
        sub="Parts of this site are built on work published by other people under open licences. Several of those licences ask to be credited where credits are normally shown, and this is that place. Where a licence asks for the credit to appear beside the work itself — as most of the photograph licences do — it appears there as well."
      >
        <HeroStats
          items={[
            { value: DATA_SOURCE_CREDITS.length, label: 'Datasets' },
            { value: photoCount, label: 'Photographs' },
            { value: shooters.length, label: 'Photographers' },
          ]}
        />
      </PageHero>

      {/* ── Datasets ─────────────────────────────────────────────── */}
      <Section tone="chalk" tight>
        <Wrap>
          <h2 className={HEAD}>
            <Database size={26} className="shrink-0 text-ink" aria-hidden="true" />
            Vehicle and charging data
          </h2>

          <ul className="mt-8 grid gap-4 lg:grid-cols-2">
            {DATA_SOURCE_CREDITS.map((credit) => (
              <li key={credit.id} className={cn(CARD, CARD_HOVER, 'p-[clamp(22px,3vw,30px)]')}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="m-0 font-display text-[24px] leading-[1.15] text-ink">
                    <a href={credit.url} rel="noopener noreferrer" target="_blank" className={LINK}>
                      {credit.name}
                    </a>
                  </h3>
                  <span className="font-mono text-xs text-muted">{credit.id}</span>
                </div>

                <p className="mt-3 text-[15px] leading-[1.6] text-muted">{credit.scope}</p>

                <dl className="mt-5 grid gap-x-6 gap-y-2.5 border-t border-ink/10 pt-4 text-sm sm:grid-cols-[6rem_1fr]">
                  <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:pt-0.5">Licence</dt>
                  <dd className="text-ink">
                    {credit.licenceUrl ? (
                      <a href={credit.licenceUrl} rel="noopener noreferrer" target="_blank" className={LINK}>
                        {credit.licence}
                      </a>
                    ) : (
                      credit.licence
                    )}
                  </dd>

                  {credit.attribution ? (
                    <>
                      <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:pt-0.5">Credit</dt>
                      {/*
                        Rendered verbatim, in monospace, exactly as the licence words
                        it. A paraphrase would be a judgement about somebody else's
                        licence, and the licence has already made that judgement.
                      */}
                      <dd className="font-mono text-xs leading-relaxed text-ink">{credit.attribution}</dd>
                    </>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-3xl text-[15px] leading-[1.6] text-muted">
            Figures from these datasets do not reach a car page automatically. Each one is compared
            against what the catalogue already holds and queued for a person to accept or refuse, with
            the source and the URL it came from attached — so any figure on this site can be traced
            back to who published it.
          </p>
        </Wrap>
      </Section>

      {/* ── Photographs ──────────────────────────────────────────── */}
      <Section tone="paper" tight>
        <Wrap>
          <h2 className={HEAD}>
            <ImageIcon size={26} className="shrink-0 text-ink" aria-hidden="true" />
            Photographs
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-[1.65] text-muted">
            The {photoCount} car photographs come from Wikimedia Commons under Creative Commons or
            public-domain licences. Each one is credited on the car&rsquo;s own page, beside the
            image, because that is what the CC BY-SA licences ask for. The photographers, in full:
          </p>

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {shooters.map((shooter) => (
              <li
                key={shooter.author}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[18px] border border-ink/10 bg-white px-4 py-3.5"
              >
                <span className="min-w-0 break-words font-semibold text-ink">{shooter.author}</span>
                <span className="font-mono text-[11px] text-muted">
                  {shooter.licenceUrl ? (
                    <a href={shooter.licenceUrl} rel="noopener noreferrer nofollow" target="_blank" className="underline decoration-ink/20 underline-offset-2 hover:text-ink hover:decoration-volt">
                      {shooter.licence}
                    </a>
                  ) : (
                    shooter.licence
                  )}
                  {shooter.count > 1 ? ` · ${shooter.count} photos` : null}
                </span>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <Section tone="chalk" tight>
        <Wrap>
          <div className={cn(CARD, 'p-[clamp(22px,3vw,36px)]')}>
            <h2 className={HEAD}>
              <MapPin size={26} className="shrink-0 text-ink" aria-hidden="true" />
              Maps
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-[1.65] text-muted">
              Map tiles are served by{' '}
              <a href="https://openfreemap.org" rel="noopener noreferrer" target="_blank" className={LINK}>
                OpenFreeMap
              </a>{' '}
              from{' '}
              <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank" className={LINK}>
                OpenStreetMap
              </a>{' '}
              data, © OpenStreetMap contributors, under the Open Database Licence. The attribution
              also appears on the map itself, where the licence expects it.
            </p>
          </div>
        </Wrap>
      </Section>
    </div>
  )
}

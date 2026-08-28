import { Database, Image as ImageIcon, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

import { carImageCredits } from '@/data/carImageCredits'
import { DATA_SOURCE_CREDITS } from '@/data/dataSources'

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
    'The open datasets, photographers and contributors whose work appears on Plug.pk, and the licences their work is used under.',
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
    <main className="container-plug py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="text-ui-xs font-semibold uppercase tracking-[0.18em] text-plug-blue-600">
          Credits
        </p>
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-slate-900">
          Data and image credits
        </h1>
        <p className="mt-5 text-base leading-relaxed text-slate-600">
          Parts of this site are built on work published by other people under open licences.
          Several of those licences ask to be credited where credits are normally shown, and this is
          that place. Where a licence asks for the credit to appear beside the work itself — as
          most of the photograph licences do — it appears there as well.
        </p>
      </header>

      {/* ── Datasets ─────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.01em] text-slate-900">
          <Database size={20} className="text-plug-blue-600" aria-hidden="true" />
          Vehicle and charging data
        </h2>

        <ul className="mt-6 flex flex-col gap-5">
          {DATA_SOURCE_CREDITS.map((credit) => (
            <li
              key={credit.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  <a
                    href={credit.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="underline decoration-slate-300 decoration-2 underline-offset-4 transition-colors hover:decoration-plug-blue-500"
                  >
                    {credit.name}
                  </a>
                </h3>
                <span className="font-mono text-ui-xs text-slate-400">{credit.id}</span>
              </div>

              <p className="mt-2.5 text-ui-sm leading-relaxed text-slate-600">{credit.scope}</p>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-ui-sm sm:grid-cols-[7rem_1fr]">
                <dt className="font-semibold text-slate-500">Licence</dt>
                <dd className="text-slate-700">
                  {credit.licenceUrl ? (
                    <a
                      href={credit.licenceUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="underline hover:text-plug-blue-700"
                    >
                      {credit.licence}
                    </a>
                  ) : (
                    credit.licence
                  )}
                </dd>

                {credit.attribution ? (
                  <>
                    <dt className="font-semibold text-slate-500">Credit</dt>
                    {/*
                      Rendered verbatim, in monospace, exactly as the licence words
                      it. A paraphrase would be a judgement about somebody else's
                      licence, and the licence has already made that judgement.
                    */}
                    <dd className="font-mono text-ui-xs leading-relaxed text-slate-700">
                      {credit.attribution}
                    </dd>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-3xl text-ui-sm leading-relaxed text-slate-500">
          Figures from these datasets do not reach a car page automatically. Each one is compared
          against what the catalogue already holds and queued for a person to accept or refuse, with
          the source and the URL it came from attached — so any figure on this site can be traced
          back to who published it.
        </p>
      </section>

      {/* ── Photographs ──────────────────────────────────────────── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.01em] text-slate-900">
          <ImageIcon size={20} className="text-plug-blue-600" aria-hidden="true" />
          Photographs
        </h2>

        <p className="mt-4 max-w-3xl text-ui-sm leading-relaxed text-slate-600">
          The {photoCount} car photographs come from Wikimedia Commons under Creative Commons or
          public-domain licences. Each one is credited on the car&rsquo;s own page, beside the
          image, because that is what the CC BY-SA licences ask for. The photographers, in full:
        </p>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shooters.map((shooter) => (
            <li
              key={shooter.author}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <span className="font-semibold text-slate-800">{shooter.author}</span>
              <span className="text-ui-xs text-slate-500">
                {shooter.licenceUrl ? (
                  <a
                    href={shooter.licenceUrl}
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    className="underline hover:text-plug-blue-700"
                  >
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
      </section>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.01em] text-slate-900">
          <MapPin size={20} className="text-plug-blue-600" aria-hidden="true" />
          Maps
        </h2>
        <p className="mt-4 max-w-3xl text-ui-sm leading-relaxed text-slate-600">
          Map tiles are served by{' '}
          <a
            href="https://openfreemap.org"
            rel="noopener noreferrer"
            target="_blank"
            className="underline hover:text-plug-blue-700"
          >
            OpenFreeMap
          </a>{' '}
          from{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            rel="noopener noreferrer"
            target="_blank"
            className="underline hover:text-plug-blue-700"
          >
            OpenStreetMap
          </a>{' '}
          data, © OpenStreetMap contributors, under the Open Database Licence. The attribution
          also appears on the map itself, where the licence expects it.
        </p>
      </section>
    </main>
  )
}
